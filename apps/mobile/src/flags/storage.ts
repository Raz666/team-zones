import AsyncStorage from '@react-native-async-storage/async-storage';

import type { LocalOverrides, RemoteFlagsPayload } from './types';
import { isPlainObject, isRemoteFlagsPayload } from './validation';

export const STORAGE_KEYS = {
  deviceId: '@flags/deviceId',
  remote: '@flags/remote',
  remoteFetchedAt: '@flags/remoteFetchedAt',
  localOverrides: '@flags/localOverrides',
} as const;

const parseJson = <T>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const sanitizeOverrides = (value: unknown): LocalOverrides => {
  if (!isPlainObject(value)) return {};

  const next: LocalOverrides = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'boolean') {
      next[key] = entry;
    }
  }

  return next;
};

const sanitizeRemoteFlags = (value: unknown): RemoteFlagsPayload | null => {
  if (!isRemoteFlagsPayload(value)) return null;

  return value;
};

export async function loadDeviceId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.deviceId);
  } catch {
    return null;
  }
}

export async function saveDeviceId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.deviceId, id);
  } catch {
    return;
  }
}

export async function loadRemoteFlags(): Promise<RemoteFlagsPayload | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.remote);
    const parsed = parseJson<unknown>(stored);

    return sanitizeRemoteFlags(parsed);
  } catch {
    return null;
  }
}

export async function saveRemoteFlags(payload: RemoteFlagsPayload): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.remote, JSON.stringify(payload));
  } catch {
    return;
  }
}

export async function loadRemoteFetchedAt(): Promise<number | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.remoteFetchedAt);
    if (!stored) return null;

    const parsed = Number(stored);

    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveRemoteFetchedAt(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.remoteFetchedAt, String(timestamp));
  } catch {
    return;
  }
}

export async function loadOverrides(): Promise<LocalOverrides> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.localOverrides);
    const parsed = parseJson<unknown>(stored);

    return sanitizeOverrides(parsed);
  } catch {
    return {};
  }
}

export async function saveOverrides(overrides: LocalOverrides): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.localOverrides, JSON.stringify(overrides));
  } catch {
    return;
  }
}

export async function clearOverrides(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.localOverrides);
  } catch {
    return;
  }
}
