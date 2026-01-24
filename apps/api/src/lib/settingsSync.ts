export const SETTINGS_MAX_BYTES = 64 * 1024;

export const serializeSettings = (
  settings: unknown,
  maxBytes: number = SETTINGS_MAX_BYTES
): { json: string; size: number } => {
  let json: string;
  try {
    json = JSON.stringify(settings);
  } catch (_error) {
    throw new Error("INVALID_SETTINGS");
  }

  const size = Buffer.byteLength(json, "utf8");
  if (size > maxBytes) {
    throw new Error("SETTINGS_TOO_LARGE");
  }

  return { json, size };
};

export const isVersionAccepted = (
  latestVersion: number | null,
  incomingVersion: number
): boolean => {
  if (latestVersion === null) {
    return true;
  }

  return incomingVersion > latestVersion;
};

export const selectRetentionDeletes = (
  snapshots: { id: string }[],
  retainCount: number
): string[] => {
  if (snapshots.length <= retainCount) {
    return [];
  }

  return snapshots.slice(retainCount).map((snapshot) => snapshot.id);
};
