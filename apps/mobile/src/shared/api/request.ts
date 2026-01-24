import { getApiBaseUrl } from './config';

export type ApiResponse<T> = {
  ok: boolean;
  status: number;
  data: T | null;
};

type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  accessToken?: string | null;
};

const buildHeaders = (options: RequestOptions): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  return headers;
};

export const requestJson = async <T>(options: RequestOptions): Promise<ApiResponse<T>> => {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}${options.path}`, {
    method: options.method ?? 'GET',
    headers: buildHeaders(options),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return { ok: response.ok, status: response.status, data: null };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return { ok: response.ok, status: response.status, data: null };
  }

  try {
    const data = (await response.json()) as T;
    return { ok: response.ok, status: response.status, data };
  } catch {
    return { ok: response.ok, status: response.status, data: null };
  }
};
