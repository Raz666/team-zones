import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";

import type { AppConfig } from "../config";
import { formatError } from "../lib/errors";

export async function registerSecurityPlugins(
  server: FastifyInstance,
  options: { config: AppConfig }
): Promise<void> {
  const { config } = options;

  await server.register(helmet);

  await server.register(rateLimit, {
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
    errorResponseBuilder: () =>
      formatError("RATE_LIMITED", "Too many requests"),
  });

  const corsOptions = config.corsAllowOrigins?.length
    ? { origin: config.corsAllowOrigins }
    : {
        origin: true,
        // TODO: tighten CORS with an env allowlist before production rollout.
      };

  await server.register(cors, corsOptions);
}
