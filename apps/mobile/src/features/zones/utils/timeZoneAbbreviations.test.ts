import { describe, expect, test } from 'vitest';

import {
  getTimeZoneAbbreviationLabelsForZone,
  getTimeZoneAbbreviationMatch,
} from './timeZoneAbbreviations';

describe('timeZoneAbbreviations', () => {
  test('returns abbreviation labels for a zone', () => {
    const labels = getTimeZoneAbbreviationLabelsForZone('America/Chicago', 'CST');

    expect(labels).toEqual([{ abbreviation: 'CST', name: 'Central Standard Time' }]);
  });

  test('returns primary time zone id for an abbreviation match', () => {
    const match = getTimeZoneAbbreviationMatch('ist');

    expect(match?.primaryTimeZoneId).toBe('Asia/Kolkata');
  });
});
