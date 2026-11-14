import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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
    card: { gap: spacing.lg, padding: sizes.cardPadding, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    title: typography.headlineMd,
    count: { ...typography.labelSm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
    facts: { flexDirection: 'row' },
    fact: { flex: 1, alignItems: 'center', gap: spacing.xs },
    factDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
    value: { ...typography.headlineMd, fontVariant: ['tabular-nums'] },
    label: { ...typography.labelUppercase, color: colors.textMuted },
  });
