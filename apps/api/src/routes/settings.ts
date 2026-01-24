import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db/prisma";
import { sendError } from "../lib/httpErrors";
import {
  SETTINGS_MAX_BYTES,
  isVersionAccepted,
  selectRetentionDeletes,
  serializeSettings,
} from "../lib/settingsSync";

const settingsBodySchema = z.object({
  version: z.number().int().nonnegative(),
  settings: z.record(z.unknown()),
});

const SETTINGS_RETENTION_COUNT = 20;

export const registerSettingsRoutes = (app: FastifyInstance): void => {
  app.get(
    "/settings",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.auth?.userId) {
        return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
      }

      const userId = request.auth.userId;

      const snapshot = await prisma.settingsSnapshot.findFirst({
        where: {
          userId,
          deletedAt: null,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (!snapshot) {
        return reply.status(204).send();
      }

      return reply.send({
        version: snapshot.version,
        settingsJson: snapshot.settingsJson,
        createdAt: snapshot.createdAt,
        updatedAt: snapshot.updatedAt,
      });
    }
  );

  app.put(
    "/settings",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.auth?.userId) {
        return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
      }

      const userId = request.auth.userId;
      const deviceId = request.auth.deviceId;

      const parsed = settingsBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
      }

      let settingsJson: string;
      try {
        settingsJson = serializeSettings(parsed.data.settings, SETTINGS_MAX_BYTES).json;
      } catch (error) {
        if (error instanceof Error && error.message === "SETTINGS_TOO_LARGE") {
          return sendError(
            reply,
            413,
            "PAYLOAD_TOO_LARGE",
            "Settings payload exceeds 64KB."
          );
        }

        return sendError(reply, 400, "BAD_REQUEST", "Invalid settings payload.");
      }

      const now = new Date();

      try {
        const created = await prisma.$transaction(async (tx) => {
          const latest = await tx.settingsSnapshot.findFirst({
            where: {
              userId,
              deletedAt: null,
            },
            orderBy: {
              version: "desc",
            },
            select: {
              version: true,
            },
          });

          if (!isVersionAccepted(latest?.version ?? null, parsed.data.version)) {
            throw new Error("VERSION_CONFLICT");
          }

          const snapshot = await tx.settingsSnapshot.create({
            data: {
              userId,
              deviceId,
              version: parsed.data.version,
              settingsJson,
            },
          });

          const remaining = await tx.settingsSnapshot.findMany({
            where: {
              userId,
              deletedAt: null,
            },
            orderBy: {
              version: "desc",
            },
            select: {
              id: true,
            },
          });

          const idsToDelete = selectRetentionDeletes(
            remaining,
            SETTINGS_RETENTION_COUNT
          );

          if (idsToDelete.length > 0) {
            await tx.settingsSnapshot.updateMany({
              where: {
                id: {
                  in: idsToDelete,
                },
              },
              data: {
                deletedAt: now,
                updatedAt: now,
              },
            });
          }

          return snapshot;
        });

        return reply.send({
          version: created.version,
          settingsJson: created.settingsJson,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "VERSION_CONFLICT") {
          return sendError(
            reply,
            409,
            "VERSION_CONFLICT",
            "Settings version must be greater than the latest version."
          );
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          return sendError(
            reply,
            409,
            "VERSION_CONFLICT",
            "Settings version must be greater than the latest version."
          );
        }

        app.log.error({ err: error }, "Failed to store settings snapshot");
        return sendError(reply, 500, "INTERNAL_SERVER_ERROR", "Server error.");
      }
    }
  );
};
