import { baseTheme } from './theme';

export const darkTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
  },
};

export const lightTheme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: '#F4F7FB',
    backgroundAlt: '#E8EDF6',
    card: '#FFFFFF',
    cardHover: '#F1F4FA',
    primary: '#107FA8',
    primarySoft: '#E3F1F6',
    accent: '#5C0076',
    text: '#0A1430',
    textSecondary: '#2C3A5A',
    muted: '#5E6B8A',
    textInverse: '#EFFBFF',
    borderSubtle: '#CBD4E4',
    cardBorderActive: '#107FA8',
    badgeYesterday: '#6a738fff',
    badgeToday: '#7A4A91',
    badgeTomorrow: '#414b6dff',
    danger: '#C80071',
    success: '#0F9D72',
    overlay: 'rgba(10,20,48,0.12)',
    transparent: 'transparent',
  },
};

export type AppTheme = typeof darkTheme;
