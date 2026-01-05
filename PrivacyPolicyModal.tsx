import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Modal, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';
import { Asset } from 'expo-asset';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';

const privacyPolicyHtmlModule = require('./docs/privacy-policy.html');
const privacyPolicyHtml = Asset.fromModule(privacyPolicyHtmlModule);

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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);
  const [policyUri, setPolicyUri] = useState<string | null>(null);
  const [isContentReady, setIsContentReady] = useState(false);
  const [isRendered, setIsRendered] = useState(visible);
  const slideAnimation = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    let cancelled = false;
    if (!visible) return undefined;
    setIsContentReady(false);

    (async () => {
      try {
        const [htmlAsset] = await Asset.loadAsync([privacyPolicyHtmlModule]);
        if (cancelled) return;
        setPolicyUri(htmlAsset.localUri || htmlAsset.uri);
      } catch {
        if (cancelled) return;
        setPolicyUri(privacyPolicyHtml.uri);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const injectedTheme = useMemo(() => {
    return `
    (function() {
      try {
        var theme = '${themeMode}';
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.setAttribute('data-embedded', 'true');
        root.style.colorScheme = theme;
        localStorage.setItem('tz:policy-theme', theme);
      } catch (e) {}
    })();
  `;
  }, [themeMode]);

  useEffect(() => {
    if (!visible) return;
    webViewRef.current?.injectJavaScript(injectedTheme);
  }, [injectedTheme, visible]);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 320,
        easing: Easing.inOut(Easing.circle),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 280,
      easing: Easing.inOut(Easing.circle),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
      }
    });
  }, [slideAnimation, visible]);

  if (!isRendered) {
    return null;
  }

  const bottomInset = insets.bottom;
  const topInset = insets.top;
  const slideOffset = windowHeight + bottomInset;
  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [slideOffset, 0],
  });
  const backdropOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={isRendered}
      animationType="none"
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Box flex={1}>
        <Pressable
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          onPress={() => {}}
        >
          <Animated.View
            style={{
              flex: 1,
              backgroundColor: theme.colors.overlay,
              opacity: backdropOpacity,
            }}
          />
        </Pressable>
        <Animated.View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: topInset,
            bottom: -bottomInset,
            backgroundColor: theme.colors.background,
            borderTopLeftRadius: theme.borderRadii.m,
            borderTopRightRadius: theme.borderRadii.m,
            overflow: 'hidden',
            transform: [{ translateY }],
          }}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom']}>
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
                <Button
                  iconOnly
                  accessibilityLabel="Close privacy policy"
                  onPress={onClose}
                  iconOnlySize={36}
                  radius="xl"
                  borderWidth={1}
                  borderColor="borderSubtle"
                  backgroundColor="card"
                  icon={<X color={theme.colors.text} />}
                />
              </Box>

              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={policyUri ? { uri: policyUri } : privacyPolicyHtmlModule}
                style={{ flex: 1, backgroundColor: theme.colors.background }}
                allowFileAccess
                allowFileAccessFromFileURLs
                allowUniversalAccessFromFileURLs
                onLoadEnd={() => {
                  webViewRef.current?.injectJavaScript(injectedTheme);
                  setIsContentReady(true);
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
        </Animated.View>
      </Box>
    </Modal>
  );
}
