import { buildServer } from "./server";
import { env } from "./config/env";

const app = buildServer();

const start = async () => {
  try {
    await app.listen({
      port: env.apiPort,
      host: env.apiHost,
    });
  } catch (error) {
    app.log.error(error, "Failed to start server");
    process.exit(1);
  }
};

start();
