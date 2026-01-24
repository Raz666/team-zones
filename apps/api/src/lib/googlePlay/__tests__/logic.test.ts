import { describe, expect, test, vi } from "vitest";
import {
  isPurchaseTokenClaimedByOtherUser,
  verifyAllowlistedPurchase,
} from "../logic";

describe("google play allowlist", () => {
  test("rejects non-allowlisted product ids", async () => {
    const verifier = vi.fn();

    await expect(
      verifyAllowlistedPurchase({
        allowlist: ["premium_monthly"],
        productId: "other",
        purchaseToken: "token",
        verifyPurchase: verifier,
      })
    ).rejects.toThrow("PRODUCT_NOT_ALLOWED");

    expect(verifier).not.toHaveBeenCalled();
  });

  test("calls verifier for allowlisted product ids", async () => {
    const verifier = vi.fn().mockResolvedValue({ ok: true });

    await expect(
      verifyAllowlistedPurchase({
        allowlist: ["premium_monthly"],
        productId: "premium_monthly",
        purchaseToken: "token",
        verifyPurchase: verifier,
      })
    ).resolves.toEqual({ ok: true });

    expect(verifier).toHaveBeenCalledTimes(1);
  });
});

describe("purchase token conflict", () => {
  test("detects tokens claimed by other users", () => {
    expect(isPurchaseTokenClaimedByOtherUser("user-1", "user-1")).toBe(false);
    expect(isPurchaseTokenClaimedByOtherUser(null, "user-1")).toBe(false);
    expect(isPurchaseTokenClaimedByOtherUser("user-2", "user-1")).toBe(true);
  });
});
