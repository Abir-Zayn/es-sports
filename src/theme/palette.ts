/**
 * Coral Daylight colour roles (see DESIGN.md). Coral is the single signal colour:
 * primary CTA, active tab, selection border, progress fill, focus ring. Everything else is grayscale.
 */
export type Palette = {
  /** Page background (spec `surface-alt`). */
  background: string;
  /** Cards and sheets (spec `surface`). */
  surface: string;
  /** Input fills, inactive chips and list rows (spec `surface-muted`). */
  surfaceRaised: string;
  /** Hairlines, progress tracks, tab-bar top border. */
  border: string;
  /** Dashed outlines, e.g. the "Join a team" circle. */
  outline: string;
  text: string;
  /** Captions and helper copy. */
  textMuted: string;
  /** Coral fill. Never a card background or a wide field. */
  primary: string;
  primaryText: string;
  /** Peach "selected" surface behind coral content (spec `accent-soft`). */
  primarySoft: string;
  /** Lighter coral for two-tone moments (spec `accent-tint`). Use sparingly. */
  primaryTint: string;
  /** Darker coral for artwork bands. */
  primaryDeep: string;
  /** Coral that stays readable as text or a link on `background` / `surface`. */
  link: string;
  live: string;
  /** Text and dot colour on top of `live`. */
  onLive: string;
  /** Categorical amber (toss, winner). A tonal cousin, not a second brand colour. */
  accent: string;
  accentSoft: string;
  /** Categorical blue cousin for info metrics. */
  info: string;
  infoSoft: string;
  /** Completed / positive status. Text-safe on `successSoft`. */
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  dangerSoftText: string;
  overlay: string;
};

const light: Palette = {
  background: '#F8F8FB',
  surface: '#FFFFFF',
  surfaceRaised: '#F0F0F3',
  border: '#E5E5EA',
  outline: '#C7C7CC',
  text: '#2C2C2E',
  // Spec #8E8E93 is 3.1:1 on the page; darkened to pass WCAG AA for small text.
  textMuted: '#6E6E73',
  primary: '#FF6B50',
  primaryText: '#FFFFFF',
  primarySoft: '#FFEBE8',
  primaryTint: '#FF9F8C',
  primaryDeep: '#E5502F',
  // Spec coral is 2.8:1 as text; this shade is 4.8:1 on the page.
  link: '#C73E26',
  live: '#FF3B30',
  onLive: '#FFFFFF',
  accent: '#8A5A00',
  accentSoft: '#F6E7C0',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#FF3B30',
  dangerSoft: '#FFE5E3',
  dangerSoftText: '#C4271D',
  overlay: 'rgba(248, 248, 251, 0.85)',
};

/** Dark counterpart derived from the light spec so the app keeps following the device setting. */
const dark: Palette = {
  background: '#121214',
  surface: '#1C1C1E',
  surfaceRaised: '#2C2C2E',
  border: '#38383A',
  outline: '#636366',
  text: '#F2F2F7',
  textMuted: '#A1A1A6',
  primary: '#FF6B50',
  primaryText: '#FFFFFF',
  primarySoft: '#3D2420',
  primaryTint: '#FF9F8C',
  primaryDeep: '#E5502F',
  link: '#FF8A73',
  live: '#FF453A',
  onLive: '#FFFFFF',
  accent: '#EAB308',
  accentSoft: '#403619',
  info: '#60A5FA',
  infoSoft: '#172554',
  success: '#4ADE80',
  successSoft: 'rgba(34, 197, 94, 0.15)',
  danger: '#FF453A',
  dangerSoft: '#3A1A1A',
  dangerSoftText: '#FF8A80',
  overlay: 'rgba(18, 18, 20, 0.85)',
};

export const palettes = { dark, light } as const;

export type ColorScheme = keyof typeof palettes;
