import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';
import {
  formatTimeInZone,
  formatUtcOffsetLabel,
  getTimeZoneOption,
  getTimeZoneOptions,
} from './timeZoneDisplay';
import type { TimeZoneOption } from './timeZoneDisplay';
import { TIMEZONE_ALIASES } from './timeZoneAliases';
import { IANA_TIMEZONES } from './timezones';
import { normalizeTimeZoneId } from './timeZoneUtils';

export type ZoneDraft = {
  label: string;
  timeZone: string;
  members?: string[];
};

const normalizeLabelValue = (value: string) => value.trim().toLowerCase();

const getOptionLabelKeys = (option: TimeZoneOption) => {
  const keys = new Set<string>();
  const cityKey = normalizeLabelValue(option.city);
  if (cityKey) keys.add(cityKey);
  if (option.legacyCity) {
    const legacyKey = normalizeLabelValue(option.legacyCity);
    if (legacyKey) keys.add(legacyKey);
  }
  const labelKey = normalizeLabelValue(option.label);
  if (labelKey) keys.add(labelKey);
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
  onClose,
}: AddZoneOverlayProps) {
  const theme = useTheme<AppTheme>();
  const [label, setLabel] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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
    () => getTimeZoneOptions(allTimeZones, TIMEZONE_ALIASES),
    [allTimeZones],
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

  const getLocationLine = (option: TimeZoneOption) => {
    const region =
      option.region && option.region !== 'Americas' ? option.region : undefined;
    const parts = option.district
      ? [option.district, option.country]
      : [option.country, region];
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
        getTimeZoneOption(normalized);
      setLabel(initialValue.label);
      setTimeZone(option.timeZoneId);
      setMembersInput(initialValue.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
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
  }, [allTimeZoneOptions, visible, initialValue]);

  const reset = () => {
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
  };

  const handleSubmit = () => {
    const trimmedLabel = label.trim();
    const trimmedTimeZone = normalizeTimeZoneId(timeZone.trim());
    if (!trimmedLabel || !trimmedTimeZone) {
      setError('Select a time zone and provide a label.');
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: trimmedTimeZone }).format(new Date());
    } catch {
      setError('Invalid time zone id. Use IANA names like America/New_York.');
      return;
    }
    const members = membersInput
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    onSubmit({
      label: trimmedLabel,
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
      setLabel(option.city);
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      return;
    }

    if (existingMatch && !startedInEdit) {
      const normalized = normalizeTimeZoneId(existingMatch.zone.timeZone);
      setLabel(existingMatch.zone.label);
      setTimeZone(normalized);
      setMembersInput(existingMatch.zone.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      onSelectExisting?.(existingMatch.index);
      return;
    }

    setTimeZone(option.timeZoneId);
    setLabel(option.city);
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

  const headingText = isEdit ? 'Edit Time Zone' : 'Add Time Zone';
  const submitLabel = isEdit ? 'Save' : 'Add';

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
  const dropdownMaxHeight = 200;
  const dropdownCount = Math.min(availableOptions.length, 20);
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

  if (!visible) {
    return null;
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
    >
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
        onPress={() => {
          setIsSearchFocused(false);
          searchInputRef.current?.blur();
        }}
      >
        <Box flex={1} backgroundColor="overlay" />
      </Pressable>
      <Box
        width="100%"
        backgroundColor="backgroundAlt"
        padding="l"
        zIndex={1}
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 12,
        }}
      >
        <Text variant="heading2" color="text">
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
              placeholder="Search time zone id (e.g., Europe/Paris)"
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
            setLabel(text);
            setError('');
          }}
          onFocus={() => setIsSearchFocused(false)}
          placeholder="Label (auto-filled from city, editable)"
          placeholderTextColor={theme.colors.muted}
        />
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.sPlus }]}
          value={membersInput}
          onChangeText={setMembersInput}
          onFocus={() => setIsSearchFocused(false)}
          placeholder="Members comma-separated (optional)"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="words"
        />
        {error ? (
          <Text variant="caption" color="danger" marginTop="xsPlus">
            {error}
          </Text>
        ) : null}
        <Box flexDirection="row" justifyContent="flex-end" marginTop="s">
          <Box marginRight="m">
            <Button label="Cancel" variant="ghost" onPress={handleCancel} />
          </Box>
          <Button label={submitLabel} onPress={handleSubmit} />
        </Box>
      </Box>
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
            data={availableOptions.slice(0, 20)}
            keyExtractor={(item: TimeZoneOption) => item.id}
            scrollEnabled
            nestedScrollEnabled
            renderItem={({ item }) => {
              const isUsed = isOptionUsed(item);
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
                            {item.city}
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
                              Added
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
                  No unused time zones match.
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
