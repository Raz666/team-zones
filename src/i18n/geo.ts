import i18n from 'i18next';

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugify(value: string): string {
  const normalized = stripDiacritics(value);
  const parts = normalized.match(/[A-Za-z0-9]+/g);
  if (!parts || parts.length === 0) return '';
  const [first, ...rest] = parts;
  const head = first.toLowerCase();
  const tail = rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return head + tail.join('');
}

function normalizeCityName(value: string): string {
  return stripDiacritics(value)
    .replace(/\bD\.?\s*C\.?\b/gi, 'DC')
    .replace(/\bSt[.\s]+/gi, 'St ')
    .replace(/['’]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countryKeyFromName(name: string): string {
  return slugify(name);
}

export function regionKeyFromName(name: string): string {
  return slugify(name);
}

export function cityKeyFromName(name: string): string {
  const normalized = normalizeCityName(name);
  return slugify(normalized);
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

export function translateCityName(name: string, lang: string): string {
  const slug = cityKeyFromName(name);
  if (!slug) return name;
  const resolvedLang = lang || i18n.language;
  return i18n.t(`city.${slug}`, { ns: 'geo', lng: resolvedLang, defaultValue: name }) as string;
}
