import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, FlatList, Pressable, TextInput } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { X } from 'lucide-react-native';

import type { AppTheme } from './src/theme/themes';
import { Box, Button, Text } from './src/theme/components';
import { IANA_TIMEZONES } from './timezones';

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

  const availableOptions: string[] = useMemo(() => {
    const term = search.trim().toLowerCase();
    const unused = allTimeZones.filter(
      (tz) => !usedTimeZones.includes(tz) || tz === initialValue?.timeZone,
    );
    if (!term) return unused;
    return unused.filter((tz) => tz.toLowerCase().includes(term));
  }, [allTimeZones, search, usedTimeZones, initialValue]);

  useEffect(() => {
    if (!visible) return;
    if (initialValue) {
      setLabel(initialValue.label);
      setTimeZone(initialValue.timeZone);
      setMembersInput(initialValue.members?.join(', ') ?? '');
      setSearch(initialValue.timeZone);
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
    const trimmedTimeZone = timeZone.trim();
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

  const handleSelectTz = (tz: string) => {
    setTimeZone(tz);
    const city = tz.split('/').pop() || tz;
    setLabel((prev) => (prev.trim() ? prev : city.replace(/_/g, ' ')));
    setSearch(tz);
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
    >
      <Pressable
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
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
          <Box style={{ position: 'relative' }}>
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
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
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
          {isSearchFocused ? (
            <Box
              maxHeight={160}
              borderWidth={1}
              borderColor="borderSubtle"
              borderRadius="s"
              overflow="hidden"
              backgroundColor="card"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 3,
                elevation: 6,
                borderTopWidth: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }}
            >
              <FlatList
                data={availableOptions.slice(0, 20)}
                keyExtractor={(tz: string) => tz}
                renderItem={({ item }) => (
                  <Pressable onPress={() => handleSelectTz(item)}>
                    <Box paddingVertical="sPlus" paddingHorizontal="m">
                      <Text variant="body" color="textSecondary">
                        {item}
                      </Text>
                    </Box>
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Box padding="m">
                    <Text variant="caption" color="muted">
                      No unused time zones match.
                    </Text>
                  </Box>
                }
                style={{ maxHeight: 160 }}
                keyboardShouldPersistTaps="handled"
              />
            </Box>
          ) : null}
        </Box>
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.sPlus }]}
          value={label}
          onChangeText={(text) => {
            setLabel(text);
            setError('');
          }}
          placeholder="Label (auto-filled from city, editable)"
          placeholderTextColor={theme.colors.muted}
        />
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.sPlus }]}
          value={membersInput}
          onChangeText={setMembersInput}
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
    </Box>
  );
}
