import { describe, expect, test } from 'vitest';

import { parseZoneMembers } from './zoneMembers';

describe('parseZoneMembers', () => {
  test('splits by commas and trims entries', () => {
    const result = parseZoneMembers(' Alice, Bob , ,Carol  ');
    expect(result).toEqual(['Alice', 'Bob', 'Carol']);
  });

  test('supports localized comma separators', () => {
    const input = `Alice\uFF0CBob\u3001Carol\u060CDan`;
    const result = parseZoneMembers(input);
    expect(result).toEqual(['Alice', 'Bob', 'Carol', 'Dan']);
  });
});
