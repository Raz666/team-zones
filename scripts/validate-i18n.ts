import fs from 'fs';
import path from 'path';

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const localesRoot = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const baseLocale = 'en';
const compareLocales = ['pl', 'ja'];

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

function listJsonFiles(dirPath: string): string[] {
  return fs
    .readdirSync(dirPath)
    .filter((name) => name.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b));
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
  const baseDir = path.join(localesRoot, baseLocale);
  if (!fs.existsSync(baseDir)) {
    console.error(`[i18n] Missing base locale folder: ${baseDir}`);
    process.exit(1);
  }

  const baseFiles = listJsonFiles(baseDir);
  if (baseFiles.length === 0) {
    console.error(`[i18n] No base locale JSON files found in ${baseDir}`);
    process.exit(1);
  }

  let hasErrors = false;

  for (const fileName of baseFiles) {
    const basePath = path.join(baseDir, fileName);
    const baseValue = loadJson(basePath);
    const baseKeys = new Set<string>();
    collectKeys(baseValue, '', baseKeys);

    for (const locale of compareLocales) {
      const localeDir = path.join(localesRoot, locale);
      const localePath = path.join(localeDir, fileName);

      if (!fs.existsSync(localePath)) {
        console.error(`[i18n] Missing file for ${locale}: ${localePath}`);
        hasErrors = true;
        continue;
      }

      const localeValue = loadJson(localePath);
      const localeKeys = new Set<string>();
      collectKeys(localeValue, '', localeKeys);

      const { missing, extra } = diffKeys(baseKeys, localeKeys);

      if (missing.length || extra.length) {
        hasErrors = true;
        console.error(`\n[i18n] Key mismatch in ${fileName} for ${locale}`);
        if (missing.length) {
          console.error(`Missing keys (${missing.length}):\n${formatList(missing)}`);
        }
        if (extra.length) {
          console.error(`Extra keys (${extra.length}):\n${formatList(extra)}`);
        }
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  console.log('[i18n] Locale keys are aligned.');
}

main();
