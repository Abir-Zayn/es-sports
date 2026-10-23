export type Palette = {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  /** Dashed outlines, e.g. the "Join a team" circle. */
  outline: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  /** Tinted fill behind primary-coloured content, e.g. a date block. */
  primarySoft: string;
  /** Darker cyan for artwork bands. */
  primaryDeep: string;
  /** Cyan that stays readable as text or a link on `background`. */
  link: string;
  live: string;
  /** Text and dot colour on top of `live`. */
  onLive: string;
  accent: string;
  accentSoft: string;
  danger: string;
  dangerSoft: string;
  dangerSoftText: string;
  overlay: string;
};

const dark: Palette = {
  background: '#0A0E0D',
  surface: '#141A18',
  surfaceRaised: '#1C2421',
  border: '#222B28',
  outline: '#3A4642',
  text: '#F2F5F3',
  textMuted: '#9AA6A1',
  primary: '#19BFFF',
  primaryText: '#04121A',
  primarySoft: '#0A2433',
  primaryDeep: '#0B6E99',
  link: '#19BFFF',
  live: '#FF4D4D',
  onLive: '#FFFFFF',
  accent: '#FFC83D',
  accentSoft: '#3A2F12',
  danger: '#EF4444',
  dangerSoft: '#3A1A1A',
  dangerSoftText: '#FF8A8A',
  overlay: 'rgba(10, 14, 13, 0.85)',
};

const light: Palette = {
  background: '#F2F5F4',
  surface: '#E7EDEA',
  surfaceRaised: '#DAE3DF',
  border: '#BFCBC5',
  outline: '#9FB0A8',
  text: '#0B1410',
  textMuted: '#4F6258',
  primary: '#19BFFF',
  primaryText: '#04121A',
  primarySoft: '#D5ECF8',
  primaryDeep: '#0B6E99',
  link: '#0A72A8',
  live: '#E5243B',
  onLive: '#FFFFFF',
  accent: '#8A5A00',
  accentSoft: '#F6E7C0',
  danger: '#C62828',
  dangerSoft: '#F6D5D5',
  dangerSoftText: '#9B1C1C',
  overlay: 'rgba(242, 245, 244, 0.85)',
};

export const palettes = { dark, light } as const;

/** Colour family for tinted avatars. */
export type AvatarTone = 'blue' | 'yellow' | 'neutral';

export type ColorScheme = keyof typeof palettes;
export type ThemePreference = ColorScheme | 'system';

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sizes = { control: 52, field: 58, icon: 22, hitSlop: 12, gutter: 20, sectionGap: 30 } as const;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;
