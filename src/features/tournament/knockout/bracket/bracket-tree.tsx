import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { Bracket, BracketMatch, KnockoutStage } from './bracket-model';

/** Wider rounds than this do not fit a phone row; they show in the stage list instead. */
export const TREE_MAX_PER_ROW = 4;
const LINE = 1.5;

type Props = { bracket: Bracket; selected: KnockoutStage | null; onSelect: (stage: KnockoutStage) => void };

/**
 * The road to the final, drawn under the final card: semi-finals, then quarter-finals, then any round that still fits,
 * each pair of tiles joined by a line to the match its winner plays next.
 */
export function BracketTree({ bracket, selected, onSelect }: Props) {
  const styles = useThemedStyles(createStyles);
  const rows = [...bracket.stages].reverse().filter((s) => s.name !== 'Final' && s.matches.length <= TREE_MAX_PER_ROW);
  if (rows.length === 0) return null;
  let above = bracket.final ? 1 : 0;
  return (
    // Pulled up over the section gap so the first line meets the final card above.
    <View style={[styles.tree, bracket.final ? styles.attached : null]} accessibilityLabel="Knockout bracket">
      {rows.map((row) => {
        // Join to the row above only where each match above is fed by exactly two below.
        const joined = above > 0 && row.matches.length === above * 2;
        above = row.matches.length;
        return (
          <View key={row.name}>
            {joined ? <Forks count={row.matches.length / 2} /> : <View style={styles.spacer} />}
            <View style={styles.row}>
              {row.matches.map((m) => <Tile key={m.id} match={m} active={selected === row.name} onPress={() => onSelect(row.name)} />)}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** One line from the match above splitting to the two matches below it. */
function Forks({ count }: { count: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.forks} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.fork}>
          <View style={[styles.line, styles.stem]} />
          <View style={[styles.line, styles.bar]} />
          <View style={[styles.line, styles.leg, { left: '25%' }]} />
          <View style={[styles.line, styles.leg, { left: '75%' }]} />
        </View>
      ))}
    </View>
  );
}

function Tile({ match, active, onPress }: { match: BracketMatch; active: boolean; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  const decided = match.sides.some((s) => s.won);
  const said = match.sides.map((s) => `${s.name}${s.score ? ` ${s.score}` : ''}${s.won ? ', through' : ''}`).join(' against ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${match.label}: ${said}`} accessibilityState={{ selected: active }}
      onPress={onPress} style={({ pressed }) => [styles.tile, match.awaitingDecision && styles.awaiting, pressed && styles.pressed]}>
      <View style={styles.tileHead}>
        <Text style={styles.tileLabel}>{match.label}</Text>
        {match.state === 'live' ? <View style={styles.live} /> : null}
      </View>
      {match.sides.map((s, i) => (
        <View key={i} style={styles.line2}>
          <Text numberOfLines={1} style={[styles.code, (!decided || s.won) && s.team ? styles.strong : styles.weak]}>{s.code}</Text>
          {s.score ? <Text style={[styles.tileScore, s.won ? styles.strong : styles.weak]}>{s.score}</Text> : null}
        </View>
      ))}
    </Pressable>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  tree: { paddingBottom: spacing.xs },
  attached: { marginTop: -sizes.sectionGap },
  spacer: { height: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
  forks: { flexDirection: 'row', height: dp(28) },
  fork: { flex: 1 },
  line: { position: 'absolute', backgroundColor: colors.border },
  stem: { left: '50%', top: 0, height: '50%', width: LINE, marginLeft: -LINE / 2 },
  bar: { left: '25%', right: '25%', top: '50%', height: LINE },
  leg: { top: '50%', bottom: 0, width: LINE, marginLeft: -LINE / 2 },
  tile: {
    flex: 1, minWidth: 0, minHeight: dp(56), justifyContent: 'center', gap: dp(2), paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  awaiting: { borderColor: colors.accent },
  pressed: { opacity: 0.7 },
  tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileLabel: { ...typography.labelSm, color: colors.textMuted },
  live: { width: dp(6), height: dp(6), borderRadius: radius.pill, backgroundColor: colors.live },
  line2: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: dp(4) },
  code: { ...typography.labelMd, flexShrink: 1 },
  tileScore: { ...typography.labelSm, fontVariant: ['tabular-nums'] },
  strong: { color: colors.text, fontWeight: '700' },
  weak: { color: colors.textMuted },
});
