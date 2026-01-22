import AsyncStorage from '@react-native-async-storage/async-storage';

export type Zone = {
  label: string;
  timeZone: string;
  members?: string[];
};

const STORAGE_KEY = 'teamzones:zones:v1';

const parseZones = (raw: string | null): Zone[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Zone[]) : [];
  } catch (error) {
    console.warn('Failed to load saved zones', error);
    return [];
  }
};

export async function loadZones(): Promise<Zone[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return parseZones(stored);
  } catch (error) {
    console.warn('Failed to load saved zones', error);
    return [];
  }
}

export async function saveZones(zones: Zone[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  } catch (error) {
    console.warn('Failed to save zones', error);
  }
}
