import type { RemoteFlagsPayload } from './types';
import { isRemoteFlagsPayload } from './validation';

export const FLAGS_URL = 'https://team-zones.razart.eu/flags.json';
export const FLAGS_TIMEOUT_MS = 8000;
export const FLAGS_TTL_MS = 6 * 60 * 60 * 1000;

type RemoteFetchResult = {
  payload: RemoteFlagsPayload;
  fetchedAt: number;
};

export const isFlagsStale = (fetchedAt: number | null): boolean => {
  if (!fetchedAt) return true;

  return Date.now() - fetchedAt > FLAGS_TTL_MS;
};

export async function fetchRemoteFlags(): Promise<RemoteFetchResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FLAGS_TIMEOUT_MS);

  try {
    const response = await fetch(FLAGS_URL, { signal: controller.signal });

    if (!response.ok) {
      if (__DEV__) {
        console.warn('Remote flags fetch failed with status', response.status);
      }

      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      if (__DEV__) {
        console.warn('Remote flags payload empty');
      }

      return null;
    }

    const text = await response.text();
    if (!text.trim()) {
      if (__DEV__) {
        console.warn('Remote flags payload empty');
      }

      return null;
    }

    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      if (__DEV__) {
        console.warn('Remote flags payload invalid JSON', error);
      }

      return null;
    }

    if (!isRemoteFlagsPayload(payload)) {
      if (__DEV__) {
        console.warn('Remote flags payload invalid', payload);
      }

      return null;
    }

    return { payload, fetchedAt: Date.now() };
  } catch (error) {
    if (__DEV__) {
      console.warn('Remote flags fetch error', error);
    }

    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
