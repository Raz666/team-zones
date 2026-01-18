import { formatUtcOffsetLabel } from './timeZoneDisplay';
import type { TimeZoneOption } from './timeZoneDisplay';

export function filterTimeZoneOptions(
  options: TimeZoneOption[],
  search: string,
  now: Date,
): TimeZoneOption[] {
  const term = search.trim().toLowerCase();
  if (!term) return options;
  return options.filter((option) => {
    if (option.searchText.includes(term)) return true;
    const offsetLabel = formatUtcOffsetLabel(option.timeZoneId, now).toLowerCase();
    if (offsetLabel.includes(term)) return true;
    if (offsetLabel.startsWith('utc')) {
      const gmtLabel = `gmt${offsetLabel.slice(3)}`;
      if (gmtLabel.includes(term)) return true;
    }
    return false;
  });
}
