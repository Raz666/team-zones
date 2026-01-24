import jwt, { FastifyJWTOptions } from "@fastify/jwt";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { env } from "../config/env";
import { sendError } from "../lib/httpErrors";

export type AuthTokenPayload = {
  sub: string;
  deviceId?: string | null;
};

export const registerAuth = (app: FastifyInstance): void => {
  app.register(jwt as unknown as FastifyPluginAsync<FastifyJWTOptions>, {
    secret: env.authJwtSecret,
    sign: {
      iss: env.authJwtIssuer,
      expiresIn: `${env.authAccessTtlMinutes}m`,
    },
    verify: {
      allowedIss: env.authJwtIssuer,
    },
  });

  app.decorateRequest("auth", null);

  app.decorate("authenticate", async (request, reply) => {
    try {
      const payload = await request.jwtVerify<AuthTokenPayload>();
      request.auth = {
        userId: payload.sub,
        deviceId: payload.deviceId ?? null,
      };
    } catch (_error) {
      return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
    }
  });
};
