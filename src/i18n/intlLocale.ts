import { SupportedLanguage } from './supportedLanguages';

const localeByLanguage: Record<SupportedLanguage, string> = {
  en: 'en-US',
  pl: 'pl-PL',
  ja: 'ja-JP',
};

export function getIntlLocale(language: SupportedLanguage): string {
  return localeByLanguage[language] ?? 'en-US';
}
