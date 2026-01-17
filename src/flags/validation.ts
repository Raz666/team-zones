import type { FlagDefinition, RemoteFlagsPayload } from './types';

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

export const isFlagDefinition = (value: unknown): value is FlagDefinition => {
  if (!isPlainObject(value)) return false;
  if (typeof value.enabled !== 'boolean') return false;
  if (value.allow !== undefined && !isStringArray(value.allow)) return false;

  return true;
};

export const isRemoteFlagsPayload = (value: unknown): value is RemoteFlagsPayload => {
  if (!isPlainObject(value)) return false;
  if (typeof value.version !== 'number') return false;
  if (typeof value.updatedAt !== 'string') return false;
  if (!isPlainObject(value.flags)) return false;

  for (const flag of Object.values(value.flags)) {
    if (!isFlagDefinition(flag)) return false;
  }

  return true;
};
