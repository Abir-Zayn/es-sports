import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { getLocale, translate } from '@/i18n';
import { dp, radius, sp, typography, useTheme, type Palette } from '@/theme';

// Boundary colours read the same in both themes, with white text at accessible contrast.
const FOUR = '#178A4C';
const SIX = '#6D3FE0';
const ON_BOUNDARY = '#FFFFFF';
const EXTRAS = ['Wd', 'Nb', 'Lb', 'B'];
export const BOUNDARY_COLOURS = { four: { background: FOUR, color: ON_BOUNDARY }, six: { background: SIX, color: ON_BOUNDARY } } as const;

export type BallKind = 'four' | 'six' | 'wicket' | 'extra' | 'dot' | 'runs' | 'pending';

/** What a ball chip shows: "4", "6", "W", an extra ("Wd", "Nb", "Lb", "B"), "0", other runs, or "" for a ball to come. */
export function ballKind(value: string): BallKind {
  if (value === '') return 'pending';
  if (value === '4') return 'four';
  if (value === '6') return 'six';
  if (value === 'W') return 'wicket';
  if (EXTRAS.includes(value)) return 'extra';
  return value === '0' ? 'dot' : 'runs';
}

const EXTRA_KEYS = {
  Wd: 'match.ball.wide',
  Nb: 'match.ball.noBall',
  Lb: 'match.ball.legBye',
  B: 'match.ball.bye',
} as const;

/** How a ball is read out, e.g. "four", "wide", "2 runs". */
export const spokenBall = (value: string): string => {
  const locale = getLocale();
  switch (ballKind(value)) {
    case 'four': return translate(locale, 'match.ball.four');
    case 'six': return translate(locale, 'match.ball.six');
    case 'wicket': return translate(locale, 'match.ball.wicket');
    case 'dot': return translate(locale, 'match.ball.dot');
    case 'pending': return translate(locale, 'match.ball.pending');
    case 'runs': {
      const count = Number(value);
      return Number.isFinite(count)
        ? translate(locale, count === 1 ? 'match.runOne' : 'match.runMany', { count })
        : value;
    }
    case 'extra': {
      const key = EXTRA_KEYS[value as keyof typeof EXTRA_KEYS];
      return key ? translate(locale, key) : value;
    }
  }
};

function coloursOf(kind: BallKind, c: Palette): { background: string; color: string; border?: string } {
  switch (kind) {
    case 'four': return BOUNDARY_COLOURS.four;
    case 'six': return BOUNDARY_COLOURS.six;
    case 'wicket': return { background: c.danger, color: c.onLive };
    case 'extra': return { background: c.accentSoft, color: c.accent };
    case 'runs': return { background: c.primarySoft, color: c.link };
    case 'dot': return { background: c.surfaceRaised, color: c.textMuted };
    case 'pending': return { background: 'transparent', color: c.textMuted, border: c.outline };
  }
}

/** One delivery as a colour-coded pill: green four, purple six, red wicket, amber extra, neutral dot. */
export function LiveBallPill({ value, size = dp(36) }: { value: string; size?: number }) {
  const { colors } = useTheme();
  const kind = ballKind(value);
  const tone = coloursOf(kind, colors);
  const fontSize = sp(size > dp(30) ? (kind === 'extra' ? 11 : 14) : kind === 'extra' ? 9 : 11);
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.pill, {
      minWidth: size, height: size, borderRadius: radius.pill, backgroundColor: tone.background,
      borderColor: tone.border ?? 'transparent', borderWidth: tone.border ? 1.5 : 0, borderStyle: kind === 'pending' ? 'dashed' : 'solid',
    }]}>
    {kind === 'pending' ? null : <Text style={[typography.labelSm, { color: tone.color, fontSize, lineHeight: Math.round(fontSize * 1.2), fontVariant: ['tabular-nums'] }]}>{value}</Text>}
  </View>;
}

const styles = StyleSheet.create({ pill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: dp(4), flexShrink: 0 } });
