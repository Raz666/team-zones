import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ThemeProvider } from '@shopify/restyle';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';

import { AddZoneOverlay, ZoneDraft } from './AddZoneOverlay';
import { UserTimeBar } from './UserTimeBar';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { dayTagForZone, weekdayInZone } from './timeZoneUtils';
import { Box, Button, Text } from './src/theme/components';
import type { AppTheme } from './src/theme/themes';
import { darkTheme, lightTheme } from './src/theme/themes';
import { FileText, Plus, Sun, Moon, Menu, Edit, Trash2 } from 'lucide-react-native';

type ZoneGroup = {
  label: string;
  timeZone: string;
  members?: string[];
};

type DayBadgeTag = 'yday' | 'today' | 'tomo';

const AnimatedBox = Animated.createAnimatedComponent(Box);

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

function badgeColor(tag: DayBadgeTag): keyof AppTheme['colors'] {
  switch (tag) {
    case 'yday':
      return 'badgeYesterday';
    case 'tomo':
      return 'badgeTomorrow';
    default:
      return 'badgeToday';
  }
}

export default function App() {
  const STORAGE_KEY = 'teamzones:zones:v1';
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme: AppTheme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode]);
  const isDark = mode === 'dark';

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [zones, setZones] = useState<ZoneGroup[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setZones(parsed as ZoneGroup[]);
          }
        }
      } catch (err) {
        console.warn('Failed to load saved zones', err);
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(zones)).catch((err) => {
      console.warn('Failed to save zones', err);
    });
  }, [zones, hydrated]);

  const deviceTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const usedTimeZones = useMemo(
    () =>
      zones.filter((_, idx) => draftIndex === null || idx !== draftIndex).map((z) => z.timeZone),
    [zones, draftIndex],
  );

  const openAddZone = () => {
    setDraftIndex(null);
    setActionIndex(null);
    setShowForm(true);
  };

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const menuItems = [
    {
      label: 'Add new zone',
      icon: <Plus size={20} color={theme.colors.text} />,
      onPress: () => {
        setShowMenu(false);
        openAddZone();
      },
    },
    {
      label: isDark ? 'Light theme' : 'Dark theme',
      icon: isDark ? (
        <Sun size={20} color={theme.colors.text} />
      ) : (
        <Moon size={20} color={theme.colors.text} />
      ),
      onPress: () => {
        toggleTheme();
      },
    },
    {
      label: 'Privacy policy',
      icon: <FileText size={20} color={theme.colors.text} />,
      onPress: () => {
        setShowMenu(false);
        setShowPrivacyPolicy(true);
      },
    },
  ];

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

    const cardStateStyle = [
      isActive
        ? {
            transform: [{ scale: 0.94 }],
            borderColor: theme.colors.cardBorderActive,
            borderStyle: 'dashed' as const,
            shadowColor: '#000',
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 6 },
            elevation: 8,
          }
        : null,
      !isActive && activeIndex === index
        ? {
            borderColor: theme.colors.cardBorderArmed,
          }
        : null,
      isHover
        ? {
            borderColor: theme.colors.cardBorderHover,
            backgroundColor: theme.colors.cardHover,
          }
        : null,
    ];

    return (
      <Box marginBottom="m">
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
        >
          <Box
            backgroundColor="card"
            borderRadius="l"
            padding="mPlus"
            borderWidth={1}
            borderColor="borderSubtle"
            borderStyle="solid"
            style={cardStateStyle}
          >
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              marginBottom="xsPlus"
            >
              <Text variant="subtitle" color="textSecondary">
                {item.label}
              </Text>
              <Box
                paddingHorizontal="sPlus"
                paddingVertical="xs"
                borderRadius="s"
                backgroundColor={badgeColor(info.dayBadge)}
              >
                <Text variant="label" color="textInverse">
                  {info.weekday}
                </Text>
              </Box>
            </Box>
            <Box
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between"
              marginBottom="xsPlus"
            >
              <Text variant="time">{info.time}</Text>
              {item.members && item.members.length > 0 ? (
                <Text variant="body" color="textSecondary">
                  {item.members.join(' • ')}
                </Text>
              ) : (
                <Text variant="caption" color="muted">
                  No members listed
                </Text>
              )}
            </Box>
          </Box>
        </Pressable>
        {showActions ? (
          <AnimatedBox
            style={actionStyle}
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            marginTop="xsPlus"
          >
            <Button
              label="Delete"
              variant="ghost"
              size="xs"
              labelVariant="body"
              onPress={handleDelete}
              icon={<Trash2 size={14} color={theme.colors.text} />}
              containerStyle={{ flex: 1 }}
            />
            <Box width={theme.spacing.s} />
            <Button
              label="Edit"
              variant="primary"
              size="xs"
              onPress={handleEdit}
              icon={<Edit size={14} color={theme.colors.textInverse} />}
              borderWidth={1}
              borderColor="primary"
              containerStyle={{ flex: 1 }}
            />
          </AnimatedBox>
        ) : null}
      </Box>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider theme={theme}>
        <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={theme.colors.background} />
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <Box
            flex={1}
            backgroundColor="background"
            paddingHorizontal="l"
            paddingTop="l"
            paddingBottom="8xl"
          >
            {showMenu ? (
              <Pressable
                onPress={() => setShowMenu(false)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                }}
              />
            ) : null}
            <Box
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              marginBottom="l"
              style={{ zIndex: 2, position: 'relative' }}
            >
              <Text variant="heading2">Team Zones</Text>
              <Box flexDirection="row" alignItems="center">
                <Box style={{ position: 'relative' }}>
                  <Button
                    iconOnly
                    accessibilityLabel="Toggle menu"
                    onPress={() => setShowMenu((prev) => !prev)}
                    variant="primary"
                    size="sm"
                    radius="m"
                    borderWidth={1}
                    borderColor="primary"
                    icon={<Menu color={theme.colors.textInverse} size={18} />}
                  />
                  {showMenu ? (
                    <Box
                      backgroundColor="card"
                      borderRadius="l"
                      borderWidth={1}
                      borderColor="borderSubtle"
                      paddingVertical="xs"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: theme.spacing.s,
                        minWidth: 200,
                        zIndex: 3,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 10,
                      }}
                    >
                      {menuItems.map((item, index) => (
                        <Pressable
                          key={item.label}
                          onPress={item.onPress}
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.85 : 1,
                          })}
                        >
                          <Box
                            flexDirection="row"
                            alignItems="center"
                            paddingHorizontal="mPlus"
                            paddingVertical="lPlus"
                            borderBottomWidth={index < menuItems.length - 1 ? 1 : 0}
                            borderBottomColor="borderSubtle"
                          >
                            {item.icon}
                            <Box width={theme.spacing.sPlus} />
                            <Text variant="subtitle">{item.label}</Text>
                          </Box>
                        </Pressable>
                      ))}
                    </Box>
                  ) : null}
                </Box>
              </Box>
            </Box>

            {zones.length === 0 ? (
              <Box flex={1} justifyContent="center" alignItems="center">
                <Text variant="heading2" color="textSecondary">
                  No zones yet
                </Text>
                <Box marginTop="xsPlus">
                  <Text variant="caption" color="muted">
                    Add your first city to see time differences.
                  </Text>
                </Box>
                <Box marginTop="sPlus">
                  <Button
                    label="Add a time zone"
                    icon={<Plus size={18} color={theme.colors.textInverse} />}
                    onPress={openAddZone}
                  />
                </Box>
              </Box>
            ) : (
              <DragList
                contentContainerStyle={{ paddingBottom: theme.spacing['5xl'] }}
                data={zones}
                keyExtractor={(item) => `${item.label}-${item.timeZone}`}
                renderItem={renderItem}
                onReordered={onReordered}
                onHoverChanged={(index) => setHoverIndex(index)}
              />
            )}

            {zones.length > 0 ? (
              <Button
                iconOnly
                accessibilityLabel="Add time zone"
                onPress={openAddZone}
                variant="primary"
                radius="xl"
                iconOnlySize={52}
                icon={<Plus size={22} color={theme.colors.textInverse} />}
                containerStyle={{
                  position: 'absolute',
                  right: theme.spacing.l,
                  bottom: theme.spacing['7xl'],
                  zIndex: 3,
                }}
                contentStyle={{
                  shadowColor: '#000',
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 12,
                }}
              />
            ) : null}

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
            <PrivacyPolicyModal
              visible={showPrivacyPolicy}
              themeMode={mode}
              onClose={() => setShowPrivacyPolicy(false)}
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
          </Box>
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
