import type { FastifyInstance } from "fastify";

export type ErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "INTERNAL_SERVER_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function formatError(code: ErrorCode, message: string) {
  return { error: { code, message } };
}

export function registerErrorHandlers(server: FastifyInstance): void {
  server.setNotFoundHandler((_request, reply) => {
    reply.status(404).send(formatError("NOT_FOUND", "Route not found"));
  });

  server.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode ?? 500;
    const code =
      error instanceof AppError
        ? error.code
        : statusCode === 429
        ? "RATE_LIMITED"
        : statusCode >= 500
        ? "INTERNAL_SERVER_ERROR"
        : "BAD_REQUEST";
    const message =
      statusCode >= 500 ? "Internal server error" : error.message;

    if (statusCode >= 500) {
      request.log.error({ err: error }, "Unhandled error");
    }

    reply.status(statusCode).send(formatError(code, message));
  });
}
