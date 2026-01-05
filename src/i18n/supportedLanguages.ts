export const supportedLanguages = ['en', 'pl', 'ja'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'en';

export const isSupportedLanguage = (language?: string | null): language is SupportedLanguage => {
  if (!language) {
    return false;
  }
  return supportedLanguages.includes(language as SupportedLanguage);
};

export const normalizeLanguage = (language?: string | null): SupportedLanguage | null => {
  if (!language) {
    return null;
  }
  const normalized = language.toLowerCase();
  return isSupportedLanguage(normalized) ? normalized : null;
};
