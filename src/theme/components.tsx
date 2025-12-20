import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  TouchableOpacity,
} from 'react-native';
import {
  createBox,
  createText,
  useTheme,
} from '@shopify/restyle';
import type { AppTheme } from './themes';

export const Box = createBox<AppTheme>();
export const Text = createText<AppTheme>();

type ButtonVariant = 'primary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  fullWidth,
  icon,
  iconPosition = 'left',
}) => {
  const theme = useTheme<AppTheme>();
  const isDisabled = disabled || loading;

  const backgroundColor: keyof AppTheme['colors'] =
    variant === 'primary' ? 'primary' : 'transparent';

  const borderColor: keyof AppTheme['colors'] =
    variant === 'primary' ? 'primaryStrong' : 'borderSubtle';

  const textColorKey: keyof AppTheme['colors'] =
    variant === 'primary' ? 'textInverse' : 'text';

  const textColor = theme.colors[textColorKey];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      style={{
        opacity: isDisabled ? 0.6 : 1,
        width: fullWidth ? '100%' : undefined,
      }}
    >
      <Box
        paddingVertical="m"
        paddingHorizontal="l"
        borderRadius="xl"
        backgroundColor={backgroundColor}
        borderWidth={variant === 'ghost' ? 1 : 0}
        borderColor={borderColor}
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
      >
        {icon && iconPosition === 'left' ? (
          <Box marginRight="s" alignItems="center" justifyContent="center">
            {icon}
          </Box>
        ) : null}
        {loading && (
          <Box marginRight="s">
            <ActivityIndicator color={textColor} />
          </Box>
        )}
        <Text variant="buttonLabel" style={{ color: textColor }}>
          {label}
        </Text>
        {icon && iconPosition === 'right' ? (
          <Box marginLeft="s" alignItems="center" justifyContent="center">
            {icon}
          </Box>
        ) : null}
      </Box>
    </TouchableOpacity>
  );
};
