import { DEFAULT_FLAGS } from './defaults';
import { buildDiagnostics } from './diagnostics';
import { evaluateAllFlags, evaluateFlag } from './evaluator';
import { getRuntimeActions, getRuntimeSnapshot } from './FlagsContext';
import type { FlagsDiagnostics, RemoteFlagsPayload } from './types';

export function getFlag(name: string): boolean {
  const snapshot = getRuntimeSnapshot();

  return evaluateFlag(name, {
    defaults: DEFAULT_FLAGS,
    remote: snapshot.remote,
    overrides: snapshot.overrides,
    deviceId: snapshot.deviceId,
  });
}

export function getAllFlags(): Record<string, boolean> {
  const snapshot = getRuntimeSnapshot();

  return evaluateAllFlags({
    defaults: DEFAULT_FLAGS,
    remote: snapshot.remote,
    overrides: snapshot.overrides,
    deviceId: snapshot.deviceId,
  });
}

export async function refreshFlags(): Promise<RemoteFlagsPayload | null> {
  return getRuntimeActions().refreshFlags();
}

export async function setOverride(name: string, value: boolean | null): Promise<void> {
  return getRuntimeActions().setOverride(name, value);
}

export async function clearOverrides(): Promise<void> {
  return getRuntimeActions().clearOverrides();
}

export function getDiagnostics(): FlagsDiagnostics {
  return buildDiagnostics(getRuntimeSnapshot());
}

export { DEFAULT_FLAGS } from './defaults';
export { buildDiagnostics } from './diagnostics';
export { evaluateAllFlags, evaluateFlag } from './evaluator';
export { FlagsContext, FlagsProvider } from './FlagsContext';
export {
  fetchRemoteFlags,
  FLAGS_TIMEOUT_MS,
  FLAGS_TTL_MS,
  FLAGS_URL,
  isFlagsStale,
} from './fetcher';
export { getOrCreateDeviceId } from './deviceId';
export {
  clearOverrides as clearOverridesStorage,
  loadDeviceId,
  loadOverrides,
  loadRemoteFetchedAt,
  loadRemoteFlags,
  saveDeviceId,
  saveOverrides,
  saveRemoteFetchedAt,
  saveRemoteFlags,
  STORAGE_KEYS,
} from './storage';
export { useFlag } from './useFlag';
export type {
  FlagDefinition,
  FlagsDiagnostics,
  FlagsRuntimeSnapshot,
  LocalOverrides,
  RemoteFlagsPayload,
} from './types';
