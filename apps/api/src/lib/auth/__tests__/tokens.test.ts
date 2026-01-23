/// <reference types="vitest" />
import { describe, expect, test } from "vitest";
import { generateOpaqueToken, hashToken, verifyTokenHash } from "../tokens";

describe("token hashing", () => {
  test("hashes are deterministic and verifiable", () => {
    const token = generateOpaqueToken(32);
    const tokenHash = hashToken(token);

    expect(tokenHash).not.toEqual(token);
    expect(verifyTokenHash(token, tokenHash)).toBe(true);
    expect(verifyTokenHash("different", tokenHash)).toBe(false);
  });
});
