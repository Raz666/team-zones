import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type ZoneGroup = {
  label: string;
  timeZone: string;
  members?: string[];
};

// Focus on time per zone; members are optional and grouped under each zone.
const INITIAL_ZONES: ZoneGroup[] = [
  { label: 'New York', timeZone: 'America/New_York', members: ['Alice'] },
  { label: 'London', timeZone: 'Europe/London', members: ['Bala', 'Priya'] },
  { label: 'Singapore', timeZone: 'Asia/Singapore', members: ['Chen'] },
  { label: 'Sydney', timeZone: 'Australia/Sydney', members: ['Daria'] },
  { label: 'Los Angeles', timeZone: 'America/Los_Angeles' }, // example without members
];

const timeFormatter = (tz: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: tz,
  });

const weekdayFormatter = (tz: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    timeZone: tz,
  });

function formatZone(now: Date, zone: ZoneGroup) {
  const time = timeFormatter(zone.timeZone).format(now);
  const weekday = weekdayFormatter(zone.timeZone).format(now);

  // Compare day relative to device to flag yesterday/tomorrow.
  const deviceDay = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);
  let dayBadge: 'yday' | 'today' | 'tomo' = 'today';
  if (weekday !== deviceDay) {
    const deviceDayNum = now.getUTCDay();
    const zoneDayNum = new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: zone.timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(now),
    ).getUTCDay();
    const diff = zoneDayNum - deviceDayNum;
    if (diff === -1 || diff === 6) dayBadge = 'yday';
    else if (diff === 1 || diff === -6) dayBadge = 'tomo';
  }

  return { time, weekday, dayBadge };
}

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [zones, setZones] = useState<ZoneGroup[]>(INITIAL_ZONES);
  const [newLabel, setNewLabel] = useState('');
  const [newTimeZone, setNewTimeZone] = useState('');
  const [newMembers, setNewMembers] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function addZone() {
    const label = newLabel.trim();
    const timeZone = newTimeZone.trim();
    if (!label || !timeZone) {
      setError('Please enter a label and time zone id (e.g., Europe/Paris).');
      return;
    }
    try {
      new Intl.DateTimeFormat('en-US', { timeZone }).format(now);
    } catch {
      setError('Invalid time zone id. Use IANA names like America/New_York.');
      return;
    }
    const members = newMembers
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    setZones((prev) => [...prev, { label, timeZone, members: members.length ? members : undefined }]);
    setNewLabel('');
    setNewTimeZone('');
    setNewMembers('');
    setError('');
  }

  const rows = useMemo(
    () =>
      zones.map((zone) => {
        const info = formatZone(now, zone);
        return { ...zone, ...info };
      }),
    [now, zones],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Time by Time Zone</Text>

      <View style={styles.form}>
        <TextInput
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="Label (e.g., Paris)"
          placeholderTextColor="#6b7a99"
          style={styles.input}
        />
        <TextInput
          value={newTimeZone}
          onChangeText={setNewTimeZone}
          placeholder="Time zone id (e.g., Europe/Paris)"
          placeholderTextColor="#6b7a99"
          autoCapitalize="none"
          style={styles.input}
        />
        <TextInput
          value={newMembers}
          onChangeText={setNewMembers}
          placeholder="Members comma-separated (optional)"
          placeholderTextColor="#6b7a99"
          autoCapitalize="words"
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={addZone}>
          <Text style={styles.buttonText}>Add Time Zone</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((row) => (
          <View key={row.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{row.label}</Text>
              <View style={[styles.badge, badgeStyle(row.dayBadge)]}>
                <Text style={styles.badgeText}>
                  {row.dayBadge === 'today'
                    ? row.weekday
                    : row.dayBadge === 'yday'
                      ? 'Yday'
                      : 'Tmrw'}
                </Text>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.time}>{row.time}</Text>

              {row.members && row.members.length > 0 ? (
                <Text style={styles.members}>{row.members.join(' · ')}</Text>
              ) : (
                <Text style={styles.membersMuted}>No members listed</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function badgeStyle(tag: 'yday' | 'today' | 'tomo') {
  switch (tag) {
    case 'yday':
      return { backgroundColor: '#e07a5f' };
    case 'tomo':
      return { backgroundColor: '#3d5a80' };
    default:
      return { backgroundColor: '#5f0f40' };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b132b',
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#111a2e',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    gap: 8,
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
  button: {
    backgroundColor: '#5f0f40',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  error: {
    color: '#e07a5f',
    fontSize: 12,
  },
  list: {
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  name: {
    color: '#e0fbfc',
    fontSize: 18,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  time: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
  },
  zoneId: {
    color: '#98c1d9',
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  members: {
    color: '#e0fbfc',
    fontSize: 13,
  },
  membersMuted: {
    color: '#6b7a99',
    fontSize: 12,
  },
});
