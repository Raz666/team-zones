import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

type Member = {
  name: string;
  city: string;
  timeZone: string;
};

// Hardcoded team list; use IANA time zones for correct DST handling.
const TEAM: Member[] = [
  { name: 'Alice', city: 'New York', timeZone: 'America/New_York' },
  { name: 'Bala', city: 'London', timeZone: 'Europe/London' },
  { name: 'Chen', city: 'Singapore', timeZone: 'Asia/Singapore' },
  { name: 'Daria', city: 'Sydney', timeZone: 'Australia/Sydney' },
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

function formatMemberTime(now: Date, member: Member) {
  const time = timeFormatter(member.timeZone).format(now);
  const weekday = weekdayFormatter(member.timeZone).format(now);

  // Compare day relative to device to flag yesterday/tomorrow.
  const deviceDay = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(now);
  let dayBadge: 'yday' | 'today' | 'tomo' = 'today';
  if (weekday !== deviceDay) {
    const deviceDayNum = now.getUTCDay();
    const memberDayNum = new Date(
      new Intl.DateTimeFormat('en-US', {
        timeZone: member.timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }).format(now)
    ).getUTCDay();
    const diff = memberDayNum - deviceDayNum;
    if (diff === -1 || diff === 6) dayBadge = 'yday';
    else if (diff === 1 || diff === -6) dayBadge = 'tomo';
  }

  return { time, weekday, dayBadge };
}

export default function App() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo(
    () =>
      TEAM.map((member) => {
        const info = formatMemberTime(now, member);
        return { ...member, ...info };
      }),
    [now]
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Team Timeboard</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {rows.map((row) => (
          <View key={row.name} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{row.name}</Text>
              <Text style={styles.city}>{row.city}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.time}>{row.time}</Text>
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
  },
  name: {
    color: '#e0fbfc',
    fontSize: 18,
    fontWeight: '600',
  },
  city: {
    color: '#98c1d9',
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    color: '#fff',
    fontSize: 28,
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
});
