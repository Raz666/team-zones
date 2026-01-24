import type { Zone } from '../../zones/storage/zonesRepository';

export type SettingsPayload = {
  zones: Zone[];
};

export const buildSettingsPayload = (zones: Zone[]): SettingsPayload => ({
  zones,
});

const isZone = (value: unknown): value is Zone => {
  if (!value || typeof value !== 'object') return false;
  const zone = value as Zone;
  return typeof zone.label === 'string' && typeof zone.timeZone === 'string';
};

export const parseSettingsPayload = (json: string): SettingsPayload | null => {
  try {
    const parsed = JSON.parse(json) as SettingsPayload;
    if (!parsed || !Array.isArray(parsed.zones)) {
      return null;
    }
    if (!parsed.zones.every(isZone)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
