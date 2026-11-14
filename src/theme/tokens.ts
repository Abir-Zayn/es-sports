import type { TextStyle, ViewStyle } from 'react-native';

import { dp, sp } from './scale';

export { palettes } from './palette';
export type { ColorScheme, Palette } from './palette';

/** Colour family for tinted avatars. */
export type AvatarTone = 'blue' | 'yellow' | 'neutral';

/** Spec scale is 4/8/16/24/32; `md` (12) is kept for tight in-row gaps the app already relies on. */
export const spacing = { xs: dp(4), sm: dp(8), md: dp(12), lg: dp(16), xl: dp(24), xxl: dp(32) } as const;

export const sizes = {
  /** Min height of a pill button (16px vertical padding + label). */
  control: dp(52),
  /** Text input height. */
  field: dp(56),
  icon: dp(24),
  iconSmall: dp(16),
  /** Circular icon button, avatar. */
  iconButton: dp(40),
  avatar: dp(40),
  tabIcon: dp(28),
  tabBar: dp(80),
  topBar: dp(64),
  progressBar: dp(10),
  hitSlop: dp(12),
  /** Screen edge padding. */
  gutter: dp(24),
  cardPadding: dp(24),
  cardPaddingTight: dp(20),
  sectionGap: dp(24),
} as const;

/** Cards are `lg`; tiles nested in a card step down to `md`; every other interactive element is `pill`. */
export const radius = { sm: dp(8), md: dp(16), control: dp(16), lg: dp(20), xl: dp(24), pill: 999 } as const;

/** Only two shadows exist. Chips, badges, inputs and list rows stay flat. */
export const shadows = {
  card: { boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' },
  primary: { boxShadow: '0px 10px 20px -6px rgba(255, 107, 80, 0.25)' },
  iconButton: { boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.04)' },
} as const satisfies Record<string, Pick<ViewStyle, 'boxShadow'>>;

/** Device system font everywhere. Headings use 500, all other text 400. */
export const fontWeight = { heading: '500', regular: '400' } as const satisfies Record<string, TextStyle['fontWeight']>;

/** Builds a text style from spec units: px size, unitless line-height multiplier, letter-spacing in em. */
function type(size: number, lineHeight: number, em: number, weight: TextStyle['fontWeight']): TextStyle {
  const fontSize = sp(size);
  // Floor at 1.2: Android clips descenders on single-line labels set to 1.0.
  return { fontSize, lineHeight: Math.round(fontSize * Math.max(lineHeight, 1.2)), letterSpacing: fontSize * em, fontWeight: weight };
}

const h = fontWeight.heading;
const r = fontWeight.regular;

const scale = {
  displayLg: type(48, 1.05, -0.02, h),
  displayMd: type(30, 1.1, -0.02, h),
  /** Stat numerals; tabular figures keep columns aligned. */
  numeralStat: { ...type(30, 1.1, -0.02, h), fontVariant: ['tabular-nums'] },
  headlineLg: type(20, 1.25, -0.01, h),
  headlineMd: type(18, 1.3, -0.01, h),
  bodyMd: type(14, 1.5, 0, r),
  bodySm: type(12, 1.45, 0, r),
  labelMd: type(14, 1, -0.01, r),
  labelSm: type(12, 1, 0, r),
  labelUppercase: { ...type(12, 1.2, 0.12, r), textTransform: 'uppercase' },
  tabLabel: type(10, 1, 0, r),
} satisfies Record<string, TextStyle>;

export const typography = {
  ...scale,
  // Legacy names used across the app, mapped onto the new scale.
  title: scale.displayMd,
  heading: scale.headlineLg,
  body: scale.bodyMd,
  caption: scale.bodySm,
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
