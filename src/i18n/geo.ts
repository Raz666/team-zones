import i18n from 'i18next';

function slugify(value: string): string {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const parts = normalized.match(/[A-Za-z0-9]+/g);
  if (!parts || parts.length === 0) return '';
  const [first, ...rest] = parts;
  const head = first.toLowerCase();
  const tail = rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return head + tail.join('');
}

export function countryKeyFromName(name: string): string {
  return slugify(name);
}

export function regionKeyFromName(name: string): string {
  return slugify(name);
}

export function translateCountryName(name: string, lang: string): string {
  const slug = countryKeyFromName(name);
  if (!slug) return name;
  const resolvedLang = lang || i18n.language;
  return i18n.t(`country.${slug}`, { ns: 'geo', lng: resolvedLang, defaultValue: name }) as string;
}

export function translateRegionName(name: string, lang: string): string {
  const slug = regionKeyFromName(name);
  if (!slug) return name;
  const resolvedLang = lang || i18n.language;
  return i18n.t(`region.${slug}`, { ns: 'geo', lng: resolvedLang, defaultValue: name }) as string;
}
