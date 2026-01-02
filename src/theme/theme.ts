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
    background: '#0b132b',
    backgroundAlt: '#0e152a',
    card: '#1c2541',
    cardHover: '#23304f',
    primary: '#5f0f40',
    primarySoft: '#3d5a80',
    primaryStrong: '#3d5a80',
    accent: '#98c1d9',
    text: '#ffffff',
    textSecondary: '#e0fbfc',
    muted: '#6b7a99',
    textInverse: '#ffffff',
    borderSubtle: 'rgba(255,255,255,0.08)',
    cardBorderActive: '#3d5a80',
    cardBorderHover: '#98c1d9',
    cardBorderArmed: '#e07a5f',
    badgeYesterday: '#0e152a',
    badgeToday: '#3d5a80',
    badgeTomorrow: '#e07a5f',
    danger: '#e07a5f',
    success: '#4ade80',
    overlay: 'rgba(0,0,0,0.35)',
    transparent: 'transparent',
  },
});

export type Theme = typeof baseTheme;
