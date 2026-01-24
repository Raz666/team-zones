import { useEffect, useMemo, useState } from 'react';
import {
  getEntitlementCertificate,
} from '../auth/session';
import { useAuthSession } from '../auth/useAuthSession';
import { fetchEntitlementCertificate } from './service';

type EntitlementState = {
  entitlements: string[];
  isPremium: boolean;
  offlineValidUntil: string | null;
  certificate: string | null;
  hydrated: boolean;
};

const DEFAULT_STATE: EntitlementState = {
  entitlements: [],
  isPremium: false,
  offlineValidUntil: null,
  certificate: null,
  hydrated: false,
};

const REFRESH_THRESHOLD_MS = 24 * 60 * 60 * 1000;

const isNearExpiry = (offlineValidUntil: string | null): boolean => {
  if (!offlineValidUntil) return true;
  const expiresAt = Date.parse(offlineValidUntil);
  if (Number.isNaN(expiresAt)) return true;
  return expiresAt - Date.now() <= REFRESH_THRESHOLD_MS;
};

export const useEntitlements = () => {
  const { isAuthenticated } = useAuthSession();
  const [state, setState] = useState<EntitlementState>(DEFAULT_STATE);

  const refreshCertificate = async (): Promise<void> => {
    if (!isAuthenticated) {
      return;
    }

    const data = await fetchEntitlementCertificate();
    if (!data) {
      return;
    }

    setState({
      entitlements: data.entitlements,
      isPremium: data.entitlements.includes('premium'),
      offlineValidUntil: data.offlineValidUntil,
      certificate: data.certificate,
      hydrated: true,
    });
  };

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const stored = await getEntitlementCertificate();
      if (!active) return;

      if (!stored) {
        setState({ ...DEFAULT_STATE, hydrated: true });
        return;
      }

      setState({
        entitlements: stored.entitlements,
        isPremium: stored.entitlements.includes('premium'),
        offlineValidUntil: stored.offlineValidUntil,
        certificate: stored.certificate,
        hydrated: true,
      });
    };

    hydrate().catch((error) => {
      console.warn('Failed to hydrate entitlements', error);
      setState({ ...DEFAULT_STATE, hydrated: true });
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (!isAuthenticated) return;
    if (!isNearExpiry(state.offlineValidUntil)) return;

    refreshCertificate().catch((error) => {
      console.warn('Failed to refresh entitlements', error);
    });
  }, [isAuthenticated, state.hydrated, state.offlineValidUntil]);

  return useMemo(
    () => ({
      entitlements: state.entitlements,
      isPremium: state.isPremium,
      offlineValidUntil: state.offlineValidUntil,
      certificate: state.certificate,
      hydrated: state.hydrated,
      refreshCertificate,
    }),
    [
      state.entitlements,
      state.isPremium,
      state.offlineValidUntil,
      state.certificate,
      state.hydrated,
      refreshCertificate,
    ]
  );
};
