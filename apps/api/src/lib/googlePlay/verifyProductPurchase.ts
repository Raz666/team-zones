import { promises as fs } from "fs";
import { google } from "googleapis";
import { env } from "../../config/env";

const ANDROID_PUBLISHER_SCOPE =
  "https://www.googleapis.com/auth/androidpublisher";

type ServiceAccount = {
  client_email: string;
  private_key: string;
};

let cachedClient:
  | ReturnType<typeof google.androidpublisher>
  | null = null;

const loadServiceAccount = async (): Promise<ServiceAccount> => {
  if (env.googleServiceAccountJson) {
    try {
      return JSON.parse(env.googleServiceAccountJson) as ServiceAccount;
    } catch (_error) {
      throw new Error("INVALID_GOOGLE_SERVICE_ACCOUNT");
    }
  }

  if (env.googleServiceAccountJsonPath) {
    const raw = await fs.readFile(env.googleServiceAccountJsonPath, "utf8");
    try {
      return JSON.parse(raw) as ServiceAccount;
    } catch (_error) {
      throw new Error("INVALID_GOOGLE_SERVICE_ACCOUNT");
    }
  }

  throw new Error("MISSING_GOOGLE_SERVICE_ACCOUNT");
};

const getAndroidPublisherClient = async () => {
  if (cachedClient) {
    return cachedClient;
  }

  const credentials = await loadServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
  const authClient = await auth.getClient();

  cachedClient = google.androidpublisher({
    version: "v3",
    auth: authClient,
  });

  return cachedClient;
};

export type VerifiedPurchase = {
  orderId: string | null;
  purchaseTime: Date | null;
  rawResponse: string;
};

export const verifyProductPurchase = async (params: {
  productId: string;
  purchaseToken: string;
}): Promise<VerifiedPurchase> => {
  const client = await getAndroidPublisherClient();

  const response = await client.purchases.products.get({
    packageName: env.googlePlayPackageName,
    productId: params.productId,
    token: params.purchaseToken,
  });

  const data = response.data ?? {};
  const purchaseState = data.purchaseState ?? 0;

  if (purchaseState !== 0) {
    throw new Error("PURCHASE_NOT_ACTIVE");
  }

  const purchaseTimeMillis = data.purchaseTimeMillis
    ? Number(data.purchaseTimeMillis)
    : null;

  return {
    orderId: data.orderId ?? null,
    purchaseTime:
      purchaseTimeMillis && !Number.isNaN(purchaseTimeMillis)
        ? new Date(purchaseTimeMillis)
        : null,
    rawResponse: JSON.stringify(data),
  };
};
