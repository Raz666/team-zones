import { requestJson } from './request';
import { getAccessToken, setAccessToken } from '../auth/session';
import { refreshAccessToken } from '../auth/api';

type ApiClientOptions<T> = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  accessToken?: string | null;
  responseParser?: (data: unknown) => T | null;
  retryOnUnauthorized?: boolean;
};

export const apiRequest = async <T>(options: ApiClientOptions<T>): Promise<{
  ok: boolean;
  status: number;
  data: T | null;
}> => {
  const token = options.accessToken ?? getAccessToken();
  const response = await requestJson<unknown>({
    path: options.path,
    method: options.method,
    body: options.body,
    headers: options.headers,
    accessToken: token,
  });

  if (response.status !== 401 || options.retryOnUnauthorized === false) {
    return {
      ok: response.ok,
      status: response.status,
      data: options.responseParser ? options.responseParser(response.data) : (response.data as T),
    };
  }

  const refreshedToken = await refreshAccessToken();
  if (!refreshedToken) {
    return {
      ok: response.ok,
      status: response.status,
      data: null,
    };
  }

  setAccessToken(refreshedToken);

  const retry = await requestJson<unknown>({
    path: options.path,
    method: options.method,
    body: options.body,
    headers: options.headers,
    accessToken: refreshedToken,
  });

  return {
    ok: retry.ok,
    status: retry.status,
    data: options.responseParser ? options.responseParser(retry.data) : (retry.data as T),
  };
};
