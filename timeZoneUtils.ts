export type DayTag = 'yday' | 'today' | 'tomo';

const TIMEZONE_ALIASES: Record<string, string> = {
  'US/Eastern': 'America/New_York',
  'US/Central': 'America/Chicago',
  'US/Mountain': 'America/Denver',
  'US/Pacific': 'America/Los_Angeles',
  'US/Arizona': 'America/Phoenix',
  'US/Alaska': 'America/Anchorage',
  'US/Hawaii': 'Pacific/Honolulu',
  'Canada/Eastern': 'America/Toronto',
  'Canada/Central': 'America/Winnipeg',
  'Canada/Mountain': 'America/Edmonton',
  'Canada/Pacific': 'America/Vancouver',
  'Canada/Atlantic': 'America/Halifax',
  'Canada/Newfoundland': 'America/St_Johns',
  GMT: 'Etc/UTC',
  'Etc/GMT': 'Etc/UTC',
  'Etc/UCT': 'Etc/UTC',
  'Etc/UTC': 'Etc/UTC',
};

export function normalizeTimeZoneId(timeZone: string): string {
  return TIMEZONE_ALIASES[timeZone] ?? timeZone;
}

export function dayTagForZone(now: Date, zoneTimeZone: string, deviceTimeZone: string): DayTag {
  try {
    const zoneId = normalizeTimeZoneId(zoneTimeZone);
    const deviceId = normalizeTimeZoneId(deviceTimeZone);
    const zoneDay = dayIndexInZone(now, zoneId);
    const deviceDay = dayIndexInZone(now, deviceId);
    if (zoneDay === deviceDay) return 'today';

    const diff = zoneDay - deviceDay;
    if (diff === -1 || diff === 6) return 'yday';
    if (diff === 1 || diff === -6) return 'tomo';
    return 'today';
  } catch {
    return 'today';
  }
}

export function weekdayInZone(date: Date, timeZone: string): string {
  const zoneId = normalizeTimeZoneId(timeZone);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: zoneId,
  }).format(date);
}

function dayIndexInZone(date: Date, timeZone: string): number {
  const zoneId = normalizeTimeZoneId(timeZone);
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone: zoneId,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // e.g., 2025-12-09
  const [yearStr, monthStr, dayStr] = iso.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
