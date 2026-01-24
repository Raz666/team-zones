import Constants from 'expo-constants';

const DEFAULT_API_URL = 'http://192.168.1.153:3000';

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

export const getApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return normalizeBaseUrl(envUrl);
  }

  const extraUrl = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof extraUrl === 'string' && extraUrl.trim().length > 0) {
    return normalizeBaseUrl(extraUrl);
  }

  return DEFAULT_API_URL;
};
