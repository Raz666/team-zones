import { buildServer } from "./server";
import { env } from "./config/env";
import { startSoftDeletePurge } from "./lib/softDeletePurge";

const app = buildServer();

const start = async () => {
  try {
    await app.listen({
      port: env.apiPort,
      host: env.apiHost,
    });
    startSoftDeletePurge(app);
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
};

start();
