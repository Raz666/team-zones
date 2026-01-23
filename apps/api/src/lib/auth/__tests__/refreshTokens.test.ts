/// <reference types="vitest" />
import { describe, expect, test } from "vitest";
import {
  buildRefreshRotation,
  isRefreshTokenActive,
} from "../refreshTokens";

describe("refresh token rotation", () => {
  test("builds rotation chain correctly", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const current = {
      id: "old-token-id",
      userId: "user-1",
      deviceId: "device-1",
      expiresAt: new Date("2025-02-01T00:00:00Z"),
      revokedAt: null,
      deletedAt: null,
    };

    const rotation = buildRefreshRotation({
      current,
      newTokenId: "new-token-id",
      newTokenHash: "hash-new",
      now,
      ttlDays: 30,
    });

    expect(rotation.revokeUpdate.replacedByTokenId).toBe("new-token-id");
    expect(rotation.revokeUpdate.revokedAt.toISOString()).toBe(now.toISOString());

    expect(rotation.newTokenData.userId).toBe("user-1");
    expect(rotation.newTokenData.deviceId).toBe("device-1");
    expect(rotation.newTokenData.tokenHash).toBe("hash-new");
    expect(rotation.newTokenData.expiresAt.getTime()).toBeGreaterThan(now.getTime());
    expect(isRefreshTokenActive(current, now)).toBe(true);
  });
});
