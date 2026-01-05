import 'intl-pluralrules';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import { detectLanguage, getDeviceLanguage, getStoredLanguageOverride } from './detectLanguage';
import { defaultLanguage, supportedLanguages } from './supportedLanguages';

import enApp from './locales/en/app.json';
import enAddZone from './locales/en/addZone.json';
import enPrivacy from './locales/en/privacy.json';
import enTimeBar from './locales/en/timeBar.json';
import enAssets from './locales/en/assets.json';

import plApp from './locales/pl/app.json';
import plAddZone from './locales/pl/addZone.json';
import plPrivacy from './locales/pl/privacy.json';
import plTimeBar from './locales/pl/timeBar.json';
import plAssets from './locales/pl/assets.json';

import jaApp from './locales/ja/app.json';
import jaAddZone from './locales/ja/addZone.json';
import jaPrivacy from './locales/ja/privacy.json';
import jaTimeBar from './locales/ja/timeBar.json';
import jaAssets from './locales/ja/assets.json';

const namespaces = ['app', 'addZone', 'privacy', 'timeBar', 'assets'] as const;

const resources = {
  en: {
    app: enApp,
    addZone: enAddZone,
    privacy: enPrivacy,
    timeBar: enTimeBar,
    assets: enAssets,
  },
  pl: {
    app: plApp,
    addZone: plAddZone,
    privacy: plPrivacy,
    timeBar: plTimeBar,
    assets: plAssets,
  },
  ja: {
    app: jaApp,
    addZone: jaAddZone,
    privacy: jaPrivacy,
    timeBar: jaTimeBar,
    assets: jaAssets,
  },
} as const;

let initPromise: Promise<void> | null = null;
let localeSubscription: { remove?: () => void } | null = null;

type LocaleListener = () => void;

type LocaleSubscription = { remove?: () => void } | void;

function attachLocaleListener() {
  if (localeSubscription) {
    return;
  }

  const addLocaleListener = (
    Localization as { addLocaleListener?: (listener: LocaleListener) => LocaleSubscription }
  ).addLocaleListener;

  if (!addLocaleListener) {
    return;
  }

  const subscription = addLocaleListener(() => {
    void (async () => {
      const override = await getStoredLanguageOverride();
      if (override) {
        return;
      }
      const deviceLanguage = getDeviceLanguage();
      if (deviceLanguage !== i18n.language) {
        i18n.changeLanguage(deviceLanguage).catch((error) => {
          console.warn('Failed to update language from device locale', error);
        });
      }
    })();
  });

  localeSubscription =
    subscription && typeof subscription.remove === 'function' ? subscription : {};
}

export function initI18n(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const language = await detectLanguage();
    await i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: defaultLanguage,
      supportedLngs: [...supportedLanguages],
      ns: [...namespaces],
      defaultNS: 'app',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    attachLocaleListener();
  })();

  return initPromise;
}

void initI18n();

export { i18n, namespaces, resources };
