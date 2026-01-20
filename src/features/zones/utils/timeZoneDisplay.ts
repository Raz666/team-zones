import type { TimeZoneAlias } from './timeZoneAliases';
import { getTimeZoneAbbreviationsForZone } from './timeZoneAbbreviations';
import { TIMEZONE_COUNTRIES } from './timeZoneCountries';
import { normalizeTimeZoneId } from './timeZoneUtils';
import {
  cityKeyFromName,
  countryKeyFromName,
  getCityHiraganaByKey,
  getCountryHiraganaByKey,
  getRegionHiraganaByKey,
  regionKeyFromName,
  translateCityName,
  translateCountryName,
  translateRegionName,
} from '../../../i18n/geo';

export type TimeZoneOption = {
  id: string;
  timeZoneId: string;
  city: string;
  cityRaw?: string;
  cityKey?: string;
  cityLabel?: string;
  district?: string;
  country?: string;
  countryRaw?: string;
  region?: string;
  regionKey?: string;
  regionLabel?: string;
  legacyCity?: string;
  label: string;
  searchText: string;
};

const REGION_LABELS: Record<string, string> = {
  Africa: 'Africa',
  America: 'Americas',
  Antarctica: 'Antarctica',
  Asia: 'Asia',
  Atlantic: 'Atlantic',
  Australia: 'Australia',
  Europe: 'Europe',
  Indian: 'Indian Ocean',
  Pacific: 'Pacific',
  Etc: 'UTC',
};

const US_STATE_SEGMENTS = new Set(['Indiana', 'Kentucky', 'North_Dakota']);

const timeZoneOptionCache = new Map<string, Map<string, TimeZoneOption>>();
const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const offsetFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getLangKey(lang: string): string {
  return lang.toLowerCase();
}

const timeFormatterOptions: Intl.DateTimeFormatOptions = {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

const offsetFormatterOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
};

function prettifySegment(segment: string): string {
  return segment.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function shouldIncludeRegionInLabel(regionKey?: string): boolean {
  if (!regionKey) return false;
  if (regionKey === 'americas') return false;
  return true;
}

function buildOptionLabel(
  city: string,
  district?: string,
  country?: string,
  regionLabel?: string,
  regionKey?: string,
): string {
  const pieces = [city, district, country].filter(Boolean) as string[];
  if (shouldIncludeRegionInLabel(regionKey) && regionLabel) {
    pieces.push(regionLabel);
  }
  const deduped = pieces.filter((piece, index) => {
    if (index === 0) return true;
    return pieces[index - 1].toLowerCase() !== piece.toLowerCase();
  });
  return deduped.join(', ');
}

function buildSearchText(
  label: string,
  zoneId: string,
  searchTerms?: Array<string | undefined>,
): string {
  const pieces = [label, zoneId];
  if (searchTerms && searchTerms.length > 0) {
    for (const term of searchTerms) {
      if (term) pieces.push(term);
    }
  }
  return pieces.join(' ').toLowerCase();
}

function getCountrySearchTerms(country?: string): string[] {
  if (!country) return [];
  if (country === 'United States') {
    return ['USA', 'US', 'U.S.', 'United States of America'];
  }
  if (country === 'United Kingdom') {
    return ['UK', 'U.K.', 'Great Britain', 'Britain', 'GB'];
  }
  return [];
}

function toIdSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildAliasId(
  timeZoneId: string,
  city: string,
  district?: string,
  country?: string,
): string {
  const parts = [timeZoneId, city, district, country].filter(Boolean) as string[];
  return `alias:${parts.map(toIdSegment).join(':')}`;
}

function getTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const zoneId = normalizeTimeZoneId(timeZone);
  const cached = timeFormatterCache.get(zoneId);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...timeFormatterOptions,
    timeZone: zoneId,
  });
  timeFormatterCache.set(zoneId, formatter);
  return formatter;
}

function getOffsetFormatter(timeZone: string): Intl.DateTimeFormat {
  const zoneId = normalizeTimeZoneId(timeZone);
  const cached = offsetFormatterCache.get(zoneId);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat('en-US', {
    ...offsetFormatterOptions,
    timeZone: zoneId,
  });
  offsetFormatterCache.set(zoneId, formatter);
  return formatter;
}

function getOffsetMinutes(date: Date, timeZone: string): number {
  const formatter = getOffsetFormatter(timeZone);
  const parts = formatter.formatToParts(date);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      values[part.type] = part.value;
    }
  }
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const hour = Number(values.hour);
  const minute = Number(values.minute);
  const second = Number(values.second);
  const asUTC = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asUTC - date.getTime()) / 60000);
}

function formatOffsetLabel(offsetMinutes: number): string {
  if (!Number.isFinite(offsetMinutes)) return 'UTC';
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const minutePart = minutes ? `:${String(minutes).padStart(2, '0')}` : '';
  return `UTC${sign}${hours}${minutePart}`;
}

