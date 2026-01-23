import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma";

const serviceVersion = process.env.npm_package_version ?? "0.0.0";

export const registerHealthRoutes = (app: FastifyInstance): void => {
  app.get("/healthz", async () => ({
    ok: true,
    service: "api",
    version: serviceVersion,
    time: new Date().toISOString(),
  }));

  app.get("/readyz", async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        db: "ready",
      };
    } catch (error) {
      app.log.error({ err: error }, "Database readiness check failed");
      return reply.status(503).send({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "Database unavailable",
        },
      });
    }
  });
};
