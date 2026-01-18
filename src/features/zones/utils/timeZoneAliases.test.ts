import { describe, expect, test } from 'vitest';

import { normalizeTimeZoneId } from './timeZoneUtils';

describe('normalizeTimeZoneId', () => {
  test('resolves legacy aliases', () => {
    expect(normalizeTimeZoneId('US/Eastern')).toBe('America/New_York');
    expect(normalizeTimeZoneId('GMT')).toBe('Etc/UTC');
  });

  test('returns unknown zones as-is', () => {
    expect(normalizeTimeZoneId('Europe/Paris')).toBe('Europe/Paris');
  });
});
