import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getOrCreateDeviceId } from './deviceId';
import { fetchRemoteFlags, isFlagsStale } from './fetcher';
import {
  clearOverrides as clearOverridesStorage,
  loadOverrides,
  loadRemoteFetchedAt,
  loadRemoteFlags,
  saveOverrides,
  saveRemoteFetchedAt,
  saveRemoteFlags,
} from './storage';
import type { FlagsRuntimeSnapshot, LocalOverrides, RemoteFlagsPayload } from './types';

type FlagsRuntimeActions = {
  refreshFlags: () => Promise<RemoteFlagsPayload | null>;
  setOverride: (name: string, value: boolean | null) => Promise<void>;
  clearOverrides: () => Promise<void>;
};

export type FlagsContextValue = {
  snapshot: FlagsRuntimeSnapshot;
  refreshFlags: () => Promise<RemoteFlagsPayload | null>;
  setOverride: (name: string, value: boolean | null) => Promise<void>;
  clearOverrides: () => Promise<void>;
};

const initialSnapshot: FlagsRuntimeSnapshot = {
  deviceId: null,
  remote: null,
  remoteFetchedAt: null,
  overrides: {},
};

const noopActions: FlagsRuntimeActions = {
  refreshFlags: async () => null,
  setOverride: async () => {},
  clearOverrides: async () => {},
};

let runtimeSnapshot = initialSnapshot;
let runtimeActions: FlagsRuntimeActions = noopActions;

export const FlagsContext = createContext<FlagsContextValue | null>(null);

export const getRuntimeSnapshot = (): FlagsRuntimeSnapshot => runtimeSnapshot;

export const getRuntimeActions = (): FlagsRuntimeActions => runtimeActions;

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<FlagsRuntimeSnapshot>(initialSnapshot);
  const snapshotRef = useRef(snapshot);
  const refreshInFlightRef = useRef<Promise<RemoteFlagsPayload | null> | null>(null);
  const mountedRef = useRef(true);

  const updateSnapshot = useCallback((next: FlagsRuntimeSnapshot) => {
    snapshotRef.current = next;
    runtimeSnapshot = next;

    if (mountedRef.current) {
      setSnapshot(next);
    }
  }, []);

  const refreshFlagsInternal = useCallback(
    async (options?: { force?: boolean }) => {
      const force = options?.force ?? false;
      const current = snapshotRef.current;

      if (!force && current.remote && !isFlagsStale(current.remoteFetchedAt)) {
        return current.remote;
      }

      if (refreshInFlightRef.current) {
        return refreshInFlightRef.current;
      }

      const task = (async () => {
        const result = await fetchRemoteFlags();

        if (!result) return null;

        try {
          await saveRemoteFlags(result.payload);
          await saveRemoteFetchedAt(result.fetchedAt);
        } catch {
          if (__DEV__) {
            console.warn('Failed to persist remote flags');
          }
        }

        const nextSnapshot = {
          ...snapshotRef.current,
          remote: result.payload,
          remoteFetchedAt: result.fetchedAt,
        };

        updateSnapshot(nextSnapshot);

        return result.payload;
      })();

      refreshInFlightRef.current = task;

      try {
        return await task;
      } finally {
        refreshInFlightRef.current = null;
      }
    },
    [updateSnapshot],
  );

  const refreshFlags = useCallback(() => refreshFlagsInternal(), [refreshFlagsInternal]);

  const setOverride = useCallback(
    async (name: string, value: boolean | null) => {
      const currentOverrides = snapshotRef.current.overrides;
      const nextOverrides: LocalOverrides = { ...currentOverrides };

      if (typeof value === 'boolean') {
        nextOverrides[name] = value;
      } else {
        delete nextOverrides[name];
      }

      try {
        await saveOverrides(nextOverrides);
      } catch {
        if (__DEV__) {
          console.warn('Failed to persist flag overrides');
        }
      }

      const nextSnapshot = { ...snapshotRef.current, overrides: nextOverrides };
      updateSnapshot(nextSnapshot);
    },
    [updateSnapshot],
  );

  const clearOverrides = useCallback(async () => {
    try {
      await clearOverridesStorage();
    } catch {
      if (__DEV__) {
        console.warn('Failed to clear flag overrides');
      }
    }

    const nextSnapshot = { ...snapshotRef.current, overrides: {} };
    updateSnapshot(nextSnapshot);
  }, [updateSnapshot]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    runtimeActions = { refreshFlags, setOverride, clearOverrides };

    return () => {
      runtimeActions = noopActions;
    };
  }, [clearOverrides, refreshFlags, setOverride]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [deviceId, remote, remoteFetchedAt, overrides] = await Promise.all([
        getOrCreateDeviceId(),
        loadRemoteFlags(),
        loadRemoteFetchedAt(),
        loadOverrides(),
      ]);

      if (cancelled) return;

      const nextSnapshot = { deviceId, remote, remoteFetchedAt, overrides };
      updateSnapshot(nextSnapshot);

      if (isFlagsStale(remoteFetchedAt)) {
        void refreshFlagsInternal({ force: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshFlagsInternal, updateSnapshot]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshFlags();
      }
    });

    return () => subscription.remove();
  }, [refreshFlags]);

  const value = useMemo(
    () => ({
      snapshot,
      refreshFlags,
      setOverride,
      clearOverrides,
    }),
    [clearOverrides, refreshFlags, setOverride, snapshot],
  );

  return <FlagsContext.Provider value={value}>{children}</FlagsContext.Provider>;
}
