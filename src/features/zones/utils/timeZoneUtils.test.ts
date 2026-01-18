import { describe, expect, test } from 'vitest';
import { dayTagForZone, weekdayInZone } from './timeZoneUtils';

// Device time zone is passed explicitly for deterministic tests.

describe('dayTagForZone', () => {
  const deviceTz = 'UTC';

  test('same day returns today', () => {
    const now = new Date('2024-01-02T12:00:00Z');
    expect(dayTagForZone(now, 'UTC', deviceTz)).toBe('today');
    expect(dayTagForZone(now, 'Europe/London', deviceTz)).toBe('today');
  });

  test('ahead by a day returns tomo', () => {
    const now = new Date('2024-01-02T23:30:00Z'); // UTC late, Tokyo is next day
    expect(dayTagForZone(now, 'Asia/Tokyo', deviceTz)).toBe('tomo');
  });

  test('behind by a day returns yday', () => {
    const now = new Date('2024-01-02T01:00:00Z'); // UTC early, Honolulu is prior day
    expect(dayTagForZone(now, 'Pacific/Honolulu', deviceTz)).toBe('yday');
  });

  test('weekday formatting matches actual weekday in zone', () => {
    const utcMidnight = new Date('2024-01-01T00:00:00Z'); // Monday UTC
    expect(weekdayInZone(utcMidnight, 'UTC')).toBe('Mon');
    // In Los Angeles this moment is still Sunday.
    expect(weekdayInZone(utcMidnight, 'America/Los_Angeles')).toBe('Sun');
  });
});
