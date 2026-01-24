import { apiRequest } from '../api/client';
import { fetchEntitlementCertificate } from '../entitlements/service';

type VerifyResponse = {
  entitlements: string[];
  entitlementStatus: 'active';
};

export const verifyGooglePlayPurchase = async (params: {
  productId: string;
  purchaseToken: string;
}): Promise<VerifyResponse | null> => {
  let response;
  try {
    response = await apiRequest<VerifyResponse>({
      path: '/iap/google/verify',
      method: 'POST',
      body: {
        productId: params.productId,
        purchaseToken: params.purchaseToken,
      },
    });
  } catch (error) {
    console.warn('Failed to verify purchase', error);
    return null;
  }

  if (!response.ok || !response.data) {
    return null;
  }

  await fetchEntitlementCertificate();
  return response.data;
};
