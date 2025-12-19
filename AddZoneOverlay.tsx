import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={handleCancel} />
      <View style={styles.modal}>
        <Text style={styles.heading}>{headingText}</Text>
        <TextInput
          value={search}
          onChangeText={(val) => {
            setSearch(val);
            setError('');
          }}
          placeholder="Search time zone id (e.g., Europe/Paris)"
          placeholderTextColor="#6b7a99"
          autoCapitalize="none"
          style={styles.input}
        />
        <View style={styles.dropdown}>
          <FlatList
            data={availableOptions.slice(0, 20)}
            keyExtractor={(tz: string) => tz}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleSelectTz(item)} style={styles.option}>
                <Text style={styles.optionText}>{item}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.noResults}>No unused time zones match.</Text>}
            style={styles.dropdownList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
        <TextInput
          value={label}
          onChangeText={(text) => {
            setLabel(text);
            setError('');
          }}
          placeholder="Label (auto-filled from city, editable)"
          placeholderTextColor="#6b7a99"
          style={styles.input}
        />
        <TextInput
          value={membersInput}
          onChangeText={setMembersInput}
          placeholder="Members comma-separated (optional)"
          placeholderTextColor="#6b7a99"
          autoCapitalize="words"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable style={styles.secondaryButton} onPress={handleCancel}>
            <Text style={styles.secondaryText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={handleSubmit}>
            <Text style={styles.primaryText}>{submitLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modal: {
    width: '100%',
    backgroundColor: '#111a2e',
    padding: 16,
    gap: 10,
    zIndex: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  heading: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#1c2541',
    color: '#e0fbfc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    fontSize: 14,
  },
  error: {
    color: '#e07a5f',
    fontSize: 12,
  },
  dropdown: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1c2541',
  },
  dropdownList: {
    maxHeight: 160,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  optionText: {
    color: '#e0fbfc',
    fontSize: 14,
  },
  noResults: {
    color: '#6b7a99',
    fontSize: 12,
    padding: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryText: {
    color: '#e0fbfc',
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#5f0f40',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
