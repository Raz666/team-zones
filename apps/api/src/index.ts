import type { AppConfig } from "./config";
import { loadConfig } from "./config";
import { loadEnvFile } from "./config/env";
import { buildServer } from "./server";

async function startServer(): Promise<void> {
  let config: AppConfig;

  try {
    loadEnvFile();
    config = loadConfig();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Config validation failed: ${message}`);
    process.exit(1);
    return;
  }

  const server = buildServer(config);

  try {
    await server.listen({ port: config.port, host: config.host });
  } catch (error) {
    server.log.error({ err: error }, "Failed to start server");
    process.exit(1);
  }
}

void startServer();
