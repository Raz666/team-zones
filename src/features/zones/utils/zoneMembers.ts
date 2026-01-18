const MEMBER_SPLIT_REGEX = /[,\uFF0C\u3001\uFF64\uFE10\uFE50\uFE51\u060C]/;

export function parseZoneMembers(value: string): string[] {
  return value
    .split(MEMBER_SPLIT_REGEX)
    .map((member) => member.trim())
    .filter(Boolean);
}
