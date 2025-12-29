import React from 'react';
import { Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';

import type { AppTheme } from './src/theme/themes';
import { Box, Text } from './src/theme/components';

const privacyPolicyHtml = require('./docs/privacy-policy.html');

type PrivacyPolicyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const theme = useTheme<AppTheme>();

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
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
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
          />
        </Box>
      </SafeAreaView>
    </Modal>
  );
}
