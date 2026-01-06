import fs from 'fs';
import path from 'path';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const localesRoot = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const baseLocale = 'en';
const compareLocales = ['pl', 'ja'];
const fileName = 'geo.json';

function isPlainObject(value: JsonValue): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function loadJson(filePath: string): JsonValue {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as JsonValue;
}

function diffKeys(base: Set<string>, other: Set<string>) {
  const missing: string[] = [];
  const extra: string[] = [];

  for (const key of base) {
    if (!other.has(key)) {
      missing.push(key);
    }
  }
  for (const key of other) {
    if (!base.has(key)) {
      extra.push(key);
    }
  }

  return { missing, extra };
}

function formatList(items: string[]): string {
  return items.length ? items.map((item) => `  - ${item}`).join('\n') : '  (none)';
}

function getSection(value: JsonValue, section: string): JsonObject | null {
  if (!isPlainObject(value)) return null;
  const candidate = value[section];
  return isPlainObject(candidate) ? candidate : null;
}

function main() {
  const basePath = path.join(localesRoot, baseLocale, fileName);
  if (!fs.existsSync(basePath)) {
    console.error(`[geo-i18n] Missing base file: ${basePath}`);
    process.exit(1);
  }

  const baseValue = loadJson(basePath);
  const baseCountry = getSection(baseValue, 'country');
  const baseRegion = getSection(baseValue, 'region');
  const baseCity = getSection(baseValue, 'city');
  if (!baseCountry || !baseRegion || !baseCity) {
    console.error('[geo-i18n] Base geo.json must include "country", "region", and "city" objects.');
    process.exit(1);
  }
  const baseCountryKeys = new Set(Object.keys(baseCountry));
  const baseRegionKeys = new Set(Object.keys(baseRegion));
  const baseCityKeys = new Set(Object.keys(baseCity));

  let hasErrors = false;

  for (const locale of compareLocales) {
    const localePath = path.join(localesRoot, locale, fileName);
    if (!fs.existsSync(localePath)) {
      console.error(`[geo-i18n] Missing file for ${locale}: ${localePath}`);
      hasErrors = true;
      continue;
    }

    const localeValue = loadJson(localePath);
    const localeCountry = getSection(localeValue, 'country');
    const localeRegion = getSection(localeValue, 'region');
    const localeCity = getSection(localeValue, 'city');

    if (!localeCountry || !localeRegion || !localeCity) {
      hasErrors = true;
      console.error(`[geo-i18n] Missing "country", "region", or "city" section in ${localePath}`);
      continue;
    }

    const localeCountryKeys = new Set(Object.keys(localeCountry));
    const localeRegionKeys = new Set(Object.keys(localeRegion));
    const localeCityKeys = new Set(Object.keys(localeCity));

    const countryDiff = diffKeys(baseCountryKeys, localeCountryKeys);
    if (countryDiff.missing.length || countryDiff.extra.length) {
      hasErrors = true;
      console.error(`\n[geo-i18n] Country key mismatch in ${fileName} for ${locale}`);
      if (countryDiff.missing.length) {
        console.error(
          `Missing country keys (${countryDiff.missing.length}):\n${formatList(
            countryDiff.missing,
          )}`,
        );
      }
      if (countryDiff.extra.length) {
        console.error(
          `Extra country keys (${countryDiff.extra.length}):\n${formatList(countryDiff.extra)}`,
        );
      }
    }

    const regionDiff = diffKeys(baseRegionKeys, localeRegionKeys);
    if (regionDiff.missing.length || regionDiff.extra.length) {
      hasErrors = true;
      console.error(`\n[geo-i18n] Region key mismatch in ${fileName} for ${locale}`);
      if (regionDiff.missing.length) {
        console.error(
          `Missing region keys (${regionDiff.missing.length}):\n${formatList(
            regionDiff.missing,
          )}`,
        );
      }
      if (regionDiff.extra.length) {
        console.error(
          `Extra region keys (${regionDiff.extra.length}):\n${formatList(regionDiff.extra)}`,
        );
      }
    }

    const cityDiff = diffKeys(baseCityKeys, localeCityKeys);
    if (cityDiff.missing.length || cityDiff.extra.length) {
      hasErrors = true;
      console.error(`\n[geo-i18n] City key mismatch in ${fileName} for ${locale}`);
      if (cityDiff.missing.length) {
        console.error(
          `Missing city keys (${cityDiff.missing.length}):\n${formatList(cityDiff.missing)}`,
        );
      }
      if (cityDiff.extra.length) {
        console.error(
          `Extra city keys (${cityDiff.extra.length}):\n${formatList(cityDiff.extra)}`,
        );
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('[geo-i18n] Geo keys are aligned.');
}

main();
