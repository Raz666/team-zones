import { DEFAULT_FLAGS } from './defaults';
import { isFlagsStale } from './fetcher';
import type { FlagsDiagnostics, FlagsRuntimeSnapshot } from './types';

export function buildDiagnostics(snapshot: FlagsRuntimeSnapshot): FlagsDiagnostics {
  const knownFlags = new Set<string>(Object.keys(DEFAULT_FLAGS));
  if (snapshot.remote) {
    for (const key of Object.keys(snapshot.remote.flags)) {
      knownFlags.add(key);
    }
  }

  for (const key of Object.keys(snapshot.overrides)) {
    knownFlags.add(key);
  }

  const fetchedAt = snapshot.remoteFetchedAt ?? null;

  return {
    deviceId: snapshot.deviceId,
    remote: {
      hasRemote: Boolean(snapshot.remote),
      version: snapshot.remote?.version ?? null,
      updatedAt: snapshot.remote?.updatedAt ?? null,
      fetchedAt,
      stale: isFlagsStale(fetchedAt),
    },
    overrides: { ...snapshot.overrides },
    knownFlags: Array.from(knownFlags).sort(),
  };
}
