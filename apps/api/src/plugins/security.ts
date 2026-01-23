import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";
import { env } from "../config/env";

export const registerSecurity = (app: FastifyInstance): void => {
  app.register(helmet);

  const isProd = env.nodeEnv === "production";
  const hasAllowList = (env.corsAllowOrigins?.length ?? 0) > 0;

  if (isProd || hasAllowList) {
    const allowedOrigins = new Set(env.corsAllowOrigins ?? []);

    app.register(cors, {
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, false);
          return;
        }

        callback(null, allowedOrigins.has(origin));
      },
    });
  } else {
    app.register(cors, {
      origin: true,
    });
  }

  if (env.rateLimitEnabled) {
    app.register(rateLimit, {
      max: env.rateLimitMax,
      timeWindow: env.rateLimitWindowMs,
    });
  }
};
