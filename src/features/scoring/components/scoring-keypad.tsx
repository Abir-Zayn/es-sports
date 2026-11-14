import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, spacing, sp, typography, useThemedStyles, type Palette } from '@/theme';

type Props = { disabled: boolean; canUndo: boolean; onRuns: (runs: number) => void; onExtra: (kind: string) => void; onUndo: () => void; onWicket: () => void };
export function ScoringKeypad({ disabled, canUndo, onRuns, onExtra, onUndo, onWicket }: Props) {
  const s = useThemedStyles(styles);
  const labels = [['0', '1', '2', '3'], ['4', '6', 'WD', 'NB'], ['BYE', 'LB', 'DEAD', 'UNDO']];
  const action = (label: string) => label === 'UNDO' ? onUndo() : /^\d$/.test(label) ? onRuns(Number(label)) : onExtra(label);
  return <View style={s.pad}>
    {labels.map((row, i) => <View key={i} style={s.row}>{row.map((label) => {
      const boundary = label === '4' || label === '6';
      const extra = ['WD', 'NB', 'BYE', 'LB', 'DEAD'].includes(label);
      const inactive = label === 'UNDO' ? !canUndo : disabled;
      return <Pressable key={label} accessibilityRole="button" accessibilityState={{ disabled: inactive }}
        accessibilityLabel={label === 'UNDO' ? 'Undo last action' : label === 'WD' ? 'Wide' : label === 'NB' ? 'No ball' : label === 'LB' ? 'Leg bye' : label === 'DEAD' ? 'Dead ball' : label === 'BYE' ? 'Bye' : `${label} runs`}
        disabled={inactive} onPress={() => action(label)}
        style={({ pressed }) => [s.key, boundary && s.boundary, extra && s.extra, label === 'UNDO' && s.undo, inactive && s.disabled, pressed && s.pressed]}>
        <Text style={[s.keyLabel, boundary && s.boundaryLabel, extra && s.extraLabel, label.length > 1 && s.small]}>{label}</Text>
      </Pressable>;
    })}</View>)}
    <Pressable accessibilityRole="button" accessibilityLabel="Record a wicket" disabled={disabled} accessibilityState={{ disabled }}
      onPress={onWicket} style={({ pressed }) => [s.out, disabled && s.disabled, pressed && s.pressed]}>
      <Text style={s.outLabel}>OUT</Text>
    </Pressable>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  pad: { gap: spacing.sm }, row: { flexDirection: 'row', gap: spacing.sm },
  key: { flex: 1, minHeight: dp(60), justifyContent: 'center', alignItems: 'center', borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  // Boundaries are the scorer's primary taps: peach selected-style tile, coral text, no full coral fill.
  boundary: { backgroundColor: c.primarySoft }, extra: { backgroundColor: c.surfaceRaised },
  undo: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border }, keyLabel: { ...typography.displayMd, fontVariant: ['tabular-nums'] },
  small: { ...typography.labelMd, fontSize: sp(15) }, boundaryLabel: { color: c.link }, extraLabel: { color: c.textMuted },
  out: { minHeight: dp(60), borderRadius: radius.md, backgroundColor: c.dangerSoft, justifyContent: 'center', alignItems: 'center', marginTop: spacing.xs },
  outLabel: { ...typography.headlineLg, color: c.dangerSoftText, letterSpacing: sp(1.2) },
  disabled: { opacity: 0.4 }, pressed: { transform: [{ scale: 0.95 }] },
});
