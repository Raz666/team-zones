import { FastifyInstance } from "fastify";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendError } from "../lib/httpErrors";
import {
  isPurchaseTokenClaimedByOtherUser,
  verifyAllowlistedPurchase,
} from "../lib/googlePlay/logic";
import {
  VerifiedPurchase,
  verifyProductPurchase,
} from "../lib/googlePlay/verifyProductPurchase";

const verifySchema = z.object({
  productId: z.string().trim().min(1),
  purchaseToken: z.string().trim().min(1),
});

const premiumEntitlement = {
  key: "premium",
  status: "active",
  source: "google_play",
} as const;

type PurchaseInsertResult = {
  entitlements: ["premium"];
  entitlementStatus: "active";
};

const upsertEntitlement = async (params: {
  tx: Prisma.TransactionClient;
  userId: string;
}): Promise<void> => {
  const existing = await params.tx.entitlement.findFirst({
    where: {
      userId: params.userId,
      key: premiumEntitlement.key,
    },
  });

  if (existing) {
    await params.tx.entitlement.update({
      where: {
        id: existing.id,
      },
      data: {
        status: premiumEntitlement.status,
        source: premiumEntitlement.source,
        revokedAt: null,
        deletedAt: null,
      },
    });
  } else {
    await params.tx.entitlement.create({
      data: {
        userId: params.userId,
        key: premiumEntitlement.key,
        status: premiumEntitlement.status,
        source: premiumEntitlement.source,
      },
    });
  }
};

const insertPurchaseToken = async (params: {
  tx: Prisma.TransactionClient;
  userId: string;
  productId: string;
  purchaseToken: string;
  verified: VerifiedPurchase;
}): Promise<void> => {
  await params.tx.purchaseToken.create({
    data: {
      userId: params.userId,
      productId: params.productId,
      purchaseToken: params.purchaseToken,
      orderId: params.verified.orderId,
      purchaseTime: params.verified.purchaseTime,
      rawResponse: params.verified.rawResponse,
    },
  });
};

export const registerIapRoutes = (app: FastifyInstance): void => {
  app.post(
    "/iap/google/verify",
    {
      preHandler: app.authenticate,
    },
    async (request, reply) => {
      if (!request.auth?.userId) {
        return sendError(reply, 401, "UNAUTHORIZED", "Invalid or expired token.");
      }

      const parsed = verifySchema.safeParse(request.body);
      if (!parsed.success) {
        return sendError(reply, 400, "BAD_REQUEST", "Invalid request.");
      }

      const { productId, purchaseToken } = parsed.data;

      let verified: VerifiedPurchase;
      try {
        verified = await verifyAllowlistedPurchase({
          allowlist: env.googlePlayProductIdsAllowlist,
          productId,
          purchaseToken,
          verifyPurchase: verifyProductPurchase,
        });
      } catch (error) {
        if (error instanceof Error && error.message === "PRODUCT_NOT_ALLOWED") {
          return sendError(reply, 400, "PRODUCT_NOT_ALLOWED", "Invalid product.");
        }

        if (error instanceof Error && error.message === "PURCHASE_NOT_ACTIVE") {
          return sendError(
            reply,
            400,
            "PURCHASE_NOT_ACTIVE",
            "Purchase is not active."
          );
        }

        if (error instanceof Error && error.message === "INVALID_GOOGLE_SERVICE_ACCOUNT") {
          app.log.error("Invalid Google service account configuration.");
          return sendError(reply, 500, "SERVER_ERROR", "Server configuration error.");
        }

        if (error instanceof Error && error.message === "MISSING_GOOGLE_SERVICE_ACCOUNT") {
          app.log.error("Missing Google service account configuration.");
          return sendError(reply, 500, "SERVER_ERROR", "Server configuration error.");
        }

        app.log.error("Google Play verification failed");
        return sendError(reply, 502, "GOOGLE_PLAY_ERROR", "Verification failed.");
      }

      const userId = request.auth.userId;

      try {
        await prisma.$transaction(async (tx) => {
          const existing = await tx.purchaseToken.findUnique({
            where: {
              purchaseToken,
            },
            select: {
              userId: true,
            },
          });

          if (existing && isPurchaseTokenClaimedByOtherUser(existing.userId, userId)) {
            throw new Error("PURCHASE_TOKEN_ALREADY_CLAIMED");
          }

          if (!existing) {
            try {
              await insertPurchaseToken({
                tx,
                userId,
                productId,
                purchaseToken,
                verified,
              });
            } catch (error) {
              if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === "P2002"
              ) {
                const existingAfter = await tx.purchaseToken.findUnique({
                  where: {
                    purchaseToken,
                  },
                  select: {
                    userId: true,
                  },
                });

                if (
                  existingAfter &&
                  isPurchaseTokenClaimedByOtherUser(existingAfter.userId, userId)
                ) {
                  throw new Error("PURCHASE_TOKEN_ALREADY_CLAIMED");
                }
              } else {
                throw error;
              }
            }
          }

          await upsertEntitlement({ tx, userId });
        });
      } catch (error) {
        if (error instanceof Error && error.message === "PURCHASE_TOKEN_ALREADY_CLAIMED") {
          return sendError(
            reply,
            409,
            "PURCHASE_TOKEN_ALREADY_CLAIMED",
            "Purchase token already claimed."
          );
        }

        app.log.error({ err: error }, "Failed to record purchase");
        return sendError(reply, 500, "SERVER_ERROR", "Server error.");
      }

      return reply.send({
        entitlements: [premiumEntitlement.key],
        entitlementStatus: premiumEntitlement.status,
      } satisfies PurchaseInsertResult);
    }
  );
};
