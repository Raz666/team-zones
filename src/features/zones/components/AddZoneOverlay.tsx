import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  Pressable,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { AlertTriangle, ArrowUp, Check, Plus, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AppTheme } from '../../../theme/themes';
import { Box, Button, Text } from '../../../theme/components';
import { formatTimeInZone, formatUtcOffsetLabel } from '../utils/timeZoneDisplay';
import type { TimeZoneOption } from '../utils/timeZoneDisplay';
import type { Zone } from '../storage/zonesRepository';
import { useAddZoneForm } from '../hooks/useAddZoneForm';
import { useTimeZoneSearch } from '../hooks/useTimeZoneSearch';

export type ZoneDraft = Zone;

const AnimatedBox = Animated.createAnimatedComponent(Box);

type AddZoneOverlayProps = {
  visible: boolean;
  usedTimeZones: string[];
  mode?: 'add' | 'edit';
  initialValue?: ZoneDraft;
  existingZones?: ZoneDraft[];
  onSelectExisting?: (index: number) => void;
  onReturnToAdd?: () => void;
  startedInEdit?: boolean;
  onSubmit: (zone: ZoneDraft) => void;
  onSubmitAtStart?: (zone: ZoneDraft) => void;
  onClose: () => void;
};

export function AddZoneOverlay({
  visible,
  usedTimeZones,
  mode,
  initialValue,
  existingZones = [],
  onSelectExisting,
  onReturnToAdd,
  startedInEdit = false,
  onSubmit,
  onSubmitAtStart,
  onClose,
}: AddZoneOverlayProps) {
  const { t, i18n } = useTranslation('addZone');
  const theme = useTheme<AppTheme>();
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const topInset = insets.top;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [isRendered, setIsRendered] = useState(visible);
  const slideAnimation = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const [overlayLayout, setOverlayLayout] = useState({ width: 0, height: 0 });
  const searchInputRef = useRef<TextInput>(null);
  const searchAnchorRef = useRef<View>(null);
  const overlayRef = useRef<View>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const {
    search,
    setSearch,
    isSearchFocused,
    setIsSearchFocused,
    allTimeZoneOptions,
    availableOptions,
    now,
    findExistingMatch,
    isOptionUsed,
    getCityLabel,
    getLocationLine,
    getOptionLabelKeys,
  } = useTimeZoneSearch({ existingZones, usedTimeZones, language: i18n.language });

  const {
    label,
    membersInput,
    error,
    labelWasCleared,
    isEdit,
    labelLimit,
    membersLimit,
    labelLength,
    membersLength,
    isLabelTooLong,
    isMembersTooLong,
    handleSearchFocus,
    handleSearchChange,
    handleClearSearch,
    handleLabelChange,
    handleMembersChange,
    handleFieldFocus,
    handleSubmit,
    handleCancel,
    handleSelectTz,
    closeSearchList,
  } = useAddZoneForm({
    visible,
    mode,
    initialValue,
    startedInEdit,
    onSubmit,
    onSubmitAtStart,
    onClose,
    onSelectExisting,
    onReturnToAdd,
    allTimeZoneOptions,
    language: i18n.language,
    setSearch,
    setIsSearchFocused,
    searchInputRef,
    findExistingMatch,
    getOptionLabelKeys,
    getCityLabel,
    t,
  });

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 220,
        easing: Easing.inOut(Easing.circle),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 180,
      easing: Easing.inOut(Easing.circle),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsRendered(false);
      }
    });
  }, [slideAnimation, visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => subscription.remove();
  }, [handleCancel, visible]);

  const headingText = isEdit ? t('heading.edit') : t('heading.add');
  const submitLabel = isEdit ? t('buttons.save') : t('buttons.add');

  const inputStyle = {
    backgroundColor: theme.colors.card,
    color: theme.colors.textSecondary,
    borderRadius: theme.borderRadii.s,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.sPlus,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    fontSize: 14,
  };

  const dropdownRowHeight = 56;
  const dropdownMaxHeight = Math.floor(windowHeight * 0.4);
  const dropdownCount = availableOptions.length;
  const dropdownHeight = Math.min(
    Math.max(dropdownCount, 1) * dropdownRowHeight,
    dropdownMaxHeight,
  );

  const updateDropdownAnchor = () => {
    const overlayNode = overlayRef.current;
    const anchorNode = searchAnchorRef.current;
    if (!overlayNode || !anchorNode) return;
    anchorNode.measureLayout(
      overlayNode,
      (x, y, width, height) => {
        setDropdownAnchor({
          x,
          y,
          width,
          height,
        });
      },
      () => {},
    );
  };

  if (!isRendered) {
    return null;
  }

  const slideOffset = windowHeight + topInset;
  const overlayTranslateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-slideOffset, 0],
  });
  const backdropOpacity = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const overlayWidth = overlayLayout.width || windowWidth;
  const overlayHeight = overlayLayout.height || windowHeight;
  const closeAreaStyles: { key: string; style: object }[] = [];

  if (isSearchFocused && dropdownAnchor && overlayWidth > 0 && overlayHeight > 0) {
    const dropdownTop = dropdownAnchor.y + dropdownAnchor.height;
    const dropdownBottom = Math.min(dropdownTop + dropdownHeight, overlayHeight);
    const middleHeight = Math.max(0, dropdownBottom - dropdownAnchor.y);
    const rightEdge = dropdownAnchor.x + dropdownAnchor.width;
    const rightWidth = Math.max(0, overlayWidth - rightEdge);

    if (dropdownAnchor.y > 0) {
      closeAreaStyles.push({
        key: 'top',
        style: { position: 'absolute', top: 0, left: 0, right: 0, height: dropdownAnchor.y },
      });
    }

    if (dropdownAnchor.x > 0 && middleHeight > 0) {
      closeAreaStyles.push({
        key: 'left',
        style: {
          position: 'absolute',
          top: dropdownAnchor.y,
          left: 0,
          width: dropdownAnchor.x,
          height: middleHeight,
        },
      });
    }

    if (rightWidth > 0 && middleHeight > 0) {
      closeAreaStyles.push({
        key: 'right',
        style: {
          position: 'absolute',
          top: dropdownAnchor.y,
          left: rightEdge,
          width: rightWidth,
          height: middleHeight,
        },
      });
    }

    if (overlayHeight - dropdownBottom > 0) {
      closeAreaStyles.push({
        key: 'bottom',
        style: {
          position: 'absolute',
          top: dropdownBottom,
          left: 0,
          right: 0,
          bottom: 0,
        },
      });
    }
  }

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      justifyContent="flex-start"
      pointerEvents="box-none"
      zIndex={3}
      ref={overlayRef}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setOverlayLayout((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }}
    >
      <Pressable
        style={{
          position: 'absolute',
          top: -topInset,
          bottom: -bottomInset,
          left: 0,
          right: 0,
        }}
        onPress={closeSearchList}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            opacity: backdropOpacity,
          }}
        />
      </Pressable>
      <AnimatedBox
        width="100%"
        backgroundColor="backgroundAlt"
        padding="l"
        zIndex={1}
        style={{
          paddingTop: theme.spacing.l + topInset,
          marginTop: -topInset,
          borderBottomLeftRadius: theme.borderRadii.m,
          borderBottomRightRadius: theme.borderRadii.m,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
          transform: [{ translateY: overlayTranslateY }],
        }}
      >
        <Text variant="heading2" color="text" marginBottom="m">
          {headingText}
        </Text>
        <Box style={{ position: 'relative', zIndex: 2, marginTop: theme.spacing.xsPlus }}>
          <Box
            style={{ position: 'relative' }}
            ref={searchAnchorRef}
            onLayout={updateDropdownAnchor}
          >
            <TextInput
              ref={searchInputRef}
              style={[
                inputStyle,
                {
                  paddingRight: theme.spacing['3xl'],
                },
                isSearchFocused
                  ? {
                      borderBottomLeftRadius: 0,
                      borderBottomRightRadius: 0,
                    }
                  : null,
              ]}
              value={search}
              onChangeText={handleSearchChange}
              onFocus={() => {
                handleSearchFocus();
                updateDropdownAnchor();
              }}
              onPressIn={() => {
                handleSearchFocus();
                updateDropdownAnchor();
              }}
              placeholder={t('placeholders.search')}
              placeholderTextColor={theme.colors.muted}
              autoCapitalize="none"
            />
            {search.length > 0 ? (
              <Pressable
                onPress={handleClearSearch}
                hitSlop={8}
                style={({ pressed }) => ({
                  position: 'absolute',
                  right: theme.spacing.s,
                  top: '50%',
                  transform: [{ translateY: -10 }],
                  opacity: pressed ? 0.6 : 0.9,
                })}
              >
                <Box
                  width={20}
                  height={20}
                  borderRadius="full"
                  alignItems="center"
                  justifyContent="center"
                >
                  <X size={14} color={theme.colors.muted} />
                </Box>
              </Pressable>
            ) : null}
          </Box>
        </Box>
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.sPlus }]}
          value={label}
          onChangeText={handleLabelChange}
          onFocus={handleFieldFocus}
          placeholder={t('placeholders.label')}
          placeholderTextColor={theme.colors.muted}
        />
        <Box flexDirection="row" alignItems="center" marginTop="xsPlus" marginHorizontal="sPlus">
          {isLabelTooLong ? (
            <Box flex={1} flexDirection="row" alignItems="center">
              <Box marginRight="xs">
                <AlertTriangle size={12} color={theme.colors.danger} />
              </Box>
              <Text variant="caption" color="danger">
                {t('errors.maxCharacters', { limit: labelLimit })}
              </Text>
            </Box>
          ) : labelWasCleared ? (
            <Box flex={1} flexDirection="row" alignItems="center">
              <Box marginRight="xs">
                <AlertTriangle size={12} color={theme.colors.danger} />
              </Box>
              <Text variant="caption" color="danger">
                {t('errors.provideLabel')}
              </Text>
            </Box>
          ) : (
            <Box flex={1} />
          )}
          <Text variant="caption" color={isLabelTooLong || labelWasCleared ? 'danger' : 'muted'}>
            {labelLength}/{labelLimit}
          </Text>
        </Box>
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.sPlus }]}
          value={membersInput}
          onChangeText={handleMembersChange}
          onFocus={handleFieldFocus}
          placeholder={t('placeholders.members')}
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="words"
        />
        <Box flexDirection="row" alignItems="center" marginTop="xsPlus" marginHorizontal="sPlus">
          {isMembersTooLong ? (
            <Box flex={1} flexDirection="row" alignItems="center">
              <Box marginRight="xs">
                <AlertTriangle size={12} color={theme.colors.danger} />
              </Box>
              <Text variant="caption" color="danger">
                {t('errors.maxCharacters', { limit: membersLimit })}
              </Text>
            </Box>
          ) : (
            <Box flex={1} />
          )}
          <Text variant="caption" color={isMembersTooLong ? 'danger' : 'muted'}>
            {membersLength}/{membersLimit}
          </Text>
        </Box>

        <Box flexDirection="row" alignItems="center" marginTop="xsPlus" marginHorizontal="sPlus">
          {error ? (
            <Box marginRight="xs">
              <AlertTriangle size={12} color={theme.colors.danger} />
            </Box>
          ) : null}
          <Text variant="caption" color="danger">
            {error}
          </Text>
        </Box>

        <Box
          flexDirection="row"
          justifyContent="flex-end"
          marginTop="s"
          flexWrap="wrap-reverse"
          gap="m"
        >
          <Box>
            <Button
              label={t('buttons.cancel')}
              size="sm"
              variant="ghost"
              onPress={handleCancel}
              icon={<X size={14} color={theme.colors.text} />}
            />
          </Box>
          <Box flexDirection="row" justifyContent="flex-end" flexWrap="wrap-reverse" gap="m">
            {!isEdit && existingZones.length > 0 ? (
              <Box>
                <Button
                  label={t('buttons.addToTop')}
                  size="sm"
                  variant="ghost"
                  onPress={() => handleSubmit(true)}
                  icon={<ArrowUp size={14} color={theme.colors.text} />}
                />
              </Box>
            ) : null}
            <Button
              label={submitLabel}
              size="sm"
              onPress={() => handleSubmit(false)}
              icon={
                isEdit ? (
                  <Check size={16} color={theme.colors.textInverse} />
                ) : (
                  <Plus size={16} color={theme.colors.textInverse} />
                )
              }
            />
          </Box>
        </Box>
      </AnimatedBox>
      {closeAreaStyles.length > 0 ? (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 3,
            elevation: 14,
          }}
        >
          {closeAreaStyles.map(({ key, style }) => (
            <Pressable key={key} onPress={closeSearchList} style={style} />
          ))}
        </View>
      ) : null}
      {isSearchFocused && dropdownAnchor ? (
        <Box
          borderWidth={1}
          borderColor="borderSubtle"
          borderRadius="s"
          overflow="hidden"
          backgroundColor="card"
          style={{
            position: 'absolute',
            top: dropdownAnchor.y + dropdownAnchor.height,
            left: dropdownAnchor.x,
            width: dropdownAnchor.width,
            zIndex: 4,
            elevation: 16,
            borderTopWidth: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            height: dropdownHeight,
          }}
        >
          <FlatList
            data={availableOptions}
            keyExtractor={(item: TimeZoneOption) => item.id}
            scrollEnabled
            nestedScrollEnabled
            renderItem={({ item }) => {
              const isUsed = isOptionUsed(item);
              const cityLabel = getCityLabel(item);
              const locationLine = getLocationLine(item);
              const timeLabel = formatTimeInZone(item.timeZoneId, now);
              const offsetLabel = formatUtcOffsetLabel(item.timeZoneId, now);
              return (
                <Pressable onPress={() => handleSelectTz(item)}>
                  <Box paddingVertical="sPlus" paddingHorizontal="m">
                    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                      <Box flexDirection="row" alignItems="center" flex={1} marginRight="s">
                        <Box flex={1}>
                          <Text variant="body" color="textSecondary">
                            {cityLabel}
                          </Text>
                          {locationLine ? (
                            <Text variant="caption" color="muted">
                              {locationLine}
                            </Text>
                          ) : null}
                        </Box>
                        {isUsed ? (
                          <Box
                            marginLeft="s"
                            paddingHorizontal="s"
                            paddingVertical="xs"
                            borderRadius="full"
                            backgroundColor="primarySoft"
                          >
                            <Text variant="label" color="textSecondary">
                              {t('badge.added')}
                            </Text>
                          </Box>
                        ) : null}
                      </Box>
                      <Box alignItems="flex-end">
                        <Text variant="body" color="textSecondary" style={{ textAlign: 'right' }}>
                          {timeLabel}
                        </Text>
                        <Text variant="caption" color="muted" style={{ textAlign: 'right' }}>
                          {offsetLabel}
                        </Text>
                      </Box>
                    </Box>
                  </Box>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Box padding="m">
                <Text variant="caption" color="muted">
                  {t('list.empty')}
                </Text>
              </Box>
            }
            style={{ height: dropdownHeight }}
            keyboardShouldPersistTaps="handled"
          />
        </Box>
      ) : null}
    </Box>
  );
}
