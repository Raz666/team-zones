import fastify, { FastifyInstance } from "fastify";
import { env } from "./config/env";
import { registerErrorHandlers } from "./plugins/errors";
import { registerSecurity } from "./plugins/security";
import { prisma } from "./db/prisma";
import { registerHealthRoutes } from "./routes/health";

export const buildServer = (): FastifyInstance => {
  const app = fastify({
    logger: {
      level: env.nodeEnv === "production" ? "info" : "debug",
      redact: [
        "req.headers.authorization",
        "req.headers.cookie",
        "req.headers['x-api-key']",
      ],
    },
  });

  registerErrorHandlers(app);
  registerSecurity(app);
  registerHealthRoutes(app);
  app.addHook("onClose", async () => {
    await prisma.$disconnect();
  });

  return app;
};
