import type { SupportedLanguage } from '../../../i18n/supportedLanguages';
import { defaultLanguage, normalizeLanguage } from '../../../i18n/supportedLanguages';

export type LanguageOption = {
  value: SupportedLanguage;
  label: string;
  flag: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  { value: 'pl', label: 'Polski', flag: '\u{1F1F5}\u{1F1F1}' },
  { value: 'ja', label: '\u65E5\u672C\u8A9E', flag: '\u{1F1EF}\u{1F1F5}' },
];

export function resolveLanguageValue(value?: string | null): SupportedLanguage {
  return normalizeLanguage(value) ?? defaultLanguage;
}

export function getLanguageOption(value?: string | null): LanguageOption {
  const resolved = resolveLanguageValue(value);
  return LANGUAGE_OPTIONS.find((option) => option.value === resolved) ?? LANGUAGE_OPTIONS[0];
}

export function normalizeLanguageValue(value?: string | null): SupportedLanguage | null {
  return normalizeLanguage(value);
}
