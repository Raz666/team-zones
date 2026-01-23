import { z } from "zod";

export const entitlementStatusValues = ["active", "revoked"] as const;
export const entitlementSourceValues = ["google_play"] as const;

export type EntitlementStatus = (typeof entitlementStatusValues)[number];
export type EntitlementSource = (typeof entitlementSourceValues)[number];

export const entitlementStatusSchema = z.enum(entitlementStatusValues);
export const entitlementSourceSchema = z.enum(entitlementSourceValues);

export const validateEntitlementFields = (data: {
  status?: unknown;
  source?: unknown;
}): void => {
  if (data.status !== undefined) {
    const result = entitlementStatusSchema.safeParse(data.status);
    if (!result.success) {
      throw new Error("Invalid entitlement status.");
    }
  }

  if (data.source !== undefined) {
    const result = entitlementSourceSchema.safeParse(data.source);
    if (!result.success) {
      throw new Error("Invalid entitlement source.");
    }
  }
};
