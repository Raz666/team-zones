import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AddZoneOverlay, ZoneDraft } from './AddZoneOverlay';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { UserTimeBar } from './UserTimeBar';
import { dayTagForZone, weekdayInZone } from './timeZoneUtils';

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

function formatZone(now: Date, zone: ZoneGroup, deviceTimeZone: string) {
  const time = timeFormatter(zone.timeZone).format(now);
  const weekday = weekdayInZone(now, zone.timeZone);
  const dayBadge = dayTagForZone(now, zone.timeZone, deviceTimeZone);

  return { time, weekday, dayBadge };
}

export default function App() {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [zones, setZones] = useState<ZoneGroup[]>(INITIAL_ZONES);
  const [showForm, setShowForm] = useState(false);
  const [paused, setPaused] = useState(false); // pause ticking when user adjusts time
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, [paused]);

  function addZone(zone: ZoneDraft) {
    setZones((prev) => [...prev, zone]);
  }

  function onChangeTime(event: DateTimePickerEvent, selected?: Date) {
    if (event.type === 'dismissed') {
      setShowPicker(false);
      return;
    }
    if (selected) {
      setCurrentTime(selected);
    }
    setShowPicker(false);
  }

  function resetToRealTime() {
    setCurrentTime(new Date());
    setPaused(false);
    setShowPicker(false);
  }

  const rows = useMemo(
    () =>
      zones.map((zone) => {
        const deviceTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const info = formatZone(currentTime, zone, deviceTimeZone);
        return { ...zone, ...info };
      }),
    [currentTime, zones],
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Time by Time Zone</Text>
        <Pressable style={styles.iconButton} onPress={() => setShowForm(true)}>
          <Text style={styles.iconText}>+</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((row) => (
          <View key={row.label} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{row.label}</Text>
              <View style={[styles.badge, badgeStyle(row.dayBadge)]}>
                <Text style={styles.badgeText}>{row.weekday}</Text>
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

      <AddZoneOverlay
        visible={showForm}
        usedTimeZones={zones.map((z) => z.timeZone)}
        onAdd={addZone}
        onClose={() => setShowForm(false)}
      />
      <UserTimeBar
        time={currentTime}
        onChange={() => {
          setCurrentTime(new Date());
          setPaused(true);
          setShowPicker(true);
        }}
        onReset={resetToRealTime}
      />
      {showPicker ? (
        <DateTimePicker
          value={currentTime}
          mode="time"
          is24Hour
          display="default"
          onChange={onChangeTime}
        />
      ) : null}
    </View>
  );
}

function badgeStyle(tag: 'yday' | 'today' | 'tomo') {
  switch (tag) {
    case 'yday':
      return { backgroundColor: '#0e152a' };
    case 'tomo':
      return { backgroundColor: '#e07a5f' };
    default:
      return { backgroundColor: '#3d5a80' };
  }
}

function formatUserTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b132b',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 96,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5f0f40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
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
