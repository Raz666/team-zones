import Fastify from "fastify";

import type { AppConfig } from "./config";
import { registerErrorHandlers } from "./lib/errors";
import { registerSecurityPlugins } from "./plugins/security";
import { registerHealthRoutes } from "./routes/health";

export function buildServer(config: AppConfig) {
  const server = Fastify({
    logger: {
      level: config.logLevel,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers['set-cookie']",
          "req.headers['x-api-key']",
        ],
        remove: true,
      },
    },
  });

  registerErrorHandlers(server);

  server.register(registerSecurityPlugins, { config });
  server.register(registerHealthRoutes, { config });

  return server;
}
