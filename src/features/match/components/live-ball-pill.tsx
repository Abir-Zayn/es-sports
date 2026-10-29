import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, type Palette } from '@/theme';

// Boundary colours read the same in both themes, with white text at accessible contrast.
const FOUR = '#178A4C';
const SIX = '#6D3FE0';
const ON_BOUNDARY = '#FFFFFF';
const EXTRAS = ['Wd', 'Nb', 'Lb', 'B'];

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

const SPOKEN: Record<BallKind, (v: string) => string> = {
  four: () => 'four', six: () => 'six', wicket: () => 'wicket', dot: () => 'dot ball', pending: () => 'to come',
  runs: (v) => `${v} run${v === '1' ? '' : 's'}`,
  extra: (v) => ({ Wd: 'wide', Nb: 'no ball', Lb: 'leg bye', B: 'bye' })[v] ?? v,
};

/** How a ball is read out, e.g. "four", "wide", "2 runs". */
export const spokenBall = (value: string) => SPOKEN[ballKind(value)](value);

function coloursOf(kind: BallKind, c: Palette): { background: string; color: string; border?: string } {
  switch (kind) {
    case 'four': return { background: FOUR, color: ON_BOUNDARY };
    case 'six': return { background: SIX, color: ON_BOUNDARY };
    case 'wicket': return { background: c.danger, color: c.onLive };
    case 'extra': return { background: c.accentSoft, color: c.accent };
    case 'runs': return { background: c.primarySoft, color: c.link };
    case 'dot': return { background: c.surfaceRaised, color: c.textMuted, border: c.border };
    case 'pending': return { background: 'transparent', color: c.textMuted, border: c.outline };
  }
}

/** One delivery as a colour-coded pill: green four, purple six, red wicket, amber extra, neutral dot. */
export function LiveBallPill({ value, size = 36 }: { value: string; size?: number }) {
  const { colors } = useTheme();
  const kind = ballKind(value);
  const tone = coloursOf(kind, colors);
  const fontSize = size > 30 ? (kind === 'extra' ? 11 : 14) : kind === 'extra' ? 9 : 11;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[styles.pill, {
      minWidth: size, height: size, borderRadius: size / 2, backgroundColor: tone.background,
      borderColor: tone.border ?? 'transparent', borderWidth: tone.border ? 1.5 : 0, borderStyle: kind === 'pending' ? 'dashed' : 'solid',
    }]}>
    {kind === 'pending' ? null : <Text style={{ color: tone.color, fontSize, lineHeight: fontSize + 3, fontWeight: '800' }}>{value}</Text>}
  </View>;
}

const styles = StyleSheet.create({ pill: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4, flexShrink: 0 } });
