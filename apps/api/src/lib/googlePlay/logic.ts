export const isProductAllowed = (
  allowlist: string[],
  productId: string
): boolean => {
  return allowlist.includes(productId);
};

export type PurchaseVerifier<T> = (params: {
  productId: string;
  purchaseToken: string;
}) => Promise<T>;

export const verifyAllowlistedPurchase = async <T>(params: {
  allowlist: string[];
  productId: string;
  purchaseToken: string;
  verifyPurchase: PurchaseVerifier<T>;
}): Promise<T> => {
  if (!isProductAllowed(params.allowlist, params.productId)) {
    throw new Error("PRODUCT_NOT_ALLOWED");
  }

  return params.verifyPurchase({
    productId: params.productId,
    purchaseToken: params.purchaseToken,
  });
};

export const isPurchaseTokenClaimedByOtherUser = (
  existingUserId: string | null,
  currentUserId: string
): boolean => {
  return existingUserId !== null && existingUserId !== currentUserId;
};
