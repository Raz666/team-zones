import packageJson from "../../package.json";

type NodeEnv = "development" | "test" | "production";
type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export type AppConfig = {
  env: NodeEnv;
  port: number;
  host: string;
  logLevel: LogLevel;
  serviceVersion: string;
  corsAllowOrigins: string[] | null;
  rateLimitMax: number;
  rateLimitWindowMs: number;
};

const NODE_ENVS: NodeEnv[] = ["development", "test", "production"];
const LOG_LEVELS: LogLevel[] = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parseNodeEnv(value: string): NodeEnv {
  if (!NODE_ENVS.includes(value as NodeEnv)) {
    throw new Error(
      `Invalid NODE_ENV "${value}". Expected one of: ${NODE_ENVS.join(", ")}.`
    );
  }
  return value as NodeEnv;
}

function parseLogLevel(value: string): LogLevel {
  if (!LOG_LEVELS.includes(value as LogLevel)) {
    throw new Error(
      `Invalid LOG_LEVEL "${value}". Expected one of: ${LOG_LEVELS.join(", ")}.`
    );
  }
  return value as LogLevel;
}

function parseRequiredPort(value: string): number {
  const port = Number.parseInt(value, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT "${value}". Expected a valid TCP port.`);
  }
  return port;
}

function parseOptionalInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${name} "${raw}". Expected a positive integer.`);
  }
  return parsed;
}

function parseCorsAllowlist(value: string | undefined): string[] | null {
  if (!value) {
    return null;
  }
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : null;
}

export function loadConfig(): AppConfig {
  const env = parseNodeEnv(requireEnv("NODE_ENV"));
  const port = parseRequiredPort(requireEnv("PORT"));
  const logLevel = parseLogLevel(requireEnv("LOG_LEVEL"));
  const host = process.env.HOST?.trim() || "0.0.0.0";
  const rateLimitMax = parseOptionalInt("RATE_LIMIT_MAX", 100);
  const rateLimitWindowMs = parseOptionalInt("RATE_LIMIT_WINDOW_MS", 60_000);
  const corsAllowOrigins = parseCorsAllowlist(process.env.CORS_ALLOW_ORIGINS);

  if (env === "production" && !corsAllowOrigins) {
    throw new Error("CORS_ALLOW_ORIGINS is required in production.");
  }

  return {
    env,
    port,
    host,
    logLevel,
    serviceVersion: packageJson.version ?? "0.0.0",
    corsAllowOrigins,
    rateLimitMax,
    rateLimitWindowMs,
  };
}
