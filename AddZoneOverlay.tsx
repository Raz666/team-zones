import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export type ZoneDraft = {
  label: string;
  timeZone: string;
  members?: string[];
};

type AddZoneOverlayProps = {
  visible: boolean;
  onAdd: (zone: ZoneDraft) => void;
  onClose: () => void;
};

export function AddZoneOverlay({ visible, onAdd, onClose }: AddZoneOverlayProps) {
  const [label, setLabel] = useState('');
  const [timeZone, setTimeZone] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [error, setError] = useState('');

  if (!visible) {
    return null;
  }

  const reset = () => {
    setLabel('');
    setTimeZone('');
    setMembersInput('');
    setError('');
  };

  const handleAdd = () => {
    const trimmedLabel = label.trim();
    const trimmedTimeZone = timeZone.trim();
    if (!trimmedLabel || !trimmedTimeZone) {
      setError('Please enter a label and time zone id (e.g., Europe/Paris).');
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

    onAdd({
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

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable style={styles.scrim} onPress={handleCancel} />
      <View style={styles.modal}>
        <Text style={styles.heading}>Add Time Zone</Text>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Label (e.g., Paris)"
          placeholderTextColor="#6b7a99"
          style={styles.input}
        />
        <TextInput
          value={timeZone}
          onChangeText={setTimeZone}
          placeholder="Time zone id (e.g., Europe/Paris)"
          placeholderTextColor="#6b7a99"
          autoCapitalize="none"
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
          <Pressable style={styles.primaryButton} onPress={handleAdd}>
            <Text style={styles.primaryText}>Add</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    width: '88%',
    backgroundColor: '#111a2e',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
    zIndex: 1,
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
