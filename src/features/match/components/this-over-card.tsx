import Info from 'lucide-react-native/icons/info';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

import type { OverSummary } from '../types';
import { LiveBallPill, spokenBall } from './live-ball-pill';

type Props = { current: OverSummary | null; previous: OverSummary[] };

const spokenOver = (over: OverSummary) => over.balls.filter((b) => b !== '').map(spokenBall).join(', ');

/** The over being bowled ball by ball as circular badges in a DAZN-style Form card, with recent overs below. */
export function ThisOverCard({ current, previous }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (!current) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Recent overs</Text>
          <Info size={15} color={colors.textMuted} strokeWidth={2} />
        </View>
        <View style={styles.card}>
          <View style={styles.emptyRow}>
            <Text style={styles.title}>This over</Text>
            <Text muted style={styles.runs}>No balls bowled yet.</Text>
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Recent overs</Text>
        <Info size={15} color={colors.textMuted} strokeWidth={2} />
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.meta}>
            <Text style={styles.title} numberOfLines={1}>
              {current.inProgress ? 'This over' : 'Last over'} · Ov {current.number}
            </Text>
            <Text muted style={styles.sub} numberOfLines={1}>
              {current.bowler} · {current.runs} runs
            </Text>
          </View>
          <View
            style={styles.balls}
            accessible
            accessibilityLabel={`Over ${current.number}: ${spokenOver(current) || 'no balls yet'}`}
          >
            {current.balls.map((ball, i) => (
              <LiveBallPill key={i} value={ball} size={28} />
            ))}
          </View>
        </View>
        {previous.map((over) => (
          <View
            key={over.number}
            style={[styles.row, styles.divider]}
            accessible
            accessibilityLabel={`Over ${over.number}, ${over.runs} runs: ${spokenOver(over)}`}
          >
            <View style={styles.meta}>
              <Text style={styles.previousLabel} numberOfLines={1}>
                Over {over.number}
              </Text>
              <Text muted style={styles.sub} numberOfLines={1}>
                {over.bowler} · {over.runs} runs
              </Text>
            </View>
            <View style={styles.balls}>
              {over.balls.map((ball, i) => (
                <LiveBallPill key={i} value={ball} size={26} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: 10 },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: colors.text },
    card: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    emptyRow: { paddingVertical: 14, paddingHorizontal: 16, gap: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 14,
      gap: 12,
    },
    divider: { borderTopWidth: 1, borderTopColor: colors.border },
    meta: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: colors.text },
    previousLabel: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.text },
    sub: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
    runs: { fontSize: 13, lineHeight: 18 },
    balls: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6 },
  });
