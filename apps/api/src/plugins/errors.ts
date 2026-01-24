import { FastifyInstance } from "fastify";

const errorCodeForStatus = (statusCode: number): string => {
  if (statusCode >= 500) {
    return "INTERNAL_SERVER_ERROR";
  }
  if (statusCode === 429) {
    return "RATE_LIMITED";
  }
  if (statusCode === 404) {
    return "NOT_FOUND";
  }
  if (statusCode === 401) {
    return "UNAUTHORIZED";
  }
  if (statusCode === 403) {
    return "FORBIDDEN";
  }
  if (statusCode === 400) {
    return "BAD_REQUEST";
  }
  return "ERROR";
};

export const registerErrorHandlers = (app: FastifyInstance): void => {
  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Not Found",
      },
    });
  });

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (() => {
      if (error && typeof error === "object" && "statusCode" in error) {
        const value = (error as { statusCode?: unknown }).statusCode;
        if (typeof value === "number") {
          return value;
        }
      }
      return 500;
    })();
    const code = errorCodeForStatus(statusCode);
    const message =
      statusCode >= 500
        ? "Internal Server Error"
        : error instanceof Error && error.message
          ? error.message
          : "Request failed.";

    const logError = error instanceof Error ? error : new Error("Unknown error");

    if (statusCode >= 500) {
      app.log.error({ err: logError }, "Unhandled error");
    } else {
      app.log.warn({ err: logError }, "Request error");
    }

    reply.status(statusCode).send({
      error: {
        code,
        message,
      },
    });
  });
};
