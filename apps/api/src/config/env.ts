import { config as loadEnv } from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "production") {
  loadEnv();
}

const booleanSchema = z.preprocess((value) => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "n"].includes(normalized)) {
      return false;
    }
  }
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_JWT_SECRET: z.string().min(1),
  AUTH_JWT_ISSUER: z.string().min(1),
  AUTH_ACCESS_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  AUTH_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(90),
  LOGIN_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_MAX_REQUEST_LINK: z.coerce.number().int().positive().default(5),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  API_HOST: z.string().min(1).default("0.0.0.0"),
  CORS_ALLOW_ORIGINS: z.string().optional(),
  RATE_LIMIT_ENABLED: booleanSchema.default(true),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(
    `Invalid environment configuration. ${details || "Check required variables."}`
  );
}

const nodeEnv = parsed.data.NODE_ENV ?? "development";
const databaseUrl = parsed.data.DATABASE_URL ?? "file:./prisma/dev.db";

if (nodeEnv === "production" && !parsed.data.DATABASE_URL) {
  throw new Error(
    "Invalid environment configuration. DATABASE_URL is required in production."
  );
}

const corsAllowOrigins = parsed.data.CORS_ALLOW_ORIGINS
  ? parsed.data.CORS_ALLOW_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : undefined;

export const env = {
  nodeEnv,
  databaseUrl,
  authJwtSecret: parsed.data.AUTH_JWT_SECRET,
  authJwtIssuer: parsed.data.AUTH_JWT_ISSUER,
  authAccessTtlMinutes: parsed.data.AUTH_ACCESS_TTL_MINUTES,
  authRefreshTtlDays: parsed.data.AUTH_REFRESH_TTL_DAYS,
  loginTokenTtlMinutes: parsed.data.LOGIN_TOKEN_TTL_MINUTES,
  authRateLimitMaxRequestLink: parsed.data.AUTH_RATE_LIMIT_MAX_REQUEST_LINK,
  authRateLimitWindowMs: parsed.data.AUTH_RATE_LIMIT_WINDOW_MS,
  apiPort: parsed.data.API_PORT,
  apiHost: parsed.data.API_HOST,
  corsAllowOrigins,
  rateLimitEnabled: parsed.data.RATE_LIMIT_ENABLED,
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
  rateLimitWindowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
} as const;

export type Env = typeof env;
