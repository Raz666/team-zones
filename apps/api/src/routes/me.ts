import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma";
import { sendError } from "../lib/httpErrors";

export const registerMeRoutes = (app: FastifyInstance): void => {
  app.get(
    "/me",
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

      return reply.send({
        user: {
          id: request.auth.userId,
        },
        entitlements: entitlementKeys,
      });
    }
  );
};
