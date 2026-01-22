import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { Trash2, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { AppTheme } from '../../../theme/themes';
import { Box, Button, Text } from '../../../theme/components';
import type { Zone } from '../storage/zonesRepository';

type DeleteZoneModalProps = {
  pendingIndex: number | null;
  zones: Zone[];
  onConfirm: (index: number) => void;
  onCancel: () => void;
};

export function DeleteZoneModal({
  pendingIndex,
  zones,
  onConfirm,
  onCancel,
}: DeleteZoneModalProps) {
  const { t } = useTranslation('app');
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isRendered, setIsRendered] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (pendingIndex !== null) {
      setActiveIndex(pendingIndex);
      setIsRendered(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.circle),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(animation, {
      toValue: 0,
      duration: 260,
      easing: Easing.inOut(Easing.circle),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
        setActiveIndex(null);
      }
    });
  }, [animation, pendingIndex]);

  if (!isRendered) {
    return null;
  }

  const deleteModalOffset = Dimensions.get('window').height;
  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const deleteModalTranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [deleteModalOffset, 0],
  });
  const label = zones[activeIndex ?? -1]?.label ?? t('delete.fallback');

  return (
    <Pressable
      onPress={onCancel}
      style={{
        position: 'absolute',
        top: -topInset,
        left: 0,
        right: 0,
        bottom: -bottomInset,
        zIndex: 4,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: topInset,
        paddingBottom: bottomInset,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.overlay,
          opacity: backdropOpacity,
        }}
      />
      <Animated.View
        style={{
          width: '100%',
          transform: [{ translateY: deleteModalTranslateY }],
        }}
      >
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1, width: '100%' })}
        >
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
              {t('delete.title')}
            </Text>
            <Box marginTop="xsPlus">
              <Text variant="body" color="textSecondary" marginVertical="l">
                {t('delete.body', { label })}
              </Text>
            </Box>
            <Box marginTop="m" flexDirection="row" justifyContent="flex-end">
              <Box marginRight="m">
                <Button
                  label={t('delete.cancel')}
                  variant="ghost"
                  size="sm"
                  onPress={onCancel}
                  icon={<X size={14} color={theme.colors.text} />}
                />
              </Box>
              <Button
                label={t('delete.confirm')}
                size="sm"
                onPress={() => {
                  if (activeIndex !== null) {
                    onConfirm(activeIndex);
                    onCancel();
                  }
                }}
                backgroundColor="danger"
                borderColor="danger"
                icon={<Trash2 size={14} color={theme.colors.textInverse} />}
              />
            </Box>
          </Box>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}
