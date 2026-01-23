import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const generateOpaqueToken = (bytes = 32): string => {
  return randomBytes(bytes).toString("base64url");
};

export const hashToken = (token: string): string => {
  return createHash("sha256").update(token).digest("hex");
};

export const verifyTokenHash = (token: string, tokenHash: string): boolean => {
  const computed = hashToken(token);
  const computedBuffer = Buffer.from(computed, "utf8");
  const storedBuffer = Buffer.from(tokenHash, "utf8");

  if (computedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(computedBuffer, storedBuffer);
};

export const addMinutes = (date: Date, minutes: number): Date => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const addDays = (date: Date, days: number): Date => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
};

export const isExpired = (expiresAt: Date, now: Date = new Date()): boolean => {
  return expiresAt.getTime() <= now.getTime();
};
