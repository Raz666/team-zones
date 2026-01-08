import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';
import { Clock8, History, Pause, Play } from 'lucide-react-native';
import { getIntlLocale } from './src/i18n/intlLocale';
import { isSupportedLanguage } from './src/i18n/supportedLanguages';

type UserTimeBarProps = {
  time: Date;
  onChange: () => void;
  onReset: () => void;
};

export function UserTimeBar({ time, onChange, onReset }: UserTimeBarProps) {
  const { t, i18n } = useTranslation('timeBar');
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const barPaddingBottom = theme.spacing.xl + bottomInset;
  const rawLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0].toLowerCase();
  const intlLocale = getIntlLocale(isSupportedLanguage(rawLanguage) ? rawLanguage : 'en');

  const [resetDisabled, setResetDisabled] = useState(true);
  const isFrozen = !resetDisabled;
  const borderOpacity = useRef(new Animated.Value(isFrozen ? 1 : 0)).current;
  const badgeOpacity = useRef(new Animated.Value(isFrozen ? 1 : 0)).current;
  const pauseOpacity = useRef(new Animated.Value(isFrozen ? 1 : 0)).current;
  const playOpacity = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(isFrozen ? 0.1 : 0)).current;
  const handleSet = () => {
    setResetDisabled(false);
    onChange();
  };
  const handleReset = () => {
    setResetDisabled(true);
    onReset();
  };

  useEffect(() => {
    if (isFrozen) {
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(pauseOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(playOpacity, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0.1,
          duration: 180,
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(pauseOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(playOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(borderOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(playOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(shadowOpacity, {
          toValue: 0,
          duration: 90,
          useNativeDriver: false,
        }),
      ]),
    ]).start();
  }, [badgeOpacity, borderOpacity, isFrozen, pauseOpacity, playOpacity, shadowOpacity]);

  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      paddingHorizontal="l"
      paddingTop="sPlus"
      backgroundColor="backgroundAlt"
      borderTopWidth={1}
      borderTopColor="borderSubtle"
      alignItems="center"
      style={{ paddingBottom: barPaddingBottom, bottom: -bottomInset }}
    >
      <Box
        paddingHorizontal="sPlus"
        paddingVertical="xs"
        borderRadius="s"
        backgroundColor="badgeToday"
        marginBottom="sPlus"
      >
        <Text variant="label" color="textInverse">
          {formatUserDay(time, intlLocale)}
        </Text>
      </Box>

      <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
        <Button
          label={t('reset')}
          variant="ghost"
          onPress={handleReset}
          disabled={resetDisabled}
          disabledOpacity={1}
          size="sm"
          labelColor={resetDisabled ? 'muted' : 'text'}
          icon={
            <History size={14} color={resetDisabled ? theme.colors.muted : theme.colors.text} />
          }
        />

        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })} onPress={handleSet}>
          <Box
            flex={1}
            alignItems="center"
            style={{
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: 'transparent',
              borderRadius: theme.borderRadii.m,
              paddingHorizontal: theme.spacing.m,
              position: 'relative',
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: theme.colors.cardBorderActive,
                borderRadius: theme.borderRadii.m,
                opacity: borderOpacity,
              }}
            />
            <Text variant="time" style={{ fontSize: 38 }} color="textSecondary">
              {formatUserTime(time, intlLocale)}
            </Text>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -10,
                left: -10,
                opacity: badgeOpacity,
              }}
            >
              <Animated.View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: theme.borderRadii.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.card,
                  borderWidth: 1,
                  borderColor: theme.colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity,
                  shadowRadius: 4,
                  elevation: isFrozen ? 3 : 0,
                }}
              >
                <Animated.View style={{ opacity: pauseOpacity, position: 'absolute' }}>
                  <Pause size={12} color={theme.colors.textSecondary} />
                </Animated.View>
                <Animated.View style={{ opacity: playOpacity }}>
                  <Play size={12} color={theme.colors.textSecondary} />
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Box>
        </Pressable>

        <Button
          label={t('set')}
          onPress={handleSet}
          variant="primary"
          size="sm"
          borderWidth={1}
          borderColor="primary"
          icon={<Clock8 size={14} color={theme.colors.textInverse} />}
          containerStyle={{ marginLeft: theme.spacing.lPlus }}
        />
      </Box>
    </Box>
  );
}

function formatUserTime(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatUserDay(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
  }).format(date);
}