function buildLocationParts(timeZone: string): {
  city: string;
  district?: string;
  country?: string;
  region?: string;
} {
  const zoneId = normalizeTimeZoneId(timeZone);
  const [region, ...rest] = zoneId.split('/');
  const cityRaw = rest.length ? rest[rest.length - 1] : region;
  const middleRaw = rest.slice(0, -1);

  let district: string | undefined;
  let country: string | undefined;
  const regionLabel = REGION_LABELS[region] ?? prettifySegment(region);

  if (region === 'America' && middleRaw.length > 0) {
    const first = middleRaw[0];
    if (US_STATE_SEGMENTS.has(first)) {
      district = prettifySegment(first);
      country = 'United States';
    } else {
      country = prettifySegment(first);
      if (middleRaw.length > 1) {
        district = prettifySegment(middleRaw.slice(1).join(' '));
      }
    }
  } else if (middleRaw.length > 0) {
    district = prettifySegment(middleRaw.join(' '));
  }

  const city = prettifySegment(cityRaw);
  const countryOverride = TIMEZONE_COUNTRIES[zoneId];
  if (countryOverride) {
    country = countryOverride;
  }
  return { city, district, country, region: regionLabel };
}

export function getTimeZoneOption(timeZone: string, lang: string): TimeZoneOption {
  const zoneId = normalizeTimeZoneId(timeZone);
  const langKey = getLangKey(lang);
  const cached = timeZoneOptionCache.get(zoneId)?.get(langKey);
  if (cached) return cached;

  const { city: cityRaw, district, country: countryRaw, region } = buildLocationParts(zoneId);
  const cityKey = cityRaw ? cityKeyFromName(cityRaw) : '';
  const cityLabel = cityRaw ? translateCityName(cityRaw, langKey) : undefined;
  const regionKey = region ? regionKeyFromName(region) : undefined;
  const regionLabel = region ? translateRegionName(region, langKey) : undefined;
  const country = countryRaw ? translateCountryName(countryRaw, langKey) : undefined;
  const countryKey = countryRaw ? countryKeyFromName(countryRaw) : '';
  const cityHiragana = cityKey ? getCityHiraganaByKey(cityKey, langKey) : undefined;
  const regionHiragana = regionKey ? getRegionHiraganaByKey(regionKey, langKey) : undefined;
  const countryHiragana = countryKey ? getCountryHiraganaByKey(countryKey, langKey) : undefined;
  const cityDisplay = cityLabel || cityRaw;
  const label = buildOptionLabel(cityDisplay, district, country, regionLabel, regionKey);
  const countryTerms = getCountrySearchTerms(countryRaw);
  const abbreviationTerms = getTimeZoneAbbreviationsForZone(zoneId);
  const searchText = buildSearchText(label, zoneId, [
    cityLabel,
    cityRaw,
    regionLabel,
    cityHiragana,
    regionHiragana,
    countryHiragana,
    ...countryTerms,
    ...abbreviationTerms,
  ]);

  const option = {
    id: zoneId,
    timeZoneId: zoneId,
    city: cityRaw,
    cityRaw,
    cityKey: cityKey || undefined,
    cityLabel,
    district,
    country,
    countryRaw,
    region,
    regionKey,
    regionLabel,
    label,
    searchText,
  };
  const langCache = timeZoneOptionCache.get(zoneId) ?? new Map<string, TimeZoneOption>();
  langCache.set(langKey, option);
  timeZoneOptionCache.set(zoneId, langCache);
  return option;
}

