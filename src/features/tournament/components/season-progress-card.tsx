import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, useThemedStyles, type Palette } from '@/theme';

type Props = {
  played: number;
  total: number;
  teamCount: number;
  /** Date of the final as shown, e.g. "30 Nov". */
  finalDate: string;
};

/** How far the tournament has run: matches played as a bar, then teams, matches left and the final's date. */
export function SeasonProgressCard({ played, total, teamCount, finalDate }: Props) {
  const styles = useThemedStyles(createStyles);
  const done = total > 0 ? Math.min(Math.max(played, 0), total) : 0;
  const share = total > 0 ? done / total : 0;
  const facts = [
    { label: 'Teams', value: String(teamCount) },
    { label: 'Left', value: String(total - done) },
    { label: 'Final', value: finalDate },
  ];

  return (
    <View accessible accessibilityLabel={`${done} of ${total} matches played. ${teamCount} teams, final on ${finalDate}`} style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.title}>Season progress</Text>
        <Text style={styles.count}>
          {done}/{total} played
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(share * 100)}%` }]} />
      </View>
      <View style={styles.facts}>
        {facts.map((fact, i) => (
          <View key={fact.label} style={[styles.fact, i > 0 && styles.factDivider]}>
            <Text style={styles.value}>{fact.value}</Text>
            <Text style={styles.label}>{fact.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { gap: 14 },
    top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    count: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted, fontVariant: ['tabular-nums'] },
    track: { height: 6, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
    facts: { flexDirection: 'row' },
    fact: { flex: 1, alignItems: 'center', gap: 2 },
    factDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
    value: { fontSize: 18, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    label: { fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: colors.textMuted },
  });
