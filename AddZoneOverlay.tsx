import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, Pressable, TextInput, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';
import { formatTimeInZone, formatUtcOffsetLabel, getTimeZoneOption } from './timeZoneDisplay';
import type { TimeZoneOption } from './timeZoneDisplay';
import { IANA_TIMEZONES } from './timezones';
import { normalizeTimeZoneId } from './timeZoneUtils';

export type ZoneDraft = {
  label: string;
  timeZone: string;
  members?: string[];
};

type AddZoneOverlayProps = {
  visible: boolean;
  usedTimeZones: string[];
  mode?: 'add' | 'edit';
  initialValue?: ZoneDraft;
  onSubmit: (zone: ZoneDraft) => void;
  onClose: () => void;
};

export function AddZoneOverlay({
  visible,
  usedTimeZones,
  mode,
  initialValue,
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
    () => allTimeZones.map((tz) => getTimeZoneOption(tz)),
    [allTimeZones],
  );

  const normalizedInitialTimeZone = useMemo(
    () => (initialValue ? normalizeTimeZoneId(initialValue.timeZone) : ''),
    [initialValue],
  );

  const usedTimeZoneSet = useMemo(
    () => new Set(usedTimeZones.map((tz) => normalizeTimeZoneId(tz))),
    [usedTimeZones],
  );

  const availableOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    const unused = allTimeZoneOptions.filter(
      (option) => !usedTimeZoneSet.has(option.id) || option.id === normalizedInitialTimeZone,
    );
    if (!term) return unused;
    return unused.filter((option) => option.searchText.includes(term));
  }, [allTimeZoneOptions, normalizedInitialTimeZone, search, usedTimeZoneSet]);

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      const normalized = normalizeTimeZoneId(initialValue.timeZone);
      const option = getTimeZoneOption(normalized);
      setLabel(initialValue.label);
      setTimeZone(option.id);
      setMembersInput(initialValue.members?.join(', ') ?? '');
      setSearch(option.label);
      setError('');
      setIsSearchFocused(false);
      return;
    }
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
    setIsSearchFocused(false);
  }, [visible, initialValue]);

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
    setTimeZone(option.id);
    setLabel((prev) => (prev.trim() ? prev : option.city));
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

  const now = useMemo(() => new Date(), [isSearchFocused, search]);
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
        onPress={() => setIsSearchFocused(false)}
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
              const locationLine = [item.district, item.country].filter(Boolean).join(', ');
              const timeLabel = formatTimeInZone(item.id, now);
              const offsetLabel = formatUtcOffsetLabel(item.id, now);
              return (
                <Pressable onPress={() => handleSelectTz(item)}>
                  <Box paddingVertical="sPlus" paddingHorizontal="m">
                    <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                      <Box flex={1} marginRight="s">
                        <Text variant="body" color="textSecondary">
                          {item.city}
                        </Text>
                        {locationLine ? (
                          <Text variant="caption" color="muted">
                            {locationLine}
                          </Text>
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
