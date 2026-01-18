import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  formatTimeInZone,
  formatUtcOffsetLabel,
  getTimeZoneOption,
  getTimeZoneOptions,
} from '../utils/timeZoneDisplay';
import type { TimeZoneOption } from '../utils/timeZoneDisplay';
import { TIMEZONE_ALIASES } from '../utils/timeZoneAliases';
import { IANA_TIMEZONES } from '../utils/timezones';
import { normalizeTimeZoneId } from '../utils/timeZoneUtils';

export type ZoneDraft = {
  label: string;
  timeZone: string;
  members?: string[];
};

const AnimatedBox = Animated.createAnimatedComponent(Box);

const normalizeLabelValue = (value: string) => value.trim().toLowerCase();

const getOptionLabelKeys = (option: TimeZoneOption) => {
  const keys = new Set<string>();
  const addKey = (value?: string) => {
    if (!value) return;
    const key = normalizeLabelValue(value);
    if (key) keys.add(key);
  };
  addKey(option.city);
  addKey(option.cityRaw);
  addKey(option.cityLabel);
  if (option.legacyCity) {
    const legacyKey = normalizeLabelValue(option.legacyCity);
    if (legacyKey) keys.add(legacyKey);
  }
  addKey(option.label);
  return keys;
};

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
  const [label, setLabel] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [labelWasCleared, setLabelWasCleared] = useState(false);
  const [overlayLayout, setOverlayLayout] = useState({ width: 0, height: 0 });
  const searchInputRef = useRef<TextInput>(null);
  const searchAnchorRef = useRef<View>(null);
  const overlayRef = useRef<View>(null);
  const skipResetOnClearRef = useRef(false);
  const [dropdownAnchor, setDropdownAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const isEdit = mode === 'edit' || Boolean(initialValue);

  const allTimeZones: string[] = useMemo(() => {
    const supportedRaw =
      typeof (Intl as any).supportedValuesOf === 'function'
        ? (Intl as any).supportedValuesOf('timeZone')
        : [];
    const supported: string[] = Array.isArray(supportedRaw) ? (supportedRaw as string[]) : [];
    const base = supported.length > 0 ? supported : IANA_TIMEZONES;
    return Array.from(new Set(base)).sort();
  }, []);

  const allTimeZoneOptions = useMemo(
    () => getTimeZoneOptions(allTimeZones, TIMEZONE_ALIASES, i18n.language),
    [allTimeZones, i18n.language],
  );

  const now = useMemo(() => new Date(), [isSearchFocused, search]);

  const existingZonesById = useMemo(() => {
    const map = new Map<string, { zone: ZoneDraft; index: number }[]>();
    existingZones.forEach((zone, index) => {
      const zoneId = normalizeTimeZoneId(zone.timeZone);
      const list = map.get(zoneId) ?? [];
      list.push({ zone, index });
      map.set(zoneId, list);
    });
    return map;
  }, [existingZones]);

  const existingLabelsById = useMemo(() => {
    const map = new Map<string, Set<string>>();
    existingZones.forEach((zone) => {
      const zoneId = normalizeTimeZoneId(zone.timeZone);
      const labelKey = normalizeLabelValue(zone.label);
      const labels = map.get(zoneId) ?? new Set<string>();
      if (labelKey) {
        labels.add(labelKey);
      }
      map.set(zoneId, labels);
    });
    return map;
  }, [existingZones]);

  const usedTimeZoneSet = useMemo(
    () => new Set(usedTimeZones.map((tz) => normalizeTimeZoneId(tz))),
    [usedTimeZones],
  );

  const findExistingMatch = (option: TimeZoneOption) => {
    const matches = existingZonesById.get(option.timeZoneId);
    if (!matches) return null;
    const candidates = getOptionLabelKeys(option);
    for (const match of matches) {
      const labelKey = normalizeLabelValue(match.zone.label);
      if (candidates.has(labelKey)) {
        return match;
      }
    }
    return null;
  };

  const isOptionUsed = (option: TimeZoneOption) => {
    const labels = existingLabelsById.get(option.timeZoneId);
    if (labels && labels.size > 0) {
      for (const key of getOptionLabelKeys(option)) {
        if (labels.has(key)) return true;
      }
      return false;
    }
    if (existingZones.length === 0) {
      return usedTimeZoneSet.has(option.timeZoneId);
    }
    return false;
  };

  const getCityLabel = (option: TimeZoneOption) =>
    option.cityLabel ?? option.cityRaw ?? option.city;

  const getLocationLine = (option: TimeZoneOption) => {
    const region =
      option.regionKey && option.regionKey !== 'americas' ? option.regionLabel : undefined;
    const parts = option.district ? [option.district, option.country] : [option.country, region];
    const cleaned = parts.filter(Boolean) as string[];
    const deduped = cleaned.filter((piece, index) => {
      if (index === 0) return true;
      return cleaned[index - 1].toLowerCase() !== piece.toLowerCase();
    });
    return deduped.join(', ');
  };

  const availableOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allTimeZoneOptions;
    return allTimeZoneOptions.filter((option) => {
      if (option.searchText.includes(term)) return true;
      const offsetLabel = formatUtcOffsetLabel(option.timeZoneId, now).toLowerCase();
      if (offsetLabel.includes(term)) return true;
      if (offsetLabel.startsWith('utc')) {
        const gmtLabel = `gmt${offsetLabel.slice(3)}`;
        if (gmtLabel.includes(term)) return true;
      }
      return false;
    });
  }, [allTimeZoneOptions, now, search]);

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      const normalized = normalizeTimeZoneId(initialValue.timeZone);
      const option =
        allTimeZoneOptions.find((item) => item.id === normalized) ??
        getTimeZoneOption(normalized, i18n.language);
      setLabel(initialValue.label);
      setTimeZone(option.timeZoneId);
      setMembersInput(initialValue.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      setLabelWasCleared(false);
      return;
    }
    if (skipResetOnClearRef.current) {
      skipResetOnClearRef.current = false;
      return;
    }
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
    setIsSearchFocused(false);
    setLabelWasCleared(false);
  }, [allTimeZoneOptions, visible, initialValue]);

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

  const reset = () => {
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
    setLabelWasCleared(false);
  };

  const closeSearchList = () => {
    setIsSearchFocused(false);
    searchInputRef.current?.blur();
  };

  const handleSubmit = (insertAtStart = false) => {
    const trimmedLabel = label.trim();
    const trimmedTimeZone = normalizeTimeZoneId(timeZone.trim());
    if (!trimmedLabel || !trimmedTimeZone) {
      setError(t('errors.missingSelection'));
      return;
    }
    if (isLabelTooLong || isMembersTooLong) {
      if (isLabelTooLong && isMembersTooLong) {
        setError(t('errors.shortenLabelAndMembers'));
      } else if (isLabelTooLong) {
        setError(t('errors.shortenLabel'));
      } else {
        setError(t('errors.shortenMembers'));
      }
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: trimmedTimeZone }).format(new Date());
    } catch {
      setError(t('errors.invalidTimeZone'));
      return;
    }
    const members = membersInput
      .split(/[,\uFF0C\u3001\uFF64\uFE10\uFE50\uFE51\u060C]/)
      .map((m) => m.trim())
      .filter(Boolean);

    const submitAction = insertAtStart && !isEdit && onSubmitAtStart ? onSubmitAtStart : onSubmit;

    submitAction({
      label,
      timeZone: trimmedTimeZone,
      members: members.length ? members : undefined,
    });
    reset();
    onClose();
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (!visible) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handleCancel();
      return true;
    });
    return () => subscription.remove();
  }, [handleCancel, visible]);

  const handleSelectTz = (option: TimeZoneOption) => {
    const existingMatch = findExistingMatch(option);
    const isAutoEdit = !startedInEdit && mode === 'edit';
    const currentLabelKey = normalizeLabelValue(initialValue?.label ?? label);
    const optionKeys = getOptionLabelKeys(option);
    const isSameSelection =
      option.timeZoneId === timeZone && currentLabelKey && optionKeys.has(currentLabelKey);

    if (isAutoEdit) {
      if (isSameSelection) {
        setSearch(option.label);
        setError('');
        setIsSearchFocused(false);
        return;
      }
      skipResetOnClearRef.current = true;
      onReturnToAdd?.();
      setTimeZone(option.timeZoneId);
      setLabel(getCityLabel(option));
      setLabelWasCleared(false);
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      return;
    }

    if (existingMatch && !startedInEdit) {
      const normalized = normalizeTimeZoneId(existingMatch.zone.timeZone);
      setLabel(existingMatch.zone.label);
      setLabelWasCleared(false);
      setTimeZone(normalized);
      setMembersInput(existingMatch.zone.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      onSelectExisting?.(existingMatch.index);
      return;
    }

    setTimeZone(option.timeZoneId);
    setLabel(getCityLabel(option));
    setLabelWasCleared(false);
    setSearch(option.label);
    setError('');
    setIsSearchFocused(false);
  };

  const handleClearSearch = () => {
    setSearch('');
    setTimeZone('');
    setError('');
    setIsSearchFocused(true);
    searchInputRef.current?.focus();
  };

  const headingText = isEdit ? t('heading.edit') : t('heading.add');
  const submitLabel = isEdit ? t('buttons.save') : t('buttons.add');
  const labelLimit = 25;
  const membersLimit = 50;
  const labelLength = label.length;
  const membersLength = membersInput.length;
  const isLabelTooLong = labelLength > labelLimit;
  const isMembersTooLong = membersLength > membersLimit;

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
              onChangeText={(val) => {
                setSearch(val);
                setTimeZone('');
                setError('');
                setIsSearchFocused(true);
              }}
              onFocus={() => {
                setIsSearchFocused(true);
                updateDropdownAnchor();
              }}
              onPressIn={() => {
                setIsSearchFocused(true);
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
          onChangeText={(text) => {
            if (label.length > 0 && text.length === 0) {
              setLabelWasCleared(true);
            } else if (text.length > 0) {
              setLabelWasCleared(false);
            }
            setLabel(text);
            setError('');
          }}
          onFocus={() => setIsSearchFocused(false)}
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
          onChangeText={(text) => {
            setMembersInput(text);
            setError('');
          }}
          onFocus={() => setIsSearchFocused(false)}
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
