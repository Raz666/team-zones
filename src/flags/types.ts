export type FlagDefinition = {
  enabled: boolean;
  allow?: string[];
};

export type RemoteFlagsPayload = {
  version: number;
  updatedAt: string;
  flags: Record<string, FlagDefinition>;
};

export type LocalOverrides = Record<string, boolean>;

export type FlagsRuntimeSnapshot = {
  deviceId: string | null;
  remote: RemoteFlagsPayload | null;
  remoteFetchedAt: number | null;
  overrides: LocalOverrides;
};

export type FlagsDiagnostics = {
  deviceId: string | null;
  remote: {
    hasRemote: boolean;
    version: number | null;
    updatedAt: string | null;
    fetchedAt: number | null;
    stale: boolean;
  };
  overrides: LocalOverrides;
  knownFlags: string[];
};
