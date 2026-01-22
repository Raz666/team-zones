import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import { defaultLanguage, isSupportedLanguage, SupportedLanguage } from './supportedLanguages';

export const LANGUAGE_STORAGE_KEY = 'teamzones:language:v1';

export async function getStoredLanguageOverride(): Promise<SupportedLanguage | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch (error) {
    console.warn('Failed to read stored language override', error);
    return null;
  }
}

export async function setStoredLanguageOverride(language: SupportedLanguage | null): Promise<void> {
  try {
    if (language) {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } else {
      await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist language override', error);
  }
}

export function getDeviceLanguage(): SupportedLanguage {
  const locales = Localization.getLocales();
  for (const locale of locales) {
    const code = locale?.languageCode?.toLowerCase();
    if (isSupportedLanguage(code)) {
      return code;
    }
  }
  return defaultLanguage;
}

export async function detectLanguage(): Promise<SupportedLanguage> {
  const stored = await getStoredLanguageOverride();
  if (stored) {
    return stored;
  }
  return getDeviceLanguage();
}
