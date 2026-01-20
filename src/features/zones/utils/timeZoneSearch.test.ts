import { describe, expect, test } from 'vitest';

import type { TimeZoneOption } from './timeZoneDisplay';
import { filterTimeZoneOptions } from './timeZoneSearch';

const makeOption = (
  id: string,
  timeZoneId: string,
  label: string,
  searchText: string,
): TimeZoneOption => ({
  id,
  timeZoneId,
  city: label,
  label,
  searchText,
});

describe('filterTimeZoneOptions', () => {
  test('preserves input order for multiple matches', () => {
    const options = [
      makeOption('utc', 'Etc/UTC', 'UTC', 'match'),
      makeOption('paris', 'Europe/Paris', 'Paris', 'match'),
    ];
    const now = new Date('2024-01-01T00:00:00Z');

    const results = filterTimeZoneOptions(options, 'match', now);

    expect(results).toEqual(options);
  });

  test('matches GMT offset labels', () => {
    const options = [makeOption('utc', 'Etc/UTC', 'UTC', 'coordinated universal time')];
    const now = new Date('2024-01-01T00:00:00Z');

    const results = filterTimeZoneOptions(options, 'gmt+0', now);

    expect(results).toHaveLength(1);
    expect(results[0]?.timeZoneId).toBe('Etc/UTC');
  });

  test('prioritizes abbreviation matches with primary time zone', () => {
    const options = [
      makeOption('shanghai', 'Asia/Shanghai', 'Shanghai', 'cst'),
      makeOption('chicago', 'America/Chicago', 'Chicago', 'cst'),
      makeOption('madrid', 'Europe/Madrid', 'Madrid', 'cst'),
    ];
    const now = new Date('2024-01-01T00:00:00Z');

    const results = filterTimeZoneOptions(options, 'CST', now);

    expect(results.map((option) => option.timeZoneId)).toEqual([
      'America/Chicago',
      'Asia/Shanghai',
      'Europe/Madrid',
    ]);
  });
});
