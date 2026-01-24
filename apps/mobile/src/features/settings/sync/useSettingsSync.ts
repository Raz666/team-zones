import { useEffect, useRef, useState } from 'react';
import { apiRequest } from '../../../shared/api/client';
import type { Zone } from '../../zones/storage/zonesRepository';
import {
  clearPendingSettings,
  loadPendingSettings,
  loadSettingsVersion,
  savePendingSettings,
  saveSettingsVersion,
} from './storage';
import { buildSettingsPayload, parseSettingsPayload } from './payload';

const SETTINGS_MAX_BYTES = 64 * 1024;

type UseSettingsSyncOptions = {
  zones: Zone[];
  replaceZones: (zones: Zone[]) => void;
  zonesHydrated: boolean;
  isAuthenticated: boolean;
};

type ServerSettingsResponse = {
  version: number;
  settingsJson: string;
  createdAt: string;
  updatedAt: string;
};

const getSettingsSize = (json: string): number => {
  try {
    return new TextEncoder().encode(json).length;
  } catch {
    return unescape(encodeURIComponent(json)).length;
  }
};

export const useSettingsSync = ({
  zones,
  replaceZones,
  zonesHydrated,
  isAuthenticated,
}: UseSettingsSyncOptions) => {
  const [version, setVersion] = useState<number | null>(null);
  const [versionHydrated, setVersionHydrated] = useState(false);
  const skipNextPush = useRef(false);

  useEffect(() => {
    let active = true;

    loadSettingsVersion()
      .then((stored) => {
        if (active) {
          setVersion(stored);
        }
      })
      .finally(() => {
        if (active) {
          setVersionHydrated(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const applyRemoteSettings = async (payload: ServerSettingsResponse) => {
    const parsed = parseSettingsPayload(payload.settingsJson);
    if (!parsed) {
      return;
    }

    skipNextPush.current = true;
    replaceZones(parsed.zones);
    setVersion(payload.version);
    await saveSettingsVersion(payload.version);
    await clearPendingSettings();
  };

  const fetchRemoteSettings = async () => {
    const response = await apiRequest<ServerSettingsResponse>({
      path: '/settings',
      method: 'GET',
    });

    if (response.status === 204 || !response.data) {
      return;
    }

    if (!response.ok) {
      return;
    }

    const remoteVersion = response.data.version;
    const localVersion = version ?? 0;

    if (remoteVersion > localVersion) {
      await applyRemoteSettings(response.data);
    }
  };

  const pushPendingSettings = async () => {
    const pending = await loadPendingSettings();
    if (!pending) return;

    const parsed = parseSettingsPayload(pending.settingsJson);
    if (!parsed) {
      await clearPendingSettings();
      return;
    }

    const response = await apiRequest<ServerSettingsResponse>({
      path: '/settings',
      method: 'PUT',
      body: {
        version: pending.version,
        settings: parsed,
      },
    });

    if (response.status === 409) {
      await fetchRemoteSettings();
      return;
    }

    if (response.ok) {
      await clearPendingSettings();
    }
  };

  useEffect(() => {
    if (!zonesHydrated || !versionHydrated) return;
    if (!isAuthenticated) return;

    fetchRemoteSettings()
      .then(() => pushPendingSettings())
      .catch((error) => {
        console.warn('Failed to fetch remote settings', error);
      });
  }, [zonesHydrated, versionHydrated, isAuthenticated]);

  useEffect(() => {
    if (!zonesHydrated || !versionHydrated) return;
    if (!isAuthenticated) return;

    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }

    const payload = buildSettingsPayload(zones);
    const settingsJson = JSON.stringify(payload);
    if (getSettingsSize(settingsJson) > SETTINGS_MAX_BYTES) {
      console.warn('Settings payload exceeds 64KB, skipping sync');
      return;
    }

    const nextVersion = (version ?? 0) + 1;
    setVersion(nextVersion);
    void saveSettingsVersion(nextVersion);
    void savePendingSettings({ version: nextVersion, settingsJson });

    pushPendingSettings().catch((error) => {
      console.warn('Failed to sync settings', error);
    });
  }, [zones, zonesHydrated, versionHydrated, isAuthenticated]);
};
