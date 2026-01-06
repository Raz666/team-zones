import i18n from 'i18next';

export function countryKeyFromName(name: string): string {
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const cleaned = normalized.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
  if (!cleaned) return '';
  const parts = cleaned.split(/\s+/);
  const [first, ...rest] = parts;
  return [
    first.toLowerCase(),
    ...rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()),
  ].join('');
}

export function translateCountryName(name: string, lang: string): string {
  const slug = countryKeyFromName(name);
  if (!slug) return name;
  const resolvedLang = lang || i18n.language;
  return i18n.t(`country.${slug}`, { ns: 'geo', lng: resolvedLang, defaultValue: name }) as string;
}
