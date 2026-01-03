import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';

import type { AppTheme } from './src/theme/themes';
import { Box, Text } from './src/theme/components';
import { Clock8, History } from 'lucide-react-native';

type UserTimeBarProps = {
  time: Date;
  onChange: () => void;
  onReset: () => void;
};

export function UserTimeBar({ time, onChange, onReset }: UserTimeBarProps) {
  const theme = useTheme<AppTheme>();

  const [resetDisabled, setResetDisabled] = useState(true);
  const handleSet = () => {
    setResetDisabled(false);
    onChange();
  };
  const handleReset = () => {
    setResetDisabled(true);
    onReset();
  };

  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      bottom={0}
      paddingHorizontal="l"
      paddingTop="sPlus"
      paddingBottom="2xl"
      backgroundColor="backgroundAlt"
      borderTopWidth={1}
      borderTopColor="borderSubtle"
      alignItems="center"
    >
      <Box
        paddingHorizontal="sPlus"
        paddingVertical="xs"
        borderRadius="s"
        backgroundColor="card"
        marginBottom="sPlus"
      >
        <Text variant="label" color="accent">
          {formatUserDay(time)}
        </Text>
      </Box>

      <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
        <Pressable
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
          onPress={handleReset}
          disabled={resetDisabled}
        >
          <Box
            paddingVertical="sPlus"
            paddingHorizontal="m"
            borderRadius="l"
            borderWidth={1}
            borderColor="borderSubtle"
            backgroundColor="transparent"
            alignItems="center"
          >
            <Box flexDirection="row" alignItems="center">
              <History size={14} color={resetDisabled ? theme.colors.muted : theme.colors.text} />
              <Box width={theme.spacing.s} />
              <Text variant="buttonLabel" color={resetDisabled ? 'muted' : 'text'}>
                {'Reset'}
              </Text>
            </Box>
          </Box>
        </Pressable>

        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })} onPress={handleSet}>
          <Box flex={1} alignItems="center">
            <Text variant="time" style={{ fontSize: 38 }} color="textSecondary">
              {formatUserTime(time)}
            </Text>
          </Box>
        </Pressable>

        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })} onPress={handleSet}>
          <Box
            marginLeft="lPlus"
            paddingVertical="sPlus"
            paddingHorizontal="m"
            borderRadius="l"
            backgroundColor="primary"
            borderWidth={1}
            borderColor="primary"
            alignItems="center"
          >
            <Box flexDirection="row" alignItems="center">
              <Clock8 size={14} color={theme.colors.textInverse} />
              <Box width={theme.spacing.s} />
              <Text variant="buttonLabel">{'Set'}</Text>
            </Box>
          </Box>
        </Pressable>
      </Box>
    </Box>
  );
}

function formatUserTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatUserDay(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(date);
}
