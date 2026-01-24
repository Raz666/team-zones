import { requestJson } from '../api/request';
import { getDeviceName } from './device';
import {
  clearSession,
  getRefreshToken,
  setAccessToken,
  setEntitlementCertificate,
  setRefreshToken,
} from './session';

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearSession();
      return null;
    }

    let response;
    try {
      response = await requestJson<{ accessToken: string; refreshToken: string }>({
        path: '/auth/refresh',
        method: 'POST',
        body: { refreshToken },
      });
    } catch (error) {
      console.warn('Failed to refresh access token', error);
      return null;
    }

    if (!response.ok || !response.data?.accessToken || !response.data?.refreshToken) {
      if (response.status === 401) {
        await clearSession();
      }
      return null;
    }

    setAccessToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    return response.data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

export const requestMagicLink = async (email: string): Promise<boolean> => {
  try {
    const response = await requestJson<{ ok: boolean }>({
      path: '/auth/request-link',
      method: 'POST',
      body: { email },
    });

    return response.ok;
  } catch (error) {
    console.warn('Failed to request magic link', error);
    return false;
  }
};

export const exchangeMagicLink = async (token: string): Promise<boolean> => {
  try {
    const response = await requestJson<{ accessToken: string; refreshToken: string }>(
      {
        path: '/auth/exchange-link',
        method: 'POST',
        body: {
          token,
          deviceName: getDeviceName(),
        },
      }
    );

    if (!response.ok || !response.data?.accessToken || !response.data?.refreshToken) {
      return false;
    }

    setAccessToken(response.data.accessToken);
    await setRefreshToken(response.data.refreshToken);
    return true;
  } catch (error) {
    console.warn('Failed to exchange magic link', error);
    return false;
  }
};

export const logout = async (): Promise<void> => {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await requestJson({
        path: '/auth/logout',
        method: 'POST',
        body: { refreshToken },
      });
    } catch (error) {
      console.warn('Failed to revoke refresh token', error);
    }
  }

  await clearSession();
  await setEntitlementCertificate(null);
};
