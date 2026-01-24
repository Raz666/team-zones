import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { buildEntitlementCertificatePayload } from "../lib/entitlementCertificates";
import { sendError } from "../lib/httpErrors";

export const registerEntitlementRoutes = (app: FastifyInstance): void => {
  app.post(
    "/entitlements/certificate",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.auth?.userId) {
        return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
      }

      const entitlements = await prisma.entitlement.findMany({
        where: {
          userId: request.auth.userId,
          status: "active",
          deletedAt: null,
        },
        select: {
          key: true,
        },
      });

      const entitlementKeys = Array.from(
        new Set(entitlements.map((entitlement) => entitlement.key))
      );

      const { payload, offlineValidUntil } = buildEntitlementCertificatePayload({
        userId: request.auth.userId,
        entitlements: entitlementKeys,
        ttlDays: env.offlineCertTtlDays,
      });

      const certificate = app.jwt.sign(payload, {
        key: env.entitlementCertSecret,
        algorithm: "HS256",
      });

      return reply.send({
        entitlements: entitlementKeys,
        certificate,
        offlineValidUntil,
      });
    }
  );
};
