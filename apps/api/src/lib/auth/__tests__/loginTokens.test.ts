/// <reference types="vitest" />
import { describe, expect, test } from "vitest";
import { isLoginTokenUsable } from "../loginTokens";

describe("login token usage", () => {
  test("rejects expired or used tokens", () => {
    const now = new Date("2025-01-01T00:00:00Z");

    expect(
      isLoginTokenUsable(
        {
          expiresAt: new Date("2025-01-01T00:10:00Z"),
          usedAt: null,
        },
        now
      )
    ).toBe(true);

    expect(
      isLoginTokenUsable(
        {
          expiresAt: new Date("2025-01-01T00:10:00Z"),
          usedAt: new Date("2025-01-01T00:05:00Z"),
        },
        now
      )
    ).toBe(false);

    expect(
      isLoginTokenUsable(
        {
          expiresAt: new Date("2024-12-31T23:59:00Z"),
          usedAt: null,
        },
        now
      )
    ).toBe(false);
  });
});
