import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { Animated, BackHandler, Dimensions, Easing, Image, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { useTranslation } from 'react-i18next';

import { AddZoneOverlay, ZoneDraft } from '../features/zones/components/AddZoneOverlay';
import { UserTimeBar } from '../features/zones/components/UserTimeBar';
import { PrivacyPolicyModal } from '../features/settings/components/PrivacyPolicyModal';
import { dayTagForZone, normalizeTimeZoneId } from '../features/zones/utils/timeZoneUtils';
import { Box, Button, Text } from '../theme/components';
import type { AppTheme } from '../theme/themes';
import {
  FileText,
  Plus,
  Sun,
  Moon,
  Menu,
  Edit,
  Trash2,
  X,
  Languages,
  Check,
} from 'lucide-react-native';
import { getIntlLocale } from '../i18n/intlLocale';
import { isSupportedLanguage } from '../i18n/supportedLanguages';
import { useFlag } from '../flags';
import { FlagsDebugModal } from '../flags/debug/FlagsDebugModal';
import { useMultiTap } from '../flags/debug/useMultiTap';
import { useZones } from '../features/zones/hooks/useZones';
import type { Zone } from '../features/zones/storage/zonesRepository';

type ZoneGroup = Zone;

type DayBadgeTag = 'yday' | 'today' | 'tomo';

type HomeScreenProps = {
  theme: AppTheme;
  mode: 'light' | 'dark';
  themeHydrated: boolean;
  setMode: (value: SetStateAction<'light' | 'dark'>) => void;
};

const AnimatedBox = Animated.createAnimatedComponent(Box);
const SPLASH_BACKGROUND = '#080D1D';
const splashImage = require('../../assets/splash-icon.png');

const timeFormatter = (locale: string, tz: string) =>
  new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: normalizeTimeZoneId(tz),
  });

function formatWeekday(now: Date, zoneTimeZone: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    timeZone: normalizeTimeZoneId(zoneTimeZone),
  }).format(now);
}

