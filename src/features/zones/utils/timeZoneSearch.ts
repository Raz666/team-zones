import { formatUtcOffsetLabel } from './timeZoneDisplay';
import { getTimeZoneAbbreviationMatch } from './timeZoneAbbreviations';
import { normalizeTimeZoneId } from './timeZoneUtils';
import type { TimeZoneOption } from './timeZoneDisplay';

type MatchEntry = {
  option: TimeZoneOption;
  index: number;
  isAbbreviationMatch: boolean;
  region: string | null;
};

const getIanaRegion = (timeZoneId: string): string | null => {
  const zoneId = normalizeTimeZoneId(timeZoneId);
  const [region] = zoneId.split('/');
  return region ?? null;
};

const getDeviceRegion = (): string | null => {
  try {
    const zoneId = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zoneId) return null;
    return getIanaRegion(zoneId);
  } catch {
    return null;
  }
};

export function filterTimeZoneOptions(
  options: TimeZoneOption[],
  search: string,
  now: Date,
): TimeZoneOption[] {
  const trimmed = search.trim();
  const term = trimmed.toLowerCase();
  if (!term) return options;

  const abbreviationMatch = getTimeZoneAbbreviationMatch(trimmed);
  const abbreviationTimeZoneIds = abbreviationMatch
    ? new Set(abbreviationMatch.timeZoneIds.map((id) => normalizeTimeZoneId(id)))
    : null;
  const deviceRegion = abbreviationMatch ? getDeviceRegion() : null;

  const matches: MatchEntry[] = [];

  options.forEach((option, index) => {
    if (option.searchText.includes(term)) {
      matches.push({
        option,
        index,
        isAbbreviationMatch: Boolean(
          abbreviationTimeZoneIds && abbreviationTimeZoneIds.has(option.timeZoneId),
        ),
        region: abbreviationMatch ? getIanaRegion(option.timeZoneId) : null,
      });
      return;
    }
    const offsetLabel = formatUtcOffsetLabel(option.timeZoneId, now).toLowerCase();
    if (offsetLabel.includes(term)) {
      matches.push({
        option,
        index,
        isAbbreviationMatch: false,
        region: null,
      });
      return;
    }
    if (offsetLabel.startsWith('utc')) {
      const gmtLabel = `gmt${offsetLabel.slice(3)}`;
      if (gmtLabel.includes(term)) {
        matches.push({
          option,
          index,
          isAbbreviationMatch: false,
          region: null,
        });
      }
    }
  });

  if (!abbreviationMatch) {
    return matches.map((entry) => entry.option);
  }

  const primaryTimeZoneId = abbreviationMatch.primaryTimeZoneId;

  matches.sort((a, b) => {
    if (a.isAbbreviationMatch !== b.isAbbreviationMatch) {
      return a.isAbbreviationMatch ? -1 : 1;
    }
    if (!a.isAbbreviationMatch) {
      return a.index - b.index;
    }
    if (primaryTimeZoneId) {
      const aPrimary = a.option.timeZoneId === primaryTimeZoneId;
      const bPrimary = b.option.timeZoneId === primaryTimeZoneId;
      if (aPrimary !== bPrimary) {
        return aPrimary ? -1 : 1;
      }
    }
    if (deviceRegion) {
      const aRegionMatch = a.region === deviceRegion;
      const bRegionMatch = b.region === deviceRegion;
      if (aRegionMatch !== bRegionMatch) {
        return aRegionMatch ? -1 : 1;
      }
    }
    return a.index - b.index;
  });

  return matches.map((entry) => entry.option);
}
