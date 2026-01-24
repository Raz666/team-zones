import '../i18n';
import { useEffect, useMemo, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '@shopify/restyle';

import { FlagsProvider } from '../flags';
import type { AppTheme } from '../theme/themes';
import { darkTheme, lightTheme } from '../theme/themes';
import { HomeScreen } from './HomeScreen';
import { useMagicLinkListener } from '../shared/auth/useMagicLinkListener';

const THEME_STORAGE_KEY = 'teamzones:theme:v1';

export default function AppRoot() {
  useMagicLinkListener();
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [themeHydrated, setThemeHydrated] = useState(false);
  const theme: AppTheme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);

  useEffect(() => {
    (async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme === 'dark' || storedTheme === 'light') {
          setMode(storedTheme);
        }
      } catch (err) {
        console.warn('Failed to load saved theme', err);
      } finally {
        setThemeHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!themeHydrated) return;
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((err) => {
      console.warn('Failed to save theme', err);
    });
  }, [mode, themeHydrated]);

  return (
    <SafeAreaProvider>
      <FlagsProvider>
        <ThemeProvider theme={theme}>
          <HomeScreen mode={mode} setMode={setMode} theme={theme} themeHydrated={themeHydrated} />
        </ThemeProvider>
      </FlagsProvider>
    </SafeAreaProvider>
  );
}
