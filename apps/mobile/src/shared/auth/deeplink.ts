import * as Linking from 'expo-linking';

export const extractMagicLinkToken = (url: string): string | null => {
  const parsed = Linking.parse(url);
  const token = parsed.queryParams?.token;
  if (typeof token === 'string' && token.trim().length > 0) {
    return token.trim();
  }
  return null;
};
