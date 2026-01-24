import { useEffect, useState } from 'react';
import { hydrateRefreshToken, subscribeAuthState } from './session';

type AuthSnapshot = {
  accessToken: string | null;
  refreshToken: string | null;
};

const initialState: AuthSnapshot = {
  accessToken: null,
  refreshToken: null,
};

export const useAuthSession = () => {
  const [state, setState] = useState<AuthSnapshot>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribeAuthState((next) => {
      if (!active) return;
      setState(next);
    });

    hydrateRefreshToken()
      .catch((error) => {
        console.warn('Failed to hydrate auth session', error);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return {
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
    isAuthenticated: Boolean(state.refreshToken),
    hydrated,
  };
};
