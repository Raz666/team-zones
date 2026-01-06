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

function collectKeys(value: JsonValue, prefix: string, out: Set<string>): void {
  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0 && prefix) {
      out.add(prefix);
    }
    for (const [key, child] of entries) {
      const next = prefix ? `${prefix}.${key}` : key;
      collectKeys(child, next, out);
    }
    return;
  }

  if (prefix) {
    out.add(prefix);
  }
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

function main() {
  const basePath = path.join(localesRoot, baseLocale, fileName);
  if (!fs.existsSync(basePath)) {
    console.error(`[geo-i18n] Missing base file: ${basePath}`);
    process.exit(1);
  }

  const baseValue = loadJson(basePath);
  const baseKeys = new Set<string>();
  collectKeys(baseValue, '', baseKeys);

  let hasErrors = false;

  for (const locale of compareLocales) {
    const localePath = path.join(localesRoot, locale, fileName);
    if (!fs.existsSync(localePath)) {
      console.error(`[geo-i18n] Missing file for ${locale}: ${localePath}`);
      hasErrors = true;
      continue;
    }

    const localeValue = loadJson(localePath);
    const localeKeys = new Set<string>();
    collectKeys(localeValue, '', localeKeys);

    const { missing, extra } = diffKeys(baseKeys, localeKeys);

    if (missing.length || extra.length) {
      hasErrors = true;
      console.error(`\n[geo-i18n] Key mismatch in ${fileName} for ${locale}`);
      if (missing.length) {
        console.error(`Missing keys (${missing.length}):\n${formatList(missing)}`);
      }
      if (extra.length) {
        console.error(`Extra keys (${extra.length}):\n${formatList(extra)}`);
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('[geo-i18n] Geo keys are aligned.');
}

main();