function formatZone(now: Date, zone: ZoneGroup, deviceTimeZone: string, locale: string) {
  const time = timeFormatter(locale, zone.timeZone).format(now);
  const weekday = formatWeekday(now, zone.timeZone, locale);
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

export function HomeScreen({ theme, mode, themeHydrated, setMode }: HomeScreenProps) {
  const LANGUAGE_STORAGE_KEY = 'teamzones:language:v1';
  const { t, i18n } = useTranslation('app');
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom;
  const topInset = insets.top;
  const isDark = mode === 'dark';

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const {
    zones,
    hydrated,
    addZone,
    updateZone,
    deleteZone: removeZone,
    reorderZones,
  } = useZones();
  const [showForm, setShowForm] = useState(false);
  const [paused, setPaused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleteModalRendered, setDeleteModalRendered] = useState(false);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);
  const [formOrigin, setFormOrigin] = useState<'add' | 'edit'>('add');
  const [exitArmed, setExitArmed] = useState(false);
  const [showFlagsDebug, setShowFlagsDebug] = useState(false);
  const longPressFlag = useRef(false);
  const actionAnimRefs = useRef<Record<number, Animated.Value>>({});
  const actionVisibility = useRef<Record<number, boolean>>({});
  const exitArmedRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deleteModalAnimation = useRef(new Animated.Value(0)).current;
  const rawLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0].toLowerCase();
  const selectedLanguage = isSupportedLanguage(rawLanguage) ? rawLanguage : 'en';
  const intlLocale = getIntlLocale(selectedLanguage);
  const appIsReady = hydrated && themeHydrated;
  const debugMenuEnabled = useFlag('debugMenu');
  const allowFlagsDebug = __DEV__ || debugMenuEnabled;
  const handleFlagsDebugTrigger = useCallback(() => {
    if (allowFlagsDebug) {
      setShowFlagsDebug(true);
    }
  }, [allowFlagsDebug]);
  const handleTitleTap = useMultiTap({
    taps: 7,
    windowMs: 3000,
    onTrigger: handleFlagsDebugTrigger,
  });

  useEffect(() => {
    if (paused) return;
    setCurrentTime(new Date());
    const id = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (showForm || showPrivacyPolicy) {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
      exitArmedRef.current = false;
      setExitArmed(false);
    }
  }, [showForm, showPrivacyPolicy]);

  useEffect(() => {
    if (pendingDeleteIndex !== null) {
      setDeleteIndex(pendingDeleteIndex);
      setDeleteModalRendered(true);
      Animated.timing(deleteModalAnimation, {
        toValue: 1,
        duration: 200,
        easing: Easing.inOut(Easing.circle),
        useNativeDriver: true,
      }).start();
      return;
    }

    Animated.timing(deleteModalAnimation, {
      toValue: 0,
      duration: 260,
      easing: Easing.inOut(Easing.circle),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDeleteModalRendered(false);
        setDeleteIndex(null);
      }
    });
  }, [deleteModalAnimation, pendingDeleteIndex]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showForm || showPrivacyPolicy) {
        return false;
      }
      if (pendingDeleteIndex !== null) {
        setPendingDeleteIndex(null);
        return true;
      }
      if (showLanguageModal) {
        setShowLanguageModal(false);
        return true;
      }
      if (showMenu) {
        setShowMenu(false);
        return true;
      }
      if (exitArmedRef.current) {
        BackHandler.exitApp();
        return true;
      }
      exitArmedRef.current = true;
      setExitArmed(true);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
      exitTimeoutRef.current = setTimeout(() => {
        exitArmedRef.current = false;
        setExitArmed(false);
        exitTimeoutRef.current = null;
      }, 2000);
      return true;
    });
    return () => subscription.remove();
  }, [pendingDeleteIndex, showForm, showLanguageModal, showPrivacyPolicy, showMenu]);

  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  const deviceTimeZone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const usedTimeZones = useMemo(() => zones.map((z) => normalizeTimeZoneId(z.timeZone)), [zones]);
  const deleteModalOffset = Dimensions.get('window').height;

  const deleteBackdropOpacity = deleteModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const deleteModalTranslateY = deleteModalAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [deleteModalOffset, 0],
  });

  const openAddZone = () => {
    setFormOrigin('add');
    setShowMenu(false);
    setDraftIndex(null);
    setActionIndex(null);
    setShowForm(true);
  };

  const languageOptions = [
    { value: 'en', label: 'English', flag: '🇬🇧' },
    { value: 'pl', label: 'Polski', flag: '🇵🇱' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
  ];
  const selectedLanguageOption =
    languageOptions.find((option) => option.value === selectedLanguage) ?? languageOptions[0];

  const handleLanguageSelect = (language: string) => {
    setShowLanguageModal(false);
    if (language !== selectedLanguage) {
      i18n.changeLanguage(language).catch((error) => {
        console.warn('Failed to change language', error);
      });
    }
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language).catch((error) => {
      console.warn('Failed to persist language selection', error);
    });
  };

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const menuItems = [
    {
      label: t('menu.addZone'),
      subLabel: undefined,
      icon: <Plus size={18} color={theme.colors.text} />,
      onPress: () => {
        setShowMenu(false);
        openAddZone();
      },
    },
    {
      label: isDark ? t('menu.lightTheme') : t('menu.darkTheme'),
      subLabel: undefined,
      icon: isDark ? (
        <Sun size={18} color={theme.colors.text} />
      ) : (
        <Moon size={18} color={theme.colors.text} />
      ),
      onPress: () => {
        toggleTheme();
      },
    },
    {
      label: t('menu.language'),
      subLabel: selectedLanguageOption
        ? `${selectedLanguageOption.flag} ${selectedLanguageOption.label}`
        : undefined,
      icon: <Languages size={18} color={theme.colors.text} />,
      onPress: () => {
        setShowMenu(false);
        setShowLanguageModal(true);
      },
    },
    {
      label: t('menu.privacy'),
      subLabel: undefined,
      icon: <FileText size={18} color={theme.colors.text} />,
      onPress: () => {
        setShowMenu(false);
        setShowPrivacyPolicy(true);
      },
    },
  ];

  function submitZone(zone: ZoneDraft) {
    if (draftIndex === null) {
      addZone(zone);
    } else {
      updateZone(draftIndex, zone);
    }
    setShowForm(false);
    setDraftIndex(null);
    setActionIndex(null);
  }

  function submitZoneAtStart(zone: ZoneDraft) {
    if (draftIndex === null) {
      const fromIndex = zones.length;
      addZone(zone);
      reorderZones(fromIndex, 0);
    } else {
      updateZone(draftIndex, zone);
    }
    setShowForm(false);
    setDraftIndex(null);
    setActionIndex(null);
  }

  function deleteZone(index: number) {
    removeZone(index);
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
    reorderZones(from, to);
  }

  function renderItem({
    item,
    onDragStart,
    onDragEnd,
    isActive,
    index,
  }: DragListRenderItemInfo<ZoneGroup>) {
    const info = formatZone(currentTime, item, deviceTimeZone, intlLocale);
    const showActions = actionIndex === index && !isActive;
    const actionAnimation =
      actionAnimRefs.current[index] || (actionAnimRefs.current[index] = new Animated.Value(0));

    const handlePress = () => {
      if (longPressFlag.current) {
        longPressFlag.current = false;
        return;
      }
      setActionIndex((prev) => (prev === index ? null : index));
    };

    const handleEdit = () => {
      setFormOrigin('edit');
      setDraftIndex(index);
      setShowForm(true);
      setActionIndex(null);
    };

    const handleDelete = () => {
      setPendingDeleteIndex(index);
    };

    const wasVisible = actionVisibility.current[index] || false;
    if (showActions && !wasVisible) {
      actionVisibility.current[index] = true;
      actionAnimation.setValue(0);
      Animated.timing(actionAnimation, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }).start();
    } else if (!showActions && wasVisible) {
      actionVisibility.current[index] = false;
      actionAnimation.setValue(0);
    }

    const actionStyle = {
      opacity: actionAnimation,
      transform: [
        {
          translateY: actionAnimation.interpolate({ inputRange: [0, 1], outputRange: [-8, 0] }),
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
              <Box flex={1} marginRight="s">
                <Text variant="subtitle" color="textSecondary" numberOfLines={2}>
                  {item.label}
                </Text>
              </Box>
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
              <Box flex={1} alignItems="flex-end" marginLeft="m">
                {item.members && item.members.length > 0 ? (
                  <Text
                    variant="body"
                    color="textSecondary"
                    numberOfLines={2}
                    style={{ textAlign: 'right' }}
                  >
                    {item.members.join(' • ')}
                  </Text>
                ) : (
                  <Text
                    variant="caption"
                    color="muted"
                    numberOfLines={2}
                    style={{ textAlign: 'right' }}
                  >
                    {t('members.empty')}
                  </Text>
                )}
              </Box>
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
              label={t('actions.delete')}
              variant="ghost"
              size="xs"
              labelVariant="body"
              onPress={handleDelete}
              icon={<Trash2 size={14} color={theme.colors.text} />}
              containerStyle={{ flex: 1 }}
            />
            <Box width={theme.spacing.s} />
            <Button
              label={t('actions.edit')}
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
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={appIsReady ? theme.colors.background : SPLASH_BACKGROUND}
      />
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: appIsReady ? theme.colors.background : SPLASH_BACKGROUND,
        }}
      >
        {appIsReady ? (
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
              <Text variant="heading2" onPress={handleTitleTap} suppressHighlighting>
                {t('title')}
              </Text>
              <Box flexDirection="row" alignItems="center">
                <Box style={{ position: 'relative' }}>
                  <Button
                    iconOnly
                    accessibilityLabel={t('accessibility.menuToggle')}
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
                            style={{ minWidth: 0 }}
                          >
                            {item.icon}
                            <Box width={theme.spacing.sPlus} />
                            <Box style={{ minWidth: 0, flexShrink: 1 }}>
                              <Text variant="menuItem" style={{ flexShrink: 1 }}>
                                {item.label}
                              </Text>
                              {item.subLabel ? (
                                <Text
                                  variant="caption"
                                  color="muted"
                                  marginTop="xs"
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {item.subLabel}
                                </Text>
                              ) : null}
                            </Box>
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
                  {t('empty.title')}
                </Text>
                <Box marginTop="xsPlus">
                  <Text variant="caption" color="muted">
                    {t('empty.subtitle')}
                  </Text>
                </Box>
                <Box marginTop="sPlus">
                  <Button
                    label={t('empty.cta')}
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
                accessibilityLabel={t('accessibility.addTimeZone')}
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
            {exitArmed ? (
              <Box
                position="absolute"
                left={theme.spacing.l}
                right={theme.spacing.l}
                bottom={theme.spacing['6xl']}
                zIndex={2}
                pointerEvents="none"
                alignItems="center"
              >
                <Box
                  paddingHorizontal="m"
                  paddingVertical="sPlus"
                  borderRadius="l"
                  backgroundColor="card"
                  borderWidth={1}
                  borderColor="borderSubtle"
                  style={{
                    shadowColor: '#000',
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }}
                >
                  <Text variant="caption" color="textSecondary">
                    {t('exitPrompt')}
                  </Text>
                </Box>
              </Box>
            ) : null}
            {deleteModalRendered ? (
              <Pressable
                onPress={() => setPendingDeleteIndex(null)}
                style={{
                  position: 'absolute',
                  top: -topInset,
                  left: 0,
                  right: 0,
                  bottom: -bottomInset,
                  zIndex: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: topInset,
                  paddingBottom: bottomInset,
                }}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.overlay,
                    opacity: deleteBackdropOpacity,
                  }}
                />
                <Animated.View
                  style={{
                    width: '100%',
                    transform: [{ translateY: deleteModalTranslateY }],
                  }}
                >
                  <Pressable
                    onPress={() => {}}
                    style={({ pressed }) => ({ opacity: pressed ? 0.98 : 1, width: '100%' })}
                  >
                    <Box
                      marginHorizontal="l"
                      backgroundColor="card"
                      borderRadius="l"
                      borderWidth={1}
                      borderColor="borderSubtle"
                      padding="l"
                      style={{
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 6 },
                        elevation: 10,
                      }}
                    >
                      <Text variant="heading2" color="text">
                        {t('delete.title')}
                      </Text>
                      <Box marginTop="xsPlus">
                        <Text variant="body" color="textSecondary" marginVertical="l">
                          {t('delete.body', {
                            label: zones[deleteIndex ?? -1]?.label ?? t('delete.fallback'),
                          })}
                        </Text>
                      </Box>
                      <Box marginTop="m" flexDirection="row" justifyContent="flex-end">
                        <Box marginRight="m">
                          <Button
                            label={t('delete.cancel')}
                            variant="ghost"
                            size="sm"
                            onPress={() => setPendingDeleteIndex(null)}
                            icon={<X size={14} color={theme.colors.text} />}
                          />
                        </Box>
                        <Button
                          label={t('delete.confirm')}
                          size="sm"
                          onPress={() => {
                            if (deleteIndex !== null) {
                              deleteZone(deleteIndex);
                              setPendingDeleteIndex(null);
                            }
                          }}
                          backgroundColor="danger"
                          borderColor="danger"
                          icon={<Trash2 size={14} color={theme.colors.textInverse} />}
                        />
                      </Box>
                    </Box>
                  </Pressable>
                </Animated.View>
              </Pressable>
            ) : null}
            {showLanguageModal ? (
              <Pressable
                onPress={() => setShowLanguageModal(false)}
                style={{
                  position: 'absolute',
                  top: -topInset,
                  left: 0,
                  right: 0,
                  bottom: -bottomInset,
                  zIndex: 4,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingTop: topInset,
                  paddingBottom: bottomInset,
                }}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: theme.colors.overlay,
                    opacity: 1,
                  }}
                />
                <Pressable onPress={() => {}} style={{ minWidth: 250, alignSelf: 'center' }}>
                  <Box
                    marginHorizontal="l"
                    backgroundColor="card"
                    borderRadius="l"
                    borderWidth={1}
                    borderColor="borderSubtle"
                    padding="l"
                    style={{
                      shadowColor: '#000',
                      shadowOpacity: 0.2,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 10,
                    }}
                  >
                    <Text variant="heading2" color="text">
                      {t('menu.language')}
                    </Text>
                    <Box marginTop="m">
                      {languageOptions.map((option) => {
                        const isSelected = option.value === selectedLanguage;
                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => handleLanguageSelect(option.value)}
                            style={({ pressed }) => ({
                              opacity: pressed ? 0.85 : 1,
                            })}
                          >
                            <Box
                              flexDirection="row"
                              justifyContent="space-between"
                              alignItems="center"
                              paddingVertical="m"
                              backgroundColor="card"
                            >
                              <Box flexDirection="row" alignItems="center">
                                <Text variant="body" color="textSecondary" marginEnd="m">
                                  {option.flag}
                                </Text>
                                <Text variant="body" color="textSecondary" numberOfLines={1}>
                                  {option.label}
                                </Text>
                              </Box>
                              {isSelected ? (
                                <Box
                                  width={24}
                                  height={24}
                                  borderRadius="full"
                                  alignItems="center"
                                  justifyContent="center"
                                  backgroundColor="primary"
                                  marginStart="xl"
                                >
                                  <Check size={14} color={theme.colors.textInverse} />
                                </Box>
                              ) : null}
                            </Box>
                          </Pressable>
                        );
                      })}
                    </Box>
                  </Box>
                </Pressable>
              </Pressable>
            ) : null}
            <FlagsDebugModal visible={showFlagsDebug} onClose={() => setShowFlagsDebug(false)} />

            <AddZoneOverlay
              visible={showForm}
              usedTimeZones={usedTimeZones}
              existingZones={zones}
              initialValue={draftIndex !== null ? zones[draftIndex] : undefined}
              mode={draftIndex !== null ? 'edit' : 'add'}
              onSelectExisting={(index) => {
                setDraftIndex(index);
                setActionIndex(null);
                setShowForm(true);
              }}
              onReturnToAdd={() => {
                setDraftIndex(null);
              }}
              startedInEdit={formOrigin === 'edit'}
              onSubmit={submitZone}
              onSubmitAtStart={submitZoneAtStart}
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
        ) : (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Image source={splashImage} resizeMode="contain" style={{ width: 220, height: 220 }} />
          </Box>
        )}
      </SafeAreaView>
    </>
  );
}
