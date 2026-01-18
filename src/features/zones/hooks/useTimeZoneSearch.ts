import { useMemo, useState } from 'react';

import { formatUtcOffsetLabel, getTimeZoneOptions } from '../utils/timeZoneDisplay';
import type { TimeZoneOption } from '../utils/timeZoneDisplay';
import { TIMEZONE_ALIASES } from '../utils/timeZoneAliases';
import { IANA_TIMEZONES } from '../utils/timezones';
import { normalizeTimeZoneId } from '../utils/timeZoneUtils';
import type { Zone } from '../storage/zonesRepository';

const normalizeLabelValue = (value: string) => value.trim().toLowerCase();

const getOptionLabelKeys = (option: TimeZoneOption) => {
  const keys = new Set<string>();
  const addKey = (value?: string) => {
    if (!value) return;
    const key = normalizeLabelValue(value);
    if (key) keys.add(key);
  };
  addKey(option.city);
  addKey(option.cityRaw);
  addKey(option.cityLabel);
  if (option.legacyCity) {
    const legacyKey = normalizeLabelValue(option.legacyCity);
    if (legacyKey) keys.add(legacyKey);
  }
  addKey(option.label);
  return keys;
};

type UseTimeZoneSearchOptions = {
  existingZones: Zone[];
  usedTimeZones: string[];
  language: string;
};

export function useTimeZoneSearch({ existingZones, usedTimeZones, language }: UseTimeZoneSearchOptions) {
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const allTimeZones: string[] = useMemo(() => {
    const supportedRaw =
      typeof (Intl as any).supportedValuesOf === 'function'
        ? (Intl as any).supportedValuesOf('timeZone')
        : [];
    const supported: string[] = Array.isArray(supportedRaw) ? (supportedRaw as string[]) : [];
    const base = supported.length > 0 ? supported : IANA_TIMEZONES;
    return Array.from(new Set(base)).sort();
  }, []);

  const allTimeZoneOptions = useMemo(
    () => getTimeZoneOptions(allTimeZones, TIMEZONE_ALIASES, language),
    [allTimeZones, language],
  );

  const now = useMemo(() => new Date(), [isSearchFocused, search]);

  const existingZonesById = useMemo(() => {
    const map = new Map<string, { zone: Zone; index: number }[]>();
    existingZones.forEach((zone, index) => {
      const zoneId = normalizeTimeZoneId(zone.timeZone);
      const list = map.get(zoneId) ?? [];
      list.push({ zone, index });
      map.set(zoneId, list);
    });
    return map;
  }, [existingZones]);

  const existingLabelsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    existingZones.forEach((zone) => {
      const zoneId = normalizeTimeZoneId(zone.timeZone);
      const labelKey = normalizeLabelValue(zone.label);
      const labels = map.get(zoneId) ?? new Set<string>();
      if (labelKey) {
        labels.add(labelKey);
      }
      map.set(zoneId, labels);
    });
    return map;
  }, [existingZones]);

  const usedTimeZoneSet = useMemo(
    () => new Set(usedTimeZones.map((tz) => normalizeTimeZoneId(tz))),
    [usedTimeZones],
  );

  const findExistingMatch = (option: TimeZoneOption) => {
    const matches = existingZonesById.get(option.timeZoneId);
    if (!matches) return null;
    const candidates = getOptionLabelKeys(option);
    for (const match of matches) {
      const labelKey = normalizeLabelValue(match.zone.label);
      if (candidates.has(labelKey)) {
        return match;
      }
    }
    return null;
  };

  const isOptionUsed = (option: TimeZoneOption) => {
    const labels = existingLabelsById.get(option.timeZoneId);
    if (labels && labels.size > 0) {
      for (const key of getOptionLabelKeys(option)) {
        if (labels.has(key)) return true;
      }
      return false;
    }
    if (existingZones.length === 0) {
      return usedTimeZoneSet.has(option.timeZoneId);
    }
    return false;
  };

  const getCityLabel = (option: TimeZoneOption) =>
    option.cityLabel ?? option.cityRaw ?? option.city;

  const getLocationLine = (option: TimeZoneOption) => {
    const region =
      option.regionKey && option.regionKey !== 'americas' ? option.regionLabel : undefined;
    const parts = option.district ? [option.district, option.country] : [option.country, region];
    const cleaned = parts.filter(Boolean) as string[];
    const deduped = cleaned.filter((piece, index) => {
      if (index === 0) return true;
      return cleaned[index - 1].toLowerCase() !== piece.toLowerCase();
    });
    return deduped.join(', ');
  };

  const availableOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allTimeZoneOptions;
    return allTimeZoneOptions.filter((option) => {
      if (option.searchText.includes(term)) return true;
      const offsetLabel = formatUtcOffsetLabel(option.timeZoneId, now).toLowerCase();
      if (offsetLabel.includes(term)) return true;
      if (offsetLabel.startsWith('utc')) {
        const gmtLabel = `gmt${offsetLabel.slice(3)}`;
        if (gmtLabel.includes(term)) return true;
      }
      return false;
    });
  }, [allTimeZoneOptions, now, search]);

  return {
    search,
    setSearch,
    isSearchFocused,
    setIsSearchFocused,
    allTimeZoneOptions,
    availableOptions,
    now,
    findExistingMatch,
    isOptionUsed,
    getCityLabel,
    getLocationLine,
    getOptionLabelKeys,
  };
}
