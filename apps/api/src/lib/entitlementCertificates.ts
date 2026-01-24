import { randomBytes } from "crypto";
import { addDays } from "./auth/tokens";

export type EntitlementCertificatePayload = {
  sub: string;
  entitlements: string[];
  iat: number;
  exp: number;
  nonce: string;
};

export const buildEntitlementCertificatePayload = (params: {
  userId: string;
  entitlements: string[];
  ttlDays: number;
  now?: Date;
  nonce?: string;
}): { payload: EntitlementCertificatePayload; offlineValidUntil: string } => {
  const now = params.now ?? new Date();
  const issuedAtSeconds = Math.floor(now.getTime() / 1000);
  const expiresAt = addDays(now, params.ttlDays);
  const expSeconds = Math.floor(expiresAt.getTime() / 1000);
  const nonce = params.nonce ?? randomBytes(16).toString("base64url");

  return {
    payload: {
      sub: params.userId,
      entitlements: params.entitlements,
      iat: issuedAtSeconds,
      exp: expSeconds,
      nonce,
    },
    offlineValidUntil: expiresAt.toISOString(),
  };
};
