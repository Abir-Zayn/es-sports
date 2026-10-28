import ArrowLeftRight from 'lucide-react-native/icons/arrow-left-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';

export function CreaseSummary({ score, onSwap, disabled }: { score: ScoreState; onSwap: () => void; disabled: boolean }) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const bowler = score.bowlers[score.bowlerId];
  const batter = (id: string, onStrike: boolean) => <View style={[s.batter, onStrike && s.active]}>
    <Text style={s.name}>{score.batters[id].name}{onStrike ? ' ●' : ''}</Text>
    <Text style={s.runs}>{score.batters[id].runs} <Text muted style={s.balls}>({score.batters[id].balls})</Text></Text>
  </View>;
  return <View style={s.wrap}>
    <View style={s.row}>
      {batter(score.strikerId, true)}
      <Pressable accessibilityRole="button" accessibilityLabel="Swap striker and non-striker" disabled={disabled}
        accessibilityState={{ disabled }} onPress={onSwap} style={[s.swap, disabled && s.disabled]}>
        <ArrowLeftRight size={18} color={colors.textMuted} />
      </Pressable>
      {batter(score.nonStrikerId, false)}
    </View>
    <View style={s.bowler}><Text muted style={s.caption}>BOWLER</Text><Text style={s.name}>{bowler.name}</Text>
      <Text muted style={s.figures}>{oversLabel(bowler.balls)} · {bowler.runs} runs · {bowler.wickets} wkts</Text></View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  wrap: { gap: 12 }, row: { flexDirection: 'row', gap: 6 },
  batter: { flex: 1, padding: 12, gap: 4, backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border },
  active: { borderColor: c.primary, backgroundColor: c.primarySoft },
  name: { fontSize: 13, lineHeight: 18, fontWeight: '700', flexShrink: 1 }, runs: { fontSize: 21, lineHeight: 26, fontWeight: '800' },
  balls: { fontSize: 12, lineHeight: 17, fontWeight: '500' },
  swap: { minWidth: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.surface },
  disabled: { opacity: 0.4 },
  bowler: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center', padding: 12, borderWidth: 1, borderColor: c.border, borderRadius: 16, backgroundColor: c.surface },
  caption: { fontSize: 10, lineHeight: 14, letterSpacing: 0.7 }, figures: { flexGrow: 1, textAlign: 'right', fontSize: 12, lineHeight: 17 },
});
