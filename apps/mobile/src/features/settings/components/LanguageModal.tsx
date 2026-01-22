import { useMemo } from 'react';
import { Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { AppTheme } from '../../../theme/themes';
import { Box, Text } from '../../../theme/components';
import { setStoredLanguageOverride } from '../../../i18n/detectLanguage';
import {
  LANGUAGE_OPTIONS,
  normalizeLanguageValue,
  resolveLanguageValue,
} from '../utils/languageOptions';

type LanguageModalProps = {
  onClose: () => void;
};

export function LanguageModal({ onClose }: LanguageModalProps) {
  const { t, i18n } = useTranslation('app');
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const rawLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0].toLowerCase();
  const selectedLanguage = resolveLanguageValue(rawLanguage);

  const overlayStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: -topInset,
      left: 0,
      right: 0,
      bottom: -bottomInset,
      zIndex: 4,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingTop: topInset,
      paddingBottom: bottomInset,
    }),
    [bottomInset, topInset],
  );

  const handleLanguageSelect = (language: string) => {
    onClose();
    if (language !== selectedLanguage) {
      i18n.changeLanguage(language).catch((error) => {
        console.warn('Failed to change language', error);
      });
    }
    setStoredLanguageOverride(normalizeLanguageValue(language));
  };

  return (
    <Pressable onPress={onClose} style={overlayStyle}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.overlay,
          opacity: 1,
        }}
      />
      <Pressable onPress={() => {}} style={{ minWidth: 250, alignSelf: 'center' }}>
        <Box
          marginHorizontal="l"
          backgroundColor="card"
          borderRadius="l"
          borderWidth={1}
          borderColor="borderSubtle"
          padding="l"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 10,
          }}
        >
          <Text variant="heading2" color="text">
            {t('menu.language')}
          </Text>
          <Box marginTop="m">
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = option.value === selectedLanguage;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleLanguageSelect(option.value)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    paddingVertical="m"
                    backgroundColor="card"
                  >
                    <Box flexDirection="row" alignItems="center">
                      <Text variant="body" color="textSecondary" marginEnd="m">
                        {option.flag}
                      </Text>
                      <Text variant="body" color="textSecondary" numberOfLines={1}>
                        {option.label}
                      </Text>
                    </Box>
                    {isSelected ? (
                      <Box
                        width={24}
                        height={24}
                        borderRadius="full"
                        alignItems="center"
                        justifyContent="center"
                        backgroundColor="primary"
                        marginStart="xl"
                      >
                        <Check size={14} color={theme.colors.textInverse} />
                      </Box>
                    ) : null}
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </Box>
      </Pressable>
    </Pressable>
  );
}
