import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { FileText, Plus, Sun, Moon, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import type { AppTheme } from '../../../theme/themes';
import { Box, Text } from '../../../theme/components';
import { getLanguageOption } from '../utils/languageOptions';

type SettingsMenuProps = {
  visible: boolean;
  isDark: boolean;
  onAddZone: () => void;
  onToggleTheme: () => void;
  onOpenLanguage: () => void;
  onOpenPrivacy: () => void;
};

type MenuItem = {
  label: string;
  subLabel?: string;
  icon: ReactNode;
  onPress: () => void;
};

export function SettingsMenu({
  visible,
  isDark,
  onAddZone,
  onToggleTheme,
  onOpenLanguage,
  onOpenPrivacy,
}: SettingsMenuProps) {
  const { t, i18n } = useTranslation('app');
  const theme = useTheme<AppTheme>();
  const rawLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0].toLowerCase();
  const selectedOption = getLanguageOption(rawLanguage);

  const menuItems = useMemo<MenuItem[]>(
    () => [
      {
        label: t('menu.addZone'),
        subLabel: undefined,
        icon: <Plus size={18} color={theme.colors.text} />,
        onPress: onAddZone,
      },
      {
        label: isDark ? t('menu.lightTheme') : t('menu.darkTheme'),
        subLabel: undefined,
        icon: isDark ? (
          <Sun size={18} color={theme.colors.text} />
        ) : (
          <Moon size={18} color={theme.colors.text} />
        ),
        onPress: onToggleTheme,
      },
      {
        label: t('menu.language'),
        subLabel: selectedOption ? `${selectedOption.flag} ${selectedOption.label}` : undefined,
        icon: <Languages size={18} color={theme.colors.text} />,
        onPress: onOpenLanguage,
      },
      {
        label: t('menu.privacy'),
        subLabel: undefined,
        icon: <FileText size={18} color={theme.colors.text} />,
        onPress: onOpenPrivacy,
      },
    ],
    [
      isDark,
      onAddZone,
      onOpenLanguage,
      onOpenPrivacy,
      onToggleTheme,
      selectedOption,
      t,
      theme.colors.text,
    ],
  );

  if (!visible) {
    return null;
  }

  return (
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
  );
}
