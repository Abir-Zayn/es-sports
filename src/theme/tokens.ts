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
  background: '#1A1E2E',
  surface: '#20263A',
  surfaceRaised: '#262F45',
  border: '#2E3650',
  outline: '#64748B',
  text: '#F8FAFC',
  textMuted: '#A8B6CA',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  primarySoft: '#1E355A',
  primaryDeep: '#1D4ED8',
  link: '#93C5FD',
  live: '#FF4D4D',
  onLive: '#FFFFFF',
  accent: '#EAB308',
  accentSoft: '#403619',
  danger: '#EF4444',
  dangerSoft: '#3A1A1A',
  dangerSoftText: '#FF8A8A',
  overlay: 'rgba(26, 30, 46, 0.85)',
};

const light: Palette = {
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceRaised: '#E5ECF6',
  border: '#CBD5E1',
  outline: '#94A3B8',
  text: '#172033',
  textMuted: '#475569',
  primary: '#2563EB',
  primaryText: '#FFFFFF',
  primarySoft: '#DBEAFE',
  primaryDeep: '#1D4ED8',
  link: '#1D4ED8',
  live: '#E5243B',
  onLive: '#FFFFFF',
  accent: '#8A5A00',
  accentSoft: '#F6E7C0',
  danger: '#C62828',
  dangerSoft: '#F6D5D5',
  dangerSoftText: '#9B1C1C',
  overlay: 'rgba(241, 245, 249, 0.85)',
};

export const palettes = { dark, light } as const;

/** Colour family for tinted avatars. */
export type AvatarTone = 'blue' | 'yellow' | 'neutral';

export type ColorScheme = keyof typeof palettes;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sizes = { control: 48, field: 58, icon: 22, hitSlop: 12, gutter: 16, sectionGap: 24 } as const;

export const radius = { sm: 8, md: 12, control: 16, lg: 20, pill: 999 } as const;

export const typography = {
  title: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
} as const;

export type TypographyVariant = keyof typeof typography;
