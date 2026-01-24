import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  version: 'teamzones:settings:version:v1',
  pending: 'teamzones:settings:pending:v1',
} as const;

export type PendingSettings = {
  version: number;
  settingsJson: string;
};

export const loadSettingsVersion = async (): Promise<number | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.version);
    if (!stored) return null;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveSettingsVersion = async (version: number): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.version, String(version));
  } catch {
    return;
  }
};

export const loadPendingSettings = async (): Promise<PendingSettings | null> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.pending);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as PendingSettings;
    if (typeof parsed.version !== 'number' || typeof parsed.settingsJson !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const savePendingSettings = async (pending: PendingSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.pending, JSON.stringify(pending));
  } catch {
    return;
  }
};

export const clearPendingSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.pending);
  } catch {
    return;
  }
};
