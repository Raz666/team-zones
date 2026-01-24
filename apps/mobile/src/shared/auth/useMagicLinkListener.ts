import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { exchangeMagicLink } from './api';
import { extractMagicLinkToken } from './deeplink';

export const useMagicLinkListener = (): void => {
  const consumedTokens = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const handleUrl = async (url: string) => {
      const token = extractMagicLinkToken(url);
      if (!token || consumedTokens.current.has(token)) {
        return;
      }

      consumedTokens.current.add(token);
      const success = await exchangeMagicLink(token);
      if (!success) {
        console.warn('Magic link exchange failed');
      }
    };

    Linking.getInitialURL()
      .then((url) => {
        if (!active || !url) return;
        void handleUrl(url);
      })
      .catch((error) => {
        console.warn('Failed to read initial URL', error);
      });

    const subscription = Linking.addEventListener('url', (event) => {
      void handleUrl(event.url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
};
