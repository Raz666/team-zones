import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { AddZoneOverlay, ZoneDraft } from './AddZoneOverlay';
import { UserTimeBar } from './UserTimeBar';
import { dayTagForZone, weekdayInZone } from './timeZoneUtils';

type ZoneGroup = {
  label: string;
  timeZone: string;
  members?: string[];
};

const INITIAL_ZONES: ZoneGroup[] = [
  { label: 'New York', timeZone: 'America/New_York', members: ['Alice'] },
  { label: 'London', timeZone: 'Europe/London', members: ['Bala', 'Priya'] },
  { label: 'Singapore', timeZone: 'Asia/Singapore', members: ['Chen'] },
  { label: 'Sydney', timeZone: 'Australia/Sydney', members: ['Daria'] },
  { label: 'Los Angeles', timeZone: 'America/Los_Angeles' },
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
  const [paused, setPaused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);
  const longPressFlag = useRef(false);
  const actionAnimRefs = useRef<Record<number, Animated.Value>>({});
  const actionVisibility = useRef<Record<number, boolean>>({});

  useEffect(() => {
    if (paused) return;
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, [paused]);

  const deviceTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const usedTimeZones = useMemo(
    () =>
      zones
        .filter((_, idx) => draftIndex === null || idx !== draftIndex)
        .map((z) => z.timeZone),
    [zones, draftIndex],
  );

  function submitZone(zone: ZoneDraft) {
    setZones((prev) => {
      if (draftIndex === null) {
        return [...prev, zone];
      }
      return prev.map((item, idx) => (idx === draftIndex ? { ...item, ...zone } : item));
    });
    setShowForm(false);
    setDraftIndex(null);
    setActionIndex(null);
  }

  function deleteZone(index: number) {
    setZones((prev) => prev.filter((_, i) => i !== index));
    setActionIndex(null);
    if (draftIndex === index) {
      setDraftIndex(null);
      setShowForm(false);
    }
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

  async function onReordered(from: number, to: number) {
    setActionIndex(null);
    setZones((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function renderItem({
    item,
    onDragStart,
    onDragEnd,
    isActive,
    index,
  }: DragListRenderItemInfo<ZoneGroup>) {
    const info = formatZone(currentTime, item, deviceTimeZone);
    const isHover = hoverIndex === index && activeIndex !== null && activeIndex !== index;
    const showActions = actionIndex === index && !isActive;
    const actionAnim =
      actionAnimRefs.current[index] || (actionAnimRefs.current[index] = new Animated.Value(0));

    const handlePress = () => {
      if (longPressFlag.current) {
        longPressFlag.current = false;
        return;
      }
      setActionIndex((prev) => (prev === index ? null : index));
    };

    const handleEdit = () => {
      setDraftIndex(index);
      setShowForm(true);
      setActionIndex(null);
    };

    const handleDelete = () => {
      deleteZone(index);
    };

    const wasVisible = actionVisibility.current[index] || false;
    if (showActions && !wasVisible) {
      actionVisibility.current[index] = true;
      actionAnim.setValue(0);
      Animated.timing(actionAnim, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    } else if (!showActions && wasVisible) {
      actionVisibility.current[index] = false;
      actionAnim.setValue(0);
    }

    const actionStyle = {
      opacity: actionAnim,
      transform: [
        {
          translateY: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
        },
      ],
    };

    return (
      <View style={styles.cardWrapper}>
        <Pressable
          onPress={handlePress}
          onLongPress={() => {
            longPressFlag.current = true;
            setActionIndex(null);
            setActiveIndex(index);
            setHoverIndex(index);
            onDragStart();
          }}
          delayLongPress={400}
          onPressOut={() => {
            onDragEnd();
            setActiveIndex(null);
            setHoverIndex(null);
          }}
          style={[
            styles.card,
            isActive && styles.cardActive,
            !isActive && activeIndex === index && styles.cardArmed,
            isHover && styles.cardHover,
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.name}>{item.label}</Text>
            <View style={[styles.badge, badgeStyle(info.dayBadge)]}>
              <Text style={styles.badgeText}>{info.weekday}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.time}>{info.time}</Text>
            {item.members && item.members.length > 0 ? (
              <Text style={styles.members}>{item.members.join(' · ')}</Text>
            ) : (
              <Text style={styles.membersMuted}>No members listed</Text>
            )}
          </View>
        </Pressable>
        {showActions ? (
          <Animated.View style={[styles.cardActions, actionStyle]}>
            <Pressable style={[styles.actionButton, styles.secondaryAction]} onPress={handleDelete}>
              <Text style={styles.actionText}>Delete</Text>
            </Pressable>
            <Pressable style={[styles.actionButton]} onPress={handleEdit}>
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Time by Time Zone</Text>
        {zones.length > 0 ? (
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setDraftIndex(null);
              setActionIndex(null);
              setShowForm(true);
            }}
          >
            <Text style={styles.iconText}>+</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      {zones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No zones yet</Text>
          <Text style={styles.emptySubtitle}>Add your first city to see time differences.</Text>
          <Pressable
            style={styles.primaryCta}
            onPress={() => {
              setDraftIndex(null);
              setActionIndex(null);
              setShowForm(true);
            }}
          >
            <Text style={styles.primaryCtaText}>Add a time zone</Text>
          </Pressable>
        </View>
      ) : (
        <DragList
          contentContainerStyle={styles.list}
          data={zones}
          keyExtractor={(item) => `${item.label}-${item.timeZone}`}
          renderItem={renderItem}
          onReordered={onReordered}
          onHoverChanged={(index) => setHoverIndex(index)}
        />
      )}

      <AddZoneOverlay
        visible={showForm}
        usedTimeZones={usedTimeZones}
        initialValue={draftIndex !== null ? zones[draftIndex] : undefined}
        mode={draftIndex !== null ? 'edit' : 'add'}
        onSubmit={submitZone}
        onClose={() => {
          setShowForm(false);
          setDraftIndex(null);
          longPressFlag.current = false;
        }}
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
    paddingBottom: 68,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1c2541',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardActive: {
    transform: [{ scale: 0.94 }],
    borderColor: '#3d5a80',
    shadowColor: '#000',
    borderStyle: 'dashed',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cardArmed: {
    borderColor: '#e07a5f',
  },
  cardHover: {
    borderColor: '#98c1d9',
    backgroundColor: '#23304f',
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
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    alignSelf: 'stretch',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#5f0f40',
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: '#e0fbfc',
    fontSize: 20,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#6b7a99',
    fontSize: 14,
  },
  primaryCta: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#5f0f40',
  },
  primaryCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
