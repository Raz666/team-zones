export type DayTag = 'yday' | 'today' | 'tomo';

export function dayTagForZone(now: Date, zoneTimeZone: string, deviceTimeZone: string): DayTag {
  try {
    const zoneDay = dayIndexInZone(now, zoneTimeZone);
    const deviceDay = dayIndexInZone(now, deviceTimeZone);
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
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone,
  }).format(date);
}

function dayIndexInZone(date: Date, timeZone: string): number {
  const iso = new Intl.DateTimeFormat('en-CA', {
    timeZone,
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
