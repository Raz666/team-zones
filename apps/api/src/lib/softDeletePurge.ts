import { FastifyInstance } from "fastify";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

const HOURS_TO_MS = 60 * 60 * 1000;
const DAYS_TO_MS = 24 * HOURS_TO_MS;

type PurgeCounts = {
  settingsSnapshots: number;
  refreshTokens: number;
  purchaseTokens: number;
  entitlements: number;
  devices: number;
  users: number;
};

const purgeSoftDeletedRows = async (cutoff: Date): Promise<PurgeCounts> => {
  const settingsSnapshots = await prisma.settingsSnapshot.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  const refreshTokens = await prisma.refreshToken.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  const purchaseTokens = await prisma.purchaseToken.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  const entitlements = await prisma.entitlement.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  const devices = await prisma.device.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  const users = await prisma.user.deleteMany({
    where: {
      deletedAt: {
        lt: cutoff,
      },
    },
  });

  return {
    settingsSnapshots: settingsSnapshots.count,
    refreshTokens: refreshTokens.count,
    purchaseTokens: purchaseTokens.count,
    entitlements: entitlements.count,
    devices: devices.count,
    users: users.count,
  };
};

export const startSoftDeletePurge = (app: FastifyInstance): void => {
  if (!env.softDeletePurgeEnabled) {
    return;
  }

  const intervalMs = env.softDeletePurgeIntervalHours * HOURS_TO_MS;
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    app.log.warn("Soft delete purge disabled due to invalid interval.");
    return;
  }

  let running = false;

  const runOnce = async () => {
    if (running) {
      app.log.warn(
        {
          event: "soft_delete_purge_skipped",
          reason: "already_running",
        },
        "Soft delete purge skipped."
      );
      return;
    }

    running = true;
    try {
      const cutoff = new Date(
        Date.now() - env.softDeletePurgeAfterDays * DAYS_TO_MS
      );
      const counts = await purgeSoftDeletedRows(cutoff);
      app.log.info(
        {
          event: "soft_delete_purge_completed",
          ...counts,
        },
        "Soft delete purge completed."
      );
    } catch (error) {
      app.log.error({ err: error }, "Soft delete purge failed.");
    } finally {
      running = false;
    }
  };

  void runOnce();
  const timer = setInterval(() => {
    void runOnce();
  }, intervalMs);
  timer.unref?.();

  app.addHook("onClose", async () => {
    clearInterval(timer);
  });
};
