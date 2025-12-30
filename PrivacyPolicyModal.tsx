import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';
import { Asset } from 'expo-asset';

import type { AppTheme } from './src/theme/themes';
import { Box, Text } from './src/theme/components';

const privacyPolicyHtmlModule = require('./docs/privacy-policy.html');
const privacyPolicyCssModule = require('./docs/styles.css');
const privacyPolicyHtml = Asset.fromModule(privacyPolicyHtmlModule);
const privacyPolicyCss = Asset.fromModule(privacyPolicyCssModule);

type PrivacyPolicyModalProps = {
  visible: boolean;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
};

export function PrivacyPolicyModal({
  visible,
  onClose,
  themeMode = 'light',
}: PrivacyPolicyModalProps) {
  const theme = useTheme<AppTheme>();
  const webViewRef = useRef<WebView>(null);
  const [assetUris, setAssetUris] = useState<{ policyUri: string | null; cssUri: string | null }>({
    policyUri: null,
    cssUri: null,
  });
  const [isContentReady, setIsContentReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!visible) return undefined;
    setIsContentReady(false);

    (async () => {
      try {
        const [htmlAsset, cssAsset] = await Asset.loadAsync([
          privacyPolicyHtmlModule,
          privacyPolicyCssModule,
        ]);
        if (cancelled) return;
        setAssetUris({
          policyUri: htmlAsset.localUri || htmlAsset.uri,
          cssUri: cssAsset.localUri || cssAsset.uri,
        });
      } catch {
        if (cancelled) return;
        setAssetUris({
          policyUri: privacyPolicyHtml.uri,
          cssUri: privacyPolicyCss.uri,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const injectedTheme = useMemo(() => {
    const cssHref = assetUris.cssUri
      ? `var link = document.querySelector("link[rel='stylesheet']"); if (!link) { link = document.createElement('link'); link.rel = 'stylesheet'; document.head.appendChild(link); } if (link) { link.onload = function() { if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) { window.ReactNativeWebView.postMessage('css-ready'); } }; link.href = ${JSON.stringify(
          assetUris.cssUri,
        )}; }`
      : '';
    return `
    (function() {
      try {
        var theme = '${themeMode}';
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;
        localStorage.setItem('tz:policy-theme', theme);
        ${cssHref}
      } catch (e) {}
    })();
  `;
  }, [assetUris.cssUri, themeMode]);

  useEffect(() => {
    if (!assetUris.cssUri || !visible) return;
    webViewRef.current?.injectJavaScript(injectedTheme);
  }, [assetUris.cssUri, injectedTheme, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Box flex={1} backgroundColor="background">
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            paddingHorizontal="l"
            paddingVertical="m"
            borderBottomWidth={1}
            borderBottomColor="borderSubtle"
            backgroundColor="background"
          >
            <Text variant="heading2" color="textSecondary">
              Privacy Policy
            </Text>
            <Pressable onPress={onClose} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
              <Box
                width={36}
                height={36}
                borderRadius="xl"
                borderWidth={1}
                borderColor="borderSubtle"
                alignItems="center"
                justifyContent="center"
                backgroundColor="card"
              >
                <X color={theme.colors.text} />
              </Box>
            </Pressable>
          </Box>

          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={assetUris.policyUri ? { uri: assetUris.policyUri } : privacyPolicyHtmlModule}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            onLoadEnd={() => {
              if (assetUris.cssUri) {
                webViewRef.current?.injectJavaScript(injectedTheme);
              }
            }}
            onMessage={(event) => {
              if (event.nativeEvent.data === 'css-ready') {
                setIsContentReady(true);
              }
            }}
            injectedJavaScriptBeforeContentLoaded={injectedTheme}
          />
          {!isContentReady ? (
            <Box
              position="absolute"
              top={0}
              right={0}
              bottom={0}
              left={0}
              alignItems="center"
              justifyContent="center"
              backgroundColor="background"
            >
              <ActivityIndicator color={theme.colors.text} />
            </Box>
          ) : null}
        </Box>
      </SafeAreaView>
    </Modal>
  );
}
