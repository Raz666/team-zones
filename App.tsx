import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AddZoneOverlay, ZoneDraft } from './AddZoneOverlay';

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
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  function addZone(zone: ZoneDraft) {
    setZones((prev) => [...prev, zone]);
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

      <AddZoneOverlay visible={showForm} onAdd={addZone} onClose={() => setShowForm(false)} />
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
