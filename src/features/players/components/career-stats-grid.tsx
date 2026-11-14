import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { toBattingStats, toBowlingStats, type CareerTotals } from '@/lib/career-stats';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Stat = { label: string; value: string | number };
function StatSection({ title, stats }: { title: string; stats: Stat[] }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}><Text style={styles.heading}>{title}</Text><View style={styles.grid}>
    {stats.map((stat) => <View key={stat.label} style={styles.tile}><Text style={styles.value}>{stat.value}</Text><Text style={styles.label}>{stat.label}</Text></View>)}
  </View></View>;
}
export function CareerStatsGrid({ totals }: { totals: CareerTotals }) {
  const b = toBattingStats(totals);
  const w = toBowlingStats(totals);
  return <View style={{ gap: sizes.sectionGap }}>
    <StatSection title="Batting" stats={[
      { label: 'Matches', value: b.matches }, { label: 'Innings', value: b.innings }, { label: 'Runs', value: b.runs },
      { label: 'Average', value: b.average }, { label: 'Strike rate', value: b.strikeRate }, { label: 'Highest', value: b.highest },
      { label: '50s', value: b.fifties }, { label: '100s', value: b.hundreds },
    ]} />
    <StatSection title="Bowling" stats={[
      { label: 'Overs', value: w.overs }, { label: 'Wickets', value: w.wickets }, { label: 'Best', value: w.best },
      { label: 'Economy', value: w.economy }, { label: '3-wicket hauls', value: w.threeW }, { label: '5-wicket hauls', value: w.fiveW },
    ]} />
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: spacing.md }, heading: { ...typography.headlineMd, color: c.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexBasis: '30%', flexGrow: 1, minHeight: dp(78), borderRadius: radius.lg, backgroundColor: c.surface, padding: spacing.md, justifyContent: 'center', gap: spacing.xs, ...shadows.card },
  value: { ...typography.headlineLg, color: c.text, fontVariant: ['tabular-nums'] },
  label: { ...typography.bodySm, color: c.textMuted },
});
