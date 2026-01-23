import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";
import { validateEntitlementFields } from "../lib/entitlements";

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.databaseUrl;
}

export const prisma = new PrismaClient({
  errorFormat: "minimal",
});

type EntitlementPayload = {
  status?: unknown;
  source?: unknown;
};

const asPayloadArray = (value: unknown): EntitlementPayload[] => {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? (value as EntitlementPayload[]) : [value as EntitlementPayload];
};

prisma.$use(async (params, next) => {
  if (params.model === "Entitlement") {
    const args = params.args as Record<string, unknown> | undefined;
    let payloads: EntitlementPayload[] = [];

    switch (params.action) {
      case "create":
      case "update":
      case "updateMany":
        payloads = asPayloadArray(args?.data);
        break;
      case "createMany":
        payloads = asPayloadArray(args?.data);
        break;
      case "upsert":
        payloads = asPayloadArray(args?.create).concat(asPayloadArray(args?.update));
        break;
      default:
        payloads = [];
    }

    payloads.forEach((payload) => validateEntitlementFields(payload));
  }

  return next(params);
});
