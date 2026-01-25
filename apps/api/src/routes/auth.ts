import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendMagicLink } from "../lib/email";
import { maskEmail } from "../lib/privacy";
import { sendError } from "../lib/httpErrors";
import { isLoginTokenUsable } from "../lib/auth/loginTokens";
import { canonicalizeEmail } from "../lib/auth/normalize";
import {
  buildRefreshRotation,
  buildRefreshTokenCreateData,
  isRefreshTokenActive,
} from "../lib/auth/refreshTokens";
import {
  addMinutes,
  generateOpaqueToken,
  hashToken,
} from "../lib/auth/tokens";

const requestLinkSchema = z.object({
  email: z.string().trim().email(),
});

const exchangeLinkSchema = z.object({
  token: z.string().trim().min(1),
  deviceName: z.string().trim().min(1).max(100).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1),
});

export const registerAuthRoutes = (app: FastifyInstance): void => {
  const requestLinkRateLimit = env.rateLimitEnabled
    ? {
        config: {
          rateLimit: {
            max: env.authRateLimitMaxRequestLink,
            timeWindow: env.authRateLimitWindowMs,
          },
        },
      }
    : {};

  app.post(
    "/auth/request-link",
    requestLinkRateLimit,
    async (request, reply) => {
      const parsed = requestLinkSchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
      }

      const email = canonicalizeEmail(parsed.data.email);
      app.log.info(
        { event: "auth.request_link", email: maskEmail(email) },
        "Magic link requested."
      );
      const token = generateOpaqueToken(32);
      const tokenHash = hashToken(token);
      const now = new Date();
      const expiresAt = addMinutes(now, env.loginTokenTtlMinutes);

      await prisma.loginToken.create({
        data: {
          email,
          tokenHash,
          expiresAt,
        },
      });

      await sendMagicLink({ email, token });

      return reply.send({
        ok: true,
        message: "If an account exists, a sign-in link has been sent.",
      });
    }
  );

  app.post("/auth/exchange-link", async (request, reply) => {
    const parsed = exchangeLinkSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
    }

    const token = parsed.data.token;
    const tokenHash = hashToken(token);
    const now = new Date();

    const loginToken = await prisma.loginToken.findFirst({
      where: {
        tokenHash,
      },
    });

    if (!loginToken || !isLoginTokenUsable(loginToken, now)) {
      app.log.warn(
        { event: "auth.exchange_link.failed", reason: "invalid_or_expired" },
        "Magic link exchange failed."
      );
      return sendError(reply, 400, "INVALID_LOGIN_TOKEN", "Invalid login token.");
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.loginToken.updateMany({
          where: {
            id: loginToken.id,
            usedAt: null,
          },
          data: {
            usedAt: now,
          },
        });

        if (updated.count !== 1) {
          throw new Error("LOGIN_TOKEN_ALREADY_USED");
        }

        const user = await tx.user.upsert({
          where: {
            email: loginToken.email,
          },
          update: {
            deletedAt: null,
          },
          create: {
            email: loginToken.email,
          },
        });

        const deviceName = parsed.data.deviceName ?? null;
        let device = await tx.device.findFirst({
          where: {
            userId: user.id,
            deviceName,
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        if (device) {
          device = await tx.device.update({
            where: {
              id: device.id,
            },
            data: {
              deviceName,
              deletedAt: null,
              lastSeenAt: now,
            },
          });
        } else {
          device = await tx.device.create({
            data: {
              userId: user.id,
              deviceName,
              lastSeenAt: now,
            },
          });
        }

        const refreshToken = generateOpaqueToken(32);
        const refreshTokenHash = hashToken(refreshToken);
        const refreshTokenId = randomUUID();
        const refreshTokenData = buildRefreshTokenCreateData({
          id: refreshTokenId,
          userId: user.id,
          deviceId: device.id,
          tokenHash: refreshTokenHash,
          now,
          ttlDays: env.authRefreshTtlDays,
        });

        await tx.refreshToken.create({
          data: refreshTokenData,
        });

        return {
          user,
          device,
          refreshToken,
        };
      });

      const accessToken = app.jwt.sign({
        sub: result.user.id,
        deviceId: result.device.id,
      });

      app.log.info(
        {
          event: "auth.exchange_link.success",
          userId: result.user.id,
          deviceId: result.device.id,
        },
        "Magic link exchanged."
      );

      return reply.send({
        accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      const reason =
        error instanceof Error && error.message === "LOGIN_TOKEN_ALREADY_USED"
          ? "already_used"
          : "invalid_or_expired";

      app.log.warn(
        { event: "auth.exchange_link.failed", reason },
        "Magic link exchange failed."
      );

      return sendError(reply, 400, "INVALID_LOGIN_TOKEN", "Invalid login token.");
    }
  });

  app.post("/auth/refresh", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
    }

    const refreshToken = parsed.data.refreshToken;
    const refreshTokenHash = hashToken(refreshToken);
    const now = new Date();

    const existingToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
        deletedAt: null,
      },
    });

    if (!existingToken || !isRefreshTokenActive(existingToken, now)) {
      app.log.warn(
        { event: "auth.refresh.failed", reason: "invalid_or_expired" },
        "Refresh token rejected."
      );
      return sendError(reply, 401, "INVALID_REFRESH_TOKEN", "Invalid refresh token.");
    }

    const newRefreshToken = generateOpaqueToken(32);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const newRefreshTokenId = randomUUID();

    const rotation = buildRefreshRotation({
      current: existingToken,
      newTokenId: newRefreshTokenId,
      newTokenHash: newRefreshTokenHash,
      now,
      ttlDays: env.authRefreshTtlDays,
    });

    await prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: {
          id: existingToken.id,
        },
        data: rotation.revokeUpdate,
      });

      await tx.refreshToken.create({
        data: rotation.newTokenData,
      });

      if (existingToken.deviceId) {
        await tx.device.update({
          where: {
            id: existingToken.deviceId,
          },
          data: {
            lastSeenAt: now,
            deletedAt: null,
          },
        });
      }
    });

    const accessToken = app.jwt.sign({
      sub: existingToken.userId,
      deviceId: existingToken.deviceId,
    });

    app.log.info(
      {
        event: "auth.refresh.rotated",
        userId: existingToken.userId,
        deviceId: existingToken.deviceId,
      },
      "Refresh token rotated."
    );

    return reply.send({
      accessToken,
      refreshToken: newRefreshToken,
    });
  });

  app.post("/auth/logout", async (request, reply) => {
    const parsed = refreshSchema.safeParse(request.body);
    if (!parsed.success) {
      return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
    }

    const refreshToken = parsed.data.refreshToken;
    const refreshTokenHash = hashToken(refreshToken);
    const now = new Date();

    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: refreshTokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        lastUsedAt: now,
      },
    });

    return reply.send({ ok: true });
  });
};