export function getTimeZoneOptions(
  timeZones: string[],
  aliases: TimeZoneAlias[],
  lang: string,
): TimeZoneOption[] {
  const langKey = getLangKey(lang);
  const baseOptions = timeZones.map((timeZone) => getTimeZoneOption(timeZone, langKey));
  if (!aliases.length) return baseOptions;

  const baseByZone = new Map<string, TimeZoneOption>();
  const labelByZone = new Map<string, Set<string>>();
  const baseCityByZone = new Map<string, string>();
  const seenIds = new Set(baseOptions.map((option) => option.id));

  for (const option of baseOptions) {
    const zoneId = option.timeZoneId;
    baseByZone.set(zoneId, option);
    const baseCity = option.cityRaw ?? option.city;
    baseCityByZone.set(zoneId, baseCity.toLowerCase());
    const labels = labelByZone.get(zoneId) ?? new Set<string>();
    labels.add(option.label.toLowerCase());
    labelByZone.set(zoneId, labels);
  }

  const overrides = new Map<string, TimeZoneOption>();
  const inferredCountryByZone = new Map<string, string>();

  const buildAliasOption = (
    zoneId: string,
    alias: TimeZoneAlias,
    baseOption: TimeZoneOption,
    useZoneIdAsId: boolean,
  ): TimeZoneOption => {
    const cityRaw = alias.city;
    const cityKey = cityRaw ? cityKeyFromName(cityRaw) : '';
    const cityLabel = cityRaw ? translateCityName(cityRaw, langKey) : undefined;
    const district = alias.district ?? baseOption.district;
    const countryRaw = alias.country ?? baseOption.countryRaw ?? baseOption.country;
    const country = countryRaw ? translateCountryName(countryRaw, langKey) : undefined;
    const region = baseOption.region;
    const regionKey = baseOption.regionKey;
    const regionLabel = baseOption.regionLabel;
    const countryKey = countryRaw ? countryKeyFromName(countryRaw) : '';
    const cityHiragana = cityKey ? getCityHiraganaByKey(cityKey, langKey) : undefined;
    const regionHiragana = regionKey ? getRegionHiraganaByKey(regionKey, langKey) : undefined;
    const countryHiragana = countryKey ? getCountryHiraganaByKey(countryKey, langKey) : undefined;
    const baseCityRaw = baseOption.cityRaw ?? baseOption.city;
    const legacyCity =
      useZoneIdAsId && baseCityRaw.toLowerCase() !== cityRaw.toLowerCase()
        ? baseCityRaw
        : undefined;
    const cityDisplay = cityLabel || cityRaw;
    const label = buildOptionLabel(cityDisplay, district, country, regionLabel, regionKey);
    const countryTerms = getCountrySearchTerms(countryRaw);
    const abbreviationTerms = getTimeZoneAbbreviationsForZone(zoneId);
    const searchText = buildSearchText(label, zoneId, [
      cityLabel,
      cityRaw,
      regionLabel,
      cityHiragana,
      regionHiragana,
      countryHiragana,
      ...(alias.searchTerms ?? []),
      ...countryTerms,
      ...abbreviationTerms,
      legacyCity,
    ]);
    const id = useZoneIdAsId ? zoneId : buildAliasId(zoneId, cityRaw, district, countryRaw);
    return {
      id,
      timeZoneId: zoneId,
      city: cityRaw,
      cityRaw,
      cityKey: cityKey || undefined,
      cityLabel,
      district,
      country,
      countryRaw,
      region,
      regionKey,
      regionLabel,
      legacyCity,
      label,
      searchText,
    };
  };

  for (const alias of aliases) {
    const zoneId = normalizeTimeZoneId(alias.timeZoneId);
    const baseOption = baseByZone.get(zoneId);
    if (!baseOption) continue;
    if (alias.country && !inferredCountryByZone.has(zoneId)) {
      inferredCountryByZone.set(zoneId, alias.country);
    }
    if (!alias.primary) continue;
    const option = buildAliasOption(zoneId, alias, baseOption, true);
    overrides.set(zoneId, option);
    const labels = labelByZone.get(zoneId) ?? new Set<string>();
    labels.add(option.label.toLowerCase());
    labelByZone.set(zoneId, labels);
  }

  for (const [zoneId, country] of inferredCountryByZone) {
    if (overrides.has(zoneId)) continue;
    const baseOption = baseByZone.get(zoneId);
    if (!baseOption) continue;
    const primaryAlias: TimeZoneAlias = {
      timeZoneId: zoneId,
      city: baseOption.city,
      country,
      primary: true,
    };
    const option = buildAliasOption(zoneId, primaryAlias, baseOption, true);
    overrides.set(zoneId, option);
    const labels = labelByZone.get(zoneId) ?? new Set<string>();
    labels.add(option.label.toLowerCase());
    labelByZone.set(zoneId, labels);
  }

  const aliasOptions: TimeZoneOption[] = [];
  for (const alias of aliases) {
    const zoneId = normalizeTimeZoneId(alias.timeZoneId);
    const baseOption = baseByZone.get(zoneId);
    if (!baseOption) continue;
    if (alias.primary) continue;
    const baseCity = baseCityByZone.get(zoneId);
    if (baseCity && baseCity === alias.city.toLowerCase()) continue;

    const option = buildAliasOption(zoneId, alias, baseOption, false);
    const labelKey = option.label.toLowerCase();
    const labels = labelByZone.get(zoneId) ?? new Set<string>();
    if (labels.has(labelKey)) continue;

    if (seenIds.has(option.id)) continue;

    aliasOptions.push(option);
    labels.add(labelKey);
    labelByZone.set(zoneId, labels);
    seenIds.add(option.id);
  }

  aliasOptions.sort((a, b) => a.label.localeCompare(b.label));
  const mergedBase = baseOptions.map((option) => overrides.get(option.timeZoneId) ?? option);
  return [...mergedBase, ...aliasOptions];
}

export function formatTimeInZone(timeZone: string, date: Date): string {
  try {
    return getTimeFormatter(timeZone).format(date);
  } catch {
    return '--:--';
  }
}

export function formatUtcOffsetLabel(timeZone: string, date: Date): string {
  try {
    const offsetMinutes = getOffsetMinutes(date, timeZone);
    return formatOffsetLabel(offsetMinutes);
  } catch {
    return 'UTC';
  }
}
