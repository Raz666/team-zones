import React from 'react';
import { Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';
import { Asset } from 'expo-asset';

import type { AppTheme } from './src/theme/themes';
import { Box, Text } from './src/theme/components';

const privacyPolicyHtml = require('./docs/privacy-policy.html');
const privacyPolicyCss = Asset.fromModule(require('./docs/styles.css')).uri;

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
  const injectedTheme = `
    (function() {
      try {
        var theme = '${themeMode}';
        var root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.style.colorScheme = theme;
        localStorage.setItem('tz:policy-theme', theme);
        var link = document.querySelector("link[rel='stylesheet']");
        if (link) { link.href = '${privacyPolicyCss}'; }
      } catch (e) {}
    })();
  `;

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
            originWhitelist={['*']}
            source={privacyPolicyHtml}
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            startInLoadingState
            injectedJavaScriptBeforeContentLoaded={injectedTheme}
          />
        </Box>
      </SafeAreaView>
    </Modal>
  );
}
