import React from 'react';
import { ActivityIndicator, GestureResponderEvent, TouchableOpacity } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { createBox, createText, useTheme } from '@shopify/restyle';
import type { AppTheme } from './themes';

export const Box = createBox<AppTheme>();
export const Text = createText<AppTheme>();

type ButtonVariant = 'primary' | 'ghost';
type ButtonSize = 'xs' | 'sm' | 'md';
type ButtonAlignment = 'center' | 'left';
type ButtonLabelVariant = keyof AppTheme['textVariants'];
type ButtonRadius = keyof AppTheme['borderRadii'];
type ButtonColor = keyof AppTheme['colors'];

type ButtonBaseProps = {
  onPress?: (event: GestureResponderEvent) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  radius?: ButtonRadius;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  iconOnlySize?: number;
  align?: ButtonAlignment;
  labelVariant?: ButtonLabelVariant;
  labelColor?: ButtonColor;
  backgroundColor?: ButtonColor;
  borderColor?: ButtonColor;
  borderWidth?: number;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  disabledOpacity?: number;
};

type ButtonProps =
  | (ButtonBaseProps & {
      label: string;
      iconOnly?: false;
      accessibilityLabel?: string;
    })
  | (ButtonBaseProps & {
      label?: string;
      iconOnly: true;
      accessibilityLabel: string;
    });

const buttonSizes: Record<
  ButtonSize,
  {
    paddingVertical: keyof AppTheme['spacing'];
    paddingHorizontal: keyof AppTheme['spacing'];
    borderRadius: keyof AppTheme['borderRadii'];
    iconOnlySize: number;
  }
> = {
  xs: {
    paddingVertical: 's',
    paddingHorizontal: 'm',
    borderRadius: 's',
    iconOnlySize: 32,
  },
  sm: {
    paddingVertical: 'sPlus',
    paddingHorizontal: 'm',
    borderRadius: 'l',
    iconOnlySize: 36,
  },
  md: {
    paddingVertical: 'm',
    paddingHorizontal: 'l',
    borderRadius: 'xl',
    iconOnlySize: 44,
  },
};

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  radius,
  disabled,
  loading,
  fullWidth,
  icon,
  iconPosition = 'left',
  iconOnly = false,
  iconOnlySize,
  align = 'center',
  labelVariant = 'buttonLabel',
  labelColor,
  backgroundColor,
  borderColor,
  borderWidth,
  containerStyle,
  contentStyle,
  disabledOpacity = 0.6,
  accessibilityLabel,
}) => {
  const theme = useTheme<AppTheme>();
  const isDisabled = disabled || loading;
  const sizeConfig = buttonSizes[size];
  const showLabel = Boolean(label);
  const iconGap = showLabel ? 's' : 'none';

  const resolvedBackgroundColor: keyof AppTheme['colors'] =
    backgroundColor ?? (variant === 'primary' ? 'primary' : 'transparent');

  const resolvedBorderColor: keyof AppTheme['colors'] =
    borderColor ?? (variant === 'primary' ? 'primary' : 'borderSubtle');

  const resolvedBorderWidth = borderWidth ?? (variant === 'ghost' ? 1 : 0);

  const textColorKey: keyof AppTheme['colors'] =
    labelColor ?? (variant === 'primary' ? 'textInverse' : 'text');

  const textColor = theme.colors[textColorKey];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        {
          opacity: isDisabled ? disabledOpacity : 1,
          width: fullWidth ? '100%' : undefined,
        },
        containerStyle,
      ]}
    >
      <Box
        paddingVertical={iconOnly ? 'none' : sizeConfig.paddingVertical}
        paddingHorizontal={iconOnly ? 'none' : sizeConfig.paddingHorizontal}
        borderRadius={radius ?? sizeConfig.borderRadius}
        backgroundColor={resolvedBackgroundColor}
        borderWidth={resolvedBorderWidth}
        borderColor={resolvedBorderColor}
        alignItems="center"
        justifyContent={align === 'left' ? 'flex-start' : 'center'}
        flexDirection="row"
        style={[
          iconOnly
            ? {
                width: iconOnlySize ?? sizeConfig.iconOnlySize,
                height: iconOnlySize ?? sizeConfig.iconOnlySize,
              }
            : null,
          contentStyle,
        ]}
      >
        {icon && iconPosition === 'left' ? (
          <Box marginRight={iconGap} alignItems="center" justifyContent="center">
            {icon}
          </Box>
        ) : null}
        {loading && (
          <Box marginRight={iconGap}>
            <ActivityIndicator color={textColor} />
          </Box>
        )}
        {showLabel ? (
          <Text variant={labelVariant} style={{ color: textColor }}>
            {label}
          </Text>
        ) : null}
        {icon && iconPosition === 'right' ? (
          <Box marginLeft={iconGap} alignItems="center" justifyContent="center">
            {icon}
          </Box>
        ) : null}
      </Box>
    </TouchableOpacity>
  );
};
