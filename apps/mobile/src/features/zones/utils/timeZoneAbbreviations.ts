import { normalizeTimeZoneId } from './timeZoneUtils';

export type TimeZoneAbbreviationMeaning = {
  timeZoneId: string;
  name: string;
  primary?: boolean;
};

export type TimeZoneAbbreviation = {
  abbreviation: string;
  meanings: TimeZoneAbbreviationMeaning[];
};

export type TimeZoneAbbreviationMatch = {
  abbreviation: string;
  meanings: TimeZoneAbbreviationMeaning[];
  timeZoneIds: string[];
  primaryTimeZoneId?: string;
};

export type TimeZoneAbbreviationLabel = {
  abbreviation: string;
  name: string;
};

const RAW_TIMEZONE_ABBREVIATIONS: TimeZoneAbbreviation[] = [
  {
    abbreviation: 'UTC',
    meanings: [
      {
        timeZoneId: 'Etc/UTC',
        name: 'Coordinated Universal Time',
        primary: true,
      },
    ],
  },
  {
    abbreviation: 'GMT',
    meanings: [
      {
        timeZoneId: 'Etc/UTC',
        name: 'Greenwich Mean Time',
        primary: true,
      },
    ],
  },
  {
    abbreviation: 'CET',
    meanings: [
      { timeZoneId: 'Europe/Paris', name: 'Central European Time', primary: true },
      { timeZoneId: 'Europe/Berlin', name: 'Central European Time' },
      { timeZoneId: 'Europe/Rome', name: 'Central European Time' },
    ],
  },
  {
    abbreviation: 'CEST',
    meanings: [
      { timeZoneId: 'Europe/Paris', name: 'Central European Summer Time', primary: true },
      { timeZoneId: 'Europe/Berlin', name: 'Central European Summer Time' },
      { timeZoneId: 'Europe/Rome', name: 'Central European Summer Time' },
    ],
  },
  {
    abbreviation: 'EET',
    meanings: [
      { timeZoneId: 'Europe/Athens', name: 'Eastern European Time', primary: true },
      { timeZoneId: 'Europe/Bucharest', name: 'Eastern European Time' },
      { timeZoneId: 'Europe/Helsinki', name: 'Eastern European Time' },
    ],
  },
  {
    abbreviation: 'EEST',
    meanings: [
      { timeZoneId: 'Europe/Athens', name: 'Eastern European Summer Time', primary: true },
      { timeZoneId: 'Europe/Bucharest', name: 'Eastern European Summer Time' },
      { timeZoneId: 'Europe/Helsinki', name: 'Eastern European Summer Time' },
    ],
  },
  {
    abbreviation: 'WET',
    meanings: [
      { timeZoneId: 'Europe/Lisbon', name: 'Western European Time', primary: true },
      { timeZoneId: 'Atlantic/Canary', name: 'Western European Time' },
    ],
  },
  {
    abbreviation: 'WEST',
    meanings: [
      { timeZoneId: 'Europe/Lisbon', name: 'Western European Summer Time', primary: true },
      { timeZoneId: 'Atlantic/Canary', name: 'Western European Summer Time' },
    ],
  },
  {
    abbreviation: 'BST',
    meanings: [
      { timeZoneId: 'Europe/London', name: 'British Summer Time', primary: true },
      { timeZoneId: 'Asia/Dhaka', name: 'Bangladesh Standard Time' },
    ],
  },
  {
    abbreviation: 'MSK',
    meanings: [
      { timeZoneId: 'Europe/Moscow', name: 'Moscow Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'IST',
    meanings: [
      { timeZoneId: 'Asia/Kolkata', name: 'India Standard Time', primary: true },
      { timeZoneId: 'Europe/Dublin', name: 'Irish Standard Time' },
      { timeZoneId: 'Asia/Jerusalem', name: 'Israel Standard Time' },
    ],
  },
  {
    abbreviation: 'JST',
    meanings: [
      { timeZoneId: 'Asia/Tokyo', name: 'Japan Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'KST',
    meanings: [
      { timeZoneId: 'Asia/Seoul', name: 'Korea Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'HKT',
    meanings: [
      { timeZoneId: 'Asia/Hong_Kong', name: 'Hong Kong Time', primary: true },
    ],
  },
  {
    abbreviation: 'SGT',
    meanings: [
      { timeZoneId: 'Asia/Singapore', name: 'Singapore Time', primary: true },
    ],
  },
  {
    abbreviation: 'ICT',
    meanings: [
      { timeZoneId: 'Asia/Bangkok', name: 'Indochina Time', primary: true },
      { timeZoneId: 'Asia/Ho_Chi_Minh', name: 'Indochina Time' },
    ],
  },
  {
    abbreviation: 'PKT',
    meanings: [
      { timeZoneId: 'Asia/Karachi', name: 'Pakistan Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'IRST',
    meanings: [
      { timeZoneId: 'Asia/Tehran', name: 'Iran Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'EST',
    meanings: [
      { timeZoneId: 'America/New_York', name: 'Eastern Standard Time', primary: true },
      { timeZoneId: 'America/Toronto', name: 'Eastern Standard Time' },
    ],
  },
  {
    abbreviation: 'EDT',
    meanings: [
      { timeZoneId: 'America/New_York', name: 'Eastern Daylight Time', primary: true },
      { timeZoneId: 'America/Toronto', name: 'Eastern Daylight Time' },
    ],
  },
  {
    abbreviation: 'CST',
    meanings: [
      { timeZoneId: 'America/Chicago', name: 'Central Standard Time', primary: true },
      { timeZoneId: 'America/Mexico_City', name: 'Central Standard Time' },
      { timeZoneId: 'Asia/Shanghai', name: 'China Standard Time' },
      { timeZoneId: 'Australia/Darwin', name: 'Australian Central Standard Time' },
    ],
  },
  {
    abbreviation: 'CDT',
    meanings: [
      { timeZoneId: 'America/Chicago', name: 'Central Daylight Time', primary: true },
      { timeZoneId: 'America/Mexico_City', name: 'Central Daylight Time' },
    ],
  },
  {
    abbreviation: 'MST',
    meanings: [
      { timeZoneId: 'America/Denver', name: 'Mountain Standard Time', primary: true },
      { timeZoneId: 'America/Phoenix', name: 'Mountain Standard Time' },
    ],
  },
  {
    abbreviation: 'MDT',
    meanings: [
      { timeZoneId: 'America/Denver', name: 'Mountain Daylight Time', primary: true },
    ],
  },
  {
    abbreviation: 'PST',
    meanings: [
      { timeZoneId: 'America/Los_Angeles', name: 'Pacific Standard Time', primary: true },
      { timeZoneId: 'America/Vancouver', name: 'Pacific Standard Time' },
    ],
  },
  {
    abbreviation: 'PDT',
    meanings: [
      { timeZoneId: 'America/Los_Angeles', name: 'Pacific Daylight Time', primary: true },
      { timeZoneId: 'America/Vancouver', name: 'Pacific Daylight Time' },
    ],
  },
  {
    abbreviation: 'AKST',
    meanings: [
      { timeZoneId: 'America/Anchorage', name: 'Alaska Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'AKDT',
    meanings: [
      { timeZoneId: 'America/Anchorage', name: 'Alaska Daylight Time', primary: true },
    ],
  },
  {
    abbreviation: 'HST',
    meanings: [
      { timeZoneId: 'Pacific/Honolulu', name: 'Hawaii Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'AST',
    meanings: [
      { timeZoneId: 'America/Halifax', name: 'Atlantic Standard Time', primary: true },
      { timeZoneId: 'America/Puerto_Rico', name: 'Atlantic Standard Time' },
    ],
  },
  {
    abbreviation: 'ADT',
    meanings: [
      { timeZoneId: 'America/Halifax', name: 'Atlantic Daylight Time', primary: true },
    ],
  },
  {
    abbreviation: 'AEST',
    meanings: [
      { timeZoneId: 'Australia/Sydney', name: 'Australian Eastern Standard Time', primary: true },
      { timeZoneId: 'Australia/Brisbane', name: 'Australian Eastern Standard Time' },
    ],
  },
  {
    abbreviation: 'AEDT',
    meanings: [
      { timeZoneId: 'Australia/Sydney', name: 'Australian Eastern Daylight Time', primary: true },
    ],
  },
  {
    abbreviation: 'ACST',
    meanings: [
      { timeZoneId: 'Australia/Adelaide', name: 'Australian Central Standard Time', primary: true },
      { timeZoneId: 'Australia/Darwin', name: 'Australian Central Standard Time' },
    ],
  },
  {
    abbreviation: 'ACDT',
    meanings: [
      { timeZoneId: 'Australia/Adelaide', name: 'Australian Central Daylight Time', primary: true },
    ],
  },
  {
    abbreviation: 'AWST',
    meanings: [
      { timeZoneId: 'Australia/Perth', name: 'Australian Western Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'NZST',
    meanings: [
      { timeZoneId: 'Pacific/Auckland', name: 'New Zealand Standard Time', primary: true },
    ],
  },
  {
    abbreviation: 'NZDT',
    meanings: [
      { timeZoneId: 'Pacific/Auckland', name: 'New Zealand Daylight Time', primary: true },
    ],
  },
];

const ABBREVIATION_LOOKUP = new Map<string, TimeZoneAbbreviationMatch>();
const ABBREVIATIONS_BY_ZONE = new Map<string, string[]>();
const ABBREVIATION_LABELS_BY_ZONE = new Map<string, TimeZoneAbbreviationLabel[]>();

const normalizeAbbreviation = (value: string) => value.trim().toUpperCase();

const TIMEZONE_ABBREVIATIONS: TimeZoneAbbreviationMatch[] = RAW_TIMEZONE_ABBREVIATIONS.map(
  (entry) => {
    const abbreviation = normalizeAbbreviation(entry.abbreviation);
    const seen = new Set<string>();
    const meanings: TimeZoneAbbreviationMeaning[] = [];
    for (const meaning of entry.meanings) {
      const zoneId = normalizeTimeZoneId(meaning.timeZoneId);
      if (seen.has(zoneId)) continue;
      seen.add(zoneId);
      meanings.push({
        timeZoneId: zoneId,
        name: meaning.name,
        primary: meaning.primary,
      });
    }
    const primaryTimeZoneId = meanings.find((meaning) => meaning.primary)?.timeZoneId;
    return {
      abbreviation,
      meanings,
      timeZoneIds: meanings.map((meaning) => meaning.timeZoneId),
      primaryTimeZoneId: primaryTimeZoneId ?? meanings[0]?.timeZoneId,
    };
  },
);

for (const entry of TIMEZONE_ABBREVIATIONS) {
  ABBREVIATION_LOOKUP.set(entry.abbreviation, entry);
  for (const meaning of entry.meanings) {
    const zoneId = meaning.timeZoneId;
    const abbrevList = ABBREVIATIONS_BY_ZONE.get(zoneId);
    if (abbrevList) {
      if (!abbrevList.includes(entry.abbreviation)) {
        abbrevList.push(entry.abbreviation);
      }
    } else {
      ABBREVIATIONS_BY_ZONE.set(zoneId, [entry.abbreviation]);
    }

    const labelList = ABBREVIATION_LABELS_BY_ZONE.get(zoneId);
    const label: TimeZoneAbbreviationLabel = {
      abbreviation: entry.abbreviation,
      name: meaning.name,
    };
    if (labelList) {
      if (!labelList.some((existing) => existing.abbreviation === label.abbreviation)) {
        labelList.push(label);
      }
    } else {
      ABBREVIATION_LABELS_BY_ZONE.set(zoneId, [label]);
    }
  }
}

export function getTimeZoneAbbreviationMatch(term: string): TimeZoneAbbreviationMatch | null {
  if (!term) return null;
  const key = normalizeAbbreviation(term);
  return ABBREVIATION_LOOKUP.get(key) ?? null;
}

export function getTimeZoneAbbreviationsForZone(timeZoneId: string): string[] {
  const zoneId = normalizeTimeZoneId(timeZoneId);
  return ABBREVIATIONS_BY_ZONE.get(zoneId) ?? [];
}

export function getTimeZoneAbbreviationLabelsForZone(
  timeZoneId: string,
  abbreviation?: string,
): TimeZoneAbbreviationLabel[] {
  const zoneId = normalizeTimeZoneId(timeZoneId);
  const labels = ABBREVIATION_LABELS_BY_ZONE.get(zoneId) ?? [];
  if (!abbreviation) return labels;
  const key = normalizeAbbreviation(abbreviation);
  return labels.filter((label) => label.abbreviation === key);
}
