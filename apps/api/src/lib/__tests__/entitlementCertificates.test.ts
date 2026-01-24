import { describe, expect, test } from "vitest";
import { buildEntitlementCertificatePayload } from "../entitlementCertificates";

describe("entitlement certificates", () => {
  test("builds payload with exp/iat and nonce", () => {
    const now = new Date("2025-01-01T00:00:00Z");
    const { payload, offlineValidUntil } = buildEntitlementCertificatePayload({
      userId: "user-1",
      entitlements: ["premium"],
      ttlDays: 30,
      now,
      nonce: "nonce-123",
    });

    expect(payload.sub).toBe("user-1");
    expect(payload.entitlements).toEqual(["premium"]);
    expect(payload.iat).toBe(Math.floor(now.getTime() / 1000));
    expect(payload.exp).toBe(Math.floor(new Date("2025-01-31T00:00:00Z").getTime() / 1000));
    expect(payload.nonce).toBe("nonce-123");
    expect(offlineValidUntil).toBe("2025-01-31T00:00:00.000Z");
  });
});
