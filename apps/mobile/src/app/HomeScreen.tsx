import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type SetStateAction,
} from 'react';
import { Animated, AppState, BackHandler, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DragList, { DragListRenderItemInfo } from 'react-native-draglist';
import { useTranslation } from 'react-i18next';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { AddZoneOverlay, ZoneDraft } from '../features/zones/components/AddZoneOverlay';
import { UserTimeBar } from '../features/zones/components/UserTimeBar';
import { PrivacyPolicyModal } from '../features/settings/components/PrivacyPolicyModal';
import { dayTagForZone, normalizeTimeZoneId } from '../features/zones/utils/timeZoneUtils';
import { Box, Button, Text } from '../theme/components';
import type { AppTheme } from '../theme/themes';
import { Plus, Menu, Edit, Trash2, Zap } from 'lucide-react-native';
import { getIntlLocale } from '../i18n/intlLocale';
import { isSupportedLanguage } from '../i18n/supportedLanguages';
import { useFlag } from '../flags';
import { FlagsDebugModal } from '../flags/debug/FlagsDebugModal';
import { useMultiTap } from '../flags/debug/useMultiTap';
import { useZones } from '../features/zones/hooks/useZones';
import type { Zone } from '../features/zones/storage/zonesRepository';
import { homeUiInitialState, homeUiReducer } from '../features/zones/ui/homeUiReducer';
import { LanguageModal } from '../features/settings/components/LanguageModal';
import { SettingsMenu } from '../features/settings/components/SettingsMenu';
import { DeleteZoneModal } from '../features/zones/components/DeleteZoneModal';

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
const STAY_ON_TAG = 'teamzones-stay-on';

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
  const { t, i18n } = useTranslation('app');
  const isDark = mode === 'dark';

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const { zones, hydrated, addZone, updateZone, deleteZone: removeZone, reorderZones } = useZones();
  const [paused, setPaused] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [, setActiveIndex] = useState<number | null>(null);
  const [, setHoverIndex] = useState<number | null>(null);
  const [actionIndex, setActionIndex] = useState<number | null>(null);
  const [exitArmed, setExitArmed] = useState(false);
  const [showFlagsDebug, setShowFlagsDebug] = useState(false);
  const [uiState, dispatchUi] = useReducer(homeUiReducer, homeUiInitialState);
  const [stayOnEnabled, setStayOnEnabled] = useState(false);
  const longPressFlag = useRef(false);
  const actionAnimRefs = useRef<Record<number, Animated.Value>>({});
  const actionVisibility = useRef<Record<number, boolean>>({});
  const exitArmedRef = useRef(false);
  const exitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rawLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0].toLowerCase();
  const selectedLanguage = isSupportedLanguage(rawLanguage) ? rawLanguage : 'en';
  const intlLocale = getIntlLocale(selectedLanguage);
  const appIsReady = hydrated && themeHydrated;
  const showForm = uiState.activeModal === 'add' || uiState.activeModal === 'edit';
  const showPrivacyPolicy = uiState.activeModal === 'privacy';
  const showLanguageModal = uiState.activeModal === 'language';
  const showMenu = uiState.menuOpen;
  const pendingDeleteIndex = uiState.deleteIndex;
  const draftIndex = uiState.editIndex;
  const debugMenuEnabled = useFlag('debugMenu');
  const stayOnFeatureEnabled = useFlag('stayOn');
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
    if (!stayOnFeatureEnabled && stayOnEnabled) {
      setStayOnEnabled(false);
    }
  }, [stayOnEnabled, stayOnFeatureEnabled]);

  useEffect(() => {
    if (!stayOnFeatureEnabled) {
      deactivateKeepAwake(STAY_ON_TAG);

      return;
    }

    if (stayOnEnabled) {
      activateKeepAwakeAsync(STAY_ON_TAG);

      return () => {
        deactivateKeepAwake(STAY_ON_TAG);
      };
    }

    deactivateKeepAwake(STAY_ON_TAG);
  }, [stayOnEnabled, stayOnFeatureEnabled]);

  useEffect(() => {
    if (!stayOnFeatureEnabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        deactivateKeepAwake(STAY_ON_TAG);
        setStayOnEnabled(false);
      }
    });

    return () => subscription.remove();
  }, [stayOnFeatureEnabled]);

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
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showForm || showPrivacyPolicy) {
        return false;
      }
      if (pendingDeleteIndex !== null) {
        dispatchUi({ type: 'CLEAR_DELETE' });
        return true;
      }
      if (showLanguageModal) {
        dispatchUi({ type: 'CLOSE_MODAL' });
        return true;
      }
      if (showMenu) {
        dispatchUi({ type: 'SET_MENU', open: false });
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

  const openAddZone = () => {
    dispatchUi({ type: 'OPEN_ADD' });
    setActionIndex(null);
  };

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  function submitZone(zone: ZoneDraft) {
    if (draftIndex === null) {
      addZone(zone);
    } else {
      updateZone(draftIndex, zone);
    }
    dispatchUi({ type: 'CLOSE_MODAL' });
    dispatchUi({ type: 'SET_EDIT_INDEX', index: null });
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
    dispatchUi({ type: 'CLOSE_MODAL' });
    dispatchUi({ type: 'SET_EDIT_INDEX', index: null });
    setActionIndex(null);
  }

  function deleteZone(index: number) {
    removeZone(index);
    setActionIndex(null);
    if (draftIndex === index) {
      dispatchUi({ type: 'SET_EDIT_INDEX', index: null });
      dispatchUi({ type: 'CLOSE_MODAL' });
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
      dispatchUi({ type: 'OPEN_EDIT', index });
      setActionIndex(null);
    };

    const handleDelete = () => {
      dispatchUi({ type: 'REQUEST_DELETE', index });
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
                onPress={() => dispatchUi({ type: 'SET_MENU', open: false })}
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
                {stayOnFeatureEnabled && stayOnEnabled ? (
                  <Box
                    padding="xs"
                    borderRadius="full"
                    backgroundColor="primarySoft"
                    borderWidth={1}
                    borderColor="primary"
                    marginRight="s"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Zap size={14} color={theme.colors.primary} />
                  </Box>
                ) : null}
                <Box style={{ position: 'relative' }}>
                  <Button
                    iconOnly
                    accessibilityLabel={t('accessibility.menuToggle')}
                    onPress={() => dispatchUi({ type: 'TOGGLE_MENU' })}
                    variant="primary"
                    size="sm"
                    radius="m"
                    borderWidth={1}
                    borderColor="primary"
                    icon={<Menu color={theme.colors.textInverse} size={18} />}
                  />
                  <SettingsMenu
                    visible={showMenu}
                    isDark={isDark}
                    onAddZone={openAddZone}
                    showStayOn={stayOnFeatureEnabled}
                    stayOnEnabled={stayOnEnabled}
                    onToggleStayOn={() => setStayOnEnabled((prev) => !prev)}
                    onToggleTheme={toggleTheme}
                    onOpenLanguage={() => dispatchUi({ type: 'OPEN_LANGUAGE' })}
                    onOpenPrivacy={() => dispatchUi({ type: 'OPEN_PRIVACY' })}
                  />
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
            <DeleteZoneModal
              pendingIndex={pendingDeleteIndex}
              zones={zones}
              onConfirm={deleteZone}
              onCancel={() => dispatchUi({ type: 'CLEAR_DELETE' })}
            />
            {showLanguageModal ? (
              <LanguageModal onClose={() => dispatchUi({ type: 'CLOSE_MODAL' })} />
            ) : null}
            <FlagsDebugModal visible={showFlagsDebug} onClose={() => setShowFlagsDebug(false)} />

            <AddZoneOverlay
              visible={showForm}
              usedTimeZones={usedTimeZones}
              existingZones={zones}
              initialValue={draftIndex !== null ? zones[draftIndex] : undefined}
              mode={draftIndex !== null ? 'edit' : 'add'}
              onSelectExisting={(index) => {
                dispatchUi({ type: 'SET_EDIT_INDEX', index });
                setActionIndex(null);
              }}
              onReturnToAdd={() => {
                dispatchUi({ type: 'SET_EDIT_INDEX', index: null });
              }}
              startedInEdit={uiState.activeModal === 'edit'}
              onSubmit={submitZone}
              onSubmitAtStart={submitZoneAtStart}
              onClose={() => {
                dispatchUi({ type: 'CLOSE_MODAL' });
                dispatchUi({ type: 'SET_EDIT_INDEX', index: null });
                longPressFlag.current = false;
              }}
            />
            <PrivacyPolicyModal
              visible={showPrivacyPolicy}
              themeMode={mode}
              onClose={() => dispatchUi({ type: 'CLOSE_MODAL' })}
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
