import { apiRequest } from '../api/client';
import { setEntitlementCertificate } from '../auth/session';

export type EntitlementCertificateResponse = {
  entitlements: string[];
  certificate: string;
  offlineValidUntil: string;
};

export const fetchEntitlementCertificate = async (): Promise<EntitlementCertificateResponse | null> => {
  let response;
  try {
    response = await apiRequest<EntitlementCertificateResponse>({
      path: '/entitlements/certificate',
      method: 'POST',
    });
  } catch (error) {
    console.warn('Failed to fetch entitlement certificate', error);
    return null;
  }

  if (!response.ok || !response.data) {
    return null;
  }

  await setEntitlementCertificate({
    certificate: response.data.certificate,
    entitlements: response.data.entitlements,
    offlineValidUntil: response.data.offlineValidUntil,
  });

  return response.data;
};
