import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput } from 'react-native';
import { useTheme } from '@shopify/restyle';

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
      return;
    }
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setSearch('');
    setError('');
  }, [visible, initialValue]);

  if (!visible) {
    return null;
  }

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

  const handleSelectTz = (tz: string) => {
    setTimeZone(tz);
    const city = tz.split('/').pop() || tz;
    setLabel((prev) => (prev.trim() ? prev : city.replace(/_/g, ' ')));
    setSearch(tz);
    setError('');
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
        onPress={handleCancel}
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
        <TextInput
          style={[inputStyle, { marginTop: theme.spacing.xsPlus }]}
          value={search}
          onChangeText={(val) => {
            setSearch(val);
            setError('');
          }}
          placeholder="Search time zone id (e.g., Europe/Paris)"
          placeholderTextColor={theme.colors.muted}
          autoCapitalize="none"
        />
        <Box
          marginTop="sPlus"
          maxHeight={160}
          borderWidth={1}
          borderColor="borderSubtle"
          borderRadius="s"
          overflow="hidden"
          backgroundColor="card"
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
