import { addDays, isExpired } from "./tokens";

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  deviceId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  deletedAt: Date | null;
};

export type RefreshTokenCreateData = {
  id: string;
  userId: string;
  deviceId: string | null;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  deletedAt: Date | null;
};

export const isRefreshTokenActive = (
  token: Pick<RefreshTokenRecord, "expiresAt" | "revokedAt" | "deletedAt">,
  now: Date = new Date()
): boolean => {
  if (token.revokedAt || token.deletedAt) {
    return false;
  }

  return !isExpired(token.expiresAt, now);
};

export const buildRefreshTokenCreateData = (params: {
  id: string;
  userId: string;
  deviceId: string | null;
  tokenHash: string;
  now: Date;
  ttlDays: number;
}): RefreshTokenCreateData => {
  return {
    id: params.id,
    userId: params.userId,
    deviceId: params.deviceId,
    tokenHash: params.tokenHash,
    createdAt: params.now,
    expiresAt: addDays(params.now, params.ttlDays),
    lastUsedAt: params.now,
    revokedAt: null,
    replacedByTokenId: null,
    deletedAt: null,
  };
};

export const buildRefreshRotation = (params: {
  current: RefreshTokenRecord;
  newTokenId: string;
  newTokenHash: string;
  now: Date;
  ttlDays: number;
}): {
  revokeUpdate: {
    revokedAt: Date;
    replacedByTokenId: string;
    lastUsedAt: Date;
  };
  newTokenData: RefreshTokenCreateData;
} => {
  const newTokenData = buildRefreshTokenCreateData({
    id: params.newTokenId,
    userId: params.current.userId,
    deviceId: params.current.deviceId,
    tokenHash: params.newTokenHash,
    now: params.now,
    ttlDays: params.ttlDays,
  });

  return {
    revokeUpdate: {
      revokedAt: params.now,
      replacedByTokenId: params.newTokenId,
      lastUsedAt: params.now,
    },
    newTokenData,
  };
};
