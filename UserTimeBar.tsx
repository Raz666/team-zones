import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';

type UserTimeBarProps = {
  time: Date;
  onChange: () => void;
  onReset: () => void;
};

export function UserTimeBar({ time, onChange, onReset }: UserTimeBarProps) {
  const theme = useTheme<AppTheme>();

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
        <Box marginRight="m">
          <Button label="Reset" variant="ghost" onPress={onReset} />
        </Box>

        <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })} onPress={onChange}>
          <Box flex={1} alignItems="center">
            <Text variant="time" style={{ fontSize: 38 }} color="textSecondary">
              {formatUserTime(time)}
            </Text>
          </Box>
        </Pressable>

        <Box marginRight="m">
          <Button label="Change" variant="primary" onPress={onChange} />
        </Box>
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
