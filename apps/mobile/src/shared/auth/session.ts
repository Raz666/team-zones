import { secureStorage } from './secureStorage';

const REFRESH_TOKEN_KEY = 'auth.refreshToken.v1';
const CERTIFICATE_KEY = 'entitlements.certificate.v1';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
};

type AuthListener = (state: AuthState) => void;

export type StoredEntitlementCertificate = {
  certificate: string;
  entitlements: string[];
  offlineValidUntil: string;
};

let accessToken: string | null = null;
let refreshTokenCache: string | null | undefined;
const listeners = new Set<AuthListener>();

const notify = () => {
  const state: AuthState = {
    accessToken,
    refreshToken: refreshTokenCache ?? null,
  };
  listeners.forEach((listener) => listener(state));
};

export const subscribeAuthState = (listener: AuthListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
  notify();
};

export const getAccessToken = (): string | null => accessToken;

export const hydrateRefreshToken = async (): Promise<string | null> => {
  if (refreshTokenCache !== undefined) {
    return refreshTokenCache;
  }

  refreshTokenCache = await secureStorage.getItem(REFRESH_TOKEN_KEY);
  notify();
  return refreshTokenCache;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (refreshTokenCache === undefined) {
    return hydrateRefreshToken();
  }

  return refreshTokenCache;
};

export const setRefreshToken = async (token: string | null): Promise<void> => {
  refreshTokenCache = token;
  if (token) {
    await secureStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
  }
  notify();
};

export const clearSession = async (): Promise<void> => {
  accessToken = null;
  refreshTokenCache = null;
  await secureStorage.deleteItem(REFRESH_TOKEN_KEY);
  notify();
};

export const getEntitlementCertificate = async (): Promise<StoredEntitlementCertificate | null> => {
  const raw = await secureStorage.getItem(CERTIFICATE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredEntitlementCertificate;
    if (!parsed.certificate || !parsed.offlineValidUntil) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const setEntitlementCertificate = async (
  value: StoredEntitlementCertificate | null
): Promise<void> => {
  if (value) {
    await secureStorage.setItem(CERTIFICATE_KEY, JSON.stringify(value));
  } else {
    await secureStorage.deleteItem(CERTIFICATE_KEY);
  }
};
