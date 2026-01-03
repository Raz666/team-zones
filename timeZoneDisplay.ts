import { normalizeTimeZoneId } from './timeZoneUtils';

export type TimeZoneOption = {
  id: string;
  city: string;
  district?: string;
  country: string;
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

const timeZoneOptionCache = new Map<string, TimeZoneOption>();
const timeFormatterCache = new Map<string, Intl.DateTimeFormat>();
const offsetFormatterCache = new Map<string, Intl.DateTimeFormat>();

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
  country: string;
} {
  const zoneId = normalizeTimeZoneId(timeZone);
  const [region, ...rest] = zoneId.split('/');
  const cityRaw = rest.length ? rest[rest.length - 1] : region;
  const middleRaw = rest.slice(0, -1);

  let district: string | undefined;
  let country = REGION_LABELS[region] ?? prettifySegment(region);

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
  return { city, district, country };
}

export function getTimeZoneOption(timeZone: string): TimeZoneOption {
  const zoneId = normalizeTimeZoneId(timeZone);
  const cached = timeZoneOptionCache.get(zoneId);
  if (cached) return cached;

  const { city, district, country } = buildLocationParts(zoneId);
  const pieces = [city, district, country].filter(Boolean);
  const deduped = pieces.filter((piece, index) => {
    if (index === 0) return true;
    return pieces[index - 1].toLowerCase() !== piece.toLowerCase();
  });
  const label = deduped.join(', ');
  const searchText = `${label} ${zoneId}`.toLowerCase();

  const option = {
    id: zoneId,
    city,
    district,
    country,
    label,
    searchText,
  };
  timeZoneOptionCache.set(zoneId, option);
  return option;
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
