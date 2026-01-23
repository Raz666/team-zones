import { FastifyInstance } from "fastify";

const serviceVersion = process.env.npm_package_version ?? "0.0.0";

export const registerHealthRoutes = (app: FastifyInstance): void => {
  app.get("/healthz", async () => ({
    ok: true,
    service: "api",
    version: serviceVersion,
    time: new Date().toISOString(),
  }));

  app.get("/readyz", async () => ({
    ok: true,
    db: "not_configured",
  }));
};
