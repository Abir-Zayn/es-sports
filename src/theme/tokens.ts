export type Palette = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  /** Cyan that stays readable as text or a link on `background`. */
  link: string;
  live: string;
  accent: string;
  danger: string;
  overlay: string;
};

const dark: Palette = {
  background: '#0B1410',
  surface: '#14211A',
  surfaceRaised: '#1C2D24',
  border: '#2A3F33',
  text: '#F2F7F4',
  textMuted: '#8FA69A',
  primary: '#19BFFF',
  primaryText: '#04121A',
  link: '#19BFFF',
  live: '#E5243B',
  accent: '#F5B83D',
  danger: '#EF4444',
  overlay: 'rgba(11, 20, 16, 0.85)',
};

const light: Palette = {
  background: '#F2F5F4',
  surface: '#E7EDEA',
  surfaceRaised: '#DAE3DF',
  border: '#BFCBC5',
  text: '#0B1410',
  textMuted: '#4F6258',
  primary: '#19BFFF',
  primaryText: '#04121A',
  link: '#0A72A8',
  live: '#E5243B',
  accent: '#B7791F',
  danger: '#C62828',
  overlay: 'rgba(242, 245, 244, 0.85)',
};

export const palettes = { dark, light } as const;

export type ColorScheme = keyof typeof palettes;
export type ThemePreference = ColorScheme | 'system';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sizes = { control: 52, field: 58, icon: 22, hitSlop: 12 } as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;
