import { beforeEach, describe, expect, test, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadZones, saveZones } from './zonesRepository';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

const getItemMock = vi.mocked(AsyncStorage.getItem);
const setItemMock = vi.mocked(AsyncStorage.setItem);

describe('zonesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loadZones returns empty array when storage is empty', async () => {
    getItemMock.mockResolvedValueOnce(null);

    const zones = await loadZones();

    expect(zones).toEqual([]);
  });

  test('loadZones returns empty array for invalid JSON', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    getItemMock.mockResolvedValueOnce('{bad-json');

    const zones = await loadZones();

    expect(zones).toEqual([]);
    warnSpy.mockRestore();
  });

  test('saveZones persists JSON to AsyncStorage', async () => {
    const zones = [{ label: 'Tokyo', timeZone: 'Asia/Tokyo', members: ['Aki'] }];

    await saveZones(zones);

    expect(setItemMock).toHaveBeenCalledWith('teamzones:zones:v1', JSON.stringify(zones));
  });
});
