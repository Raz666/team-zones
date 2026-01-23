import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../config";

type HealthResponse = {
  ok: true;
  service: "api";
  version: string;
  time: string;
};

export async function registerHealthRoutes(
  server: FastifyInstance,
  options: { config: AppConfig }
): Promise<void> {
  const { config } = options;

  server.get("/healthz", async (): Promise<HealthResponse> => {
    return {
      ok: true,
      service: "api",
      version: config.serviceVersion,
      time: new Date().toISOString(),
    };
  });

  server.get("/readyz", async () => {
    return { ok: true, db: "not_configured" as const };
  });
}
