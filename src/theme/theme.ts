import { createTheme } from '@shopify/restyle';

export const spacing = {
  none: 0,
  xs: 4,
  xsPlus: 6,
  s: 8,
  sPlus: 10,
  m: 12,
  mPlus: 14,
  l: 16,
  lPlus: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 68,
  '6xl': 96,
  '7xl': 132,
  '8xl': 168,
};

export const radii = {
  xs: 4,
  s: 8,
  m: 10,
  l: 12,
  xl: 18,
  '2xl': 24,
  full: 999,
};

export const textVariants = {
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    color: 'text' as const,
  },
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
    color: 'text' as const,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'textSecondary' as const,
  },
  menuItem: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'textSecondary' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: 'text' as const,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: 'muted' as const,
    letterSpacing: 0.2,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    color: 'text' as const,
  },
  time: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: 1,
    color: 'text' as const,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.4,
    color: 'textInverse' as const,
  },
};

export const baseTheme = createTheme({
  spacing,
  borderRadii: radii,
  textVariants,
  colors: {
    background: '#080D1D',
    backgroundAlt: '#161B30',
    card: '#1E253B',
    cardHover: '#0A1430',
    primary: '#107FA8',
    primarySoft: '#e3f1f621',
    accent: '#5C0076',
    text: '#EFFBFF',
    textSecondary: '#C4D4DA',
    muted: '#9FB3D9',
    textInverse: '#EFFBFF',
    borderSubtle: '#2C3551',
    cardBorderActive: '#165F7A',
    badgeYesterday: '#424B67',
    badgeToday: '#5C0076',
    badgeTomorrow: '#080D1D',
    danger: '#C80071',
    success: '#2FE7A8',
    overlay: 'rgba(1,4,21,0.55)',
    transparent: 'transparent',
  },
});

export type Theme = typeof baseTheme;
