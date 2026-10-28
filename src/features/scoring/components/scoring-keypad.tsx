import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
  pad: { gap: 8 }, row: { flexDirection: 'row', gap: 8 },
  key: { flex: 1, minHeight: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised },
  boundary: { backgroundColor: c.primary, borderColor: c.primary }, extra: { backgroundColor: c.accentSoft, borderColor: c.accentSoft },
  undo: { backgroundColor: c.background, borderColor: c.outline }, keyLabel: { fontSize: 27, lineHeight: 34, fontWeight: '800' },
  small: { fontSize: 15, lineHeight: 21, letterSpacing: 0.8 }, boundaryLabel: { color: c.primaryText }, extraLabel: { color: c.accent },
  out: { minHeight: 60, borderRadius: 18, borderWidth: 1, borderColor: c.dangerSoftText, backgroundColor: c.dangerSoft, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  outLabel: { color: c.dangerSoftText, fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: 1.2 },
  disabled: { opacity: 0.4 }, pressed: { opacity: 0.75 },
});
