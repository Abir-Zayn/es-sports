import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { EnteredTeam } from '../../data/tournament-repository';

/** "5 of 8 still in" with a bar, then every team as a small badge: the ones still in first, the ones out faded and struck. */
export function TeamsStatus({ teams }: { teams: EnteredTeam[] }) {
  const styles = useThemedStyles(createStyles);
  const alive = teams.filter((e) => !e.eliminated);
  const out = teams.filter((e) => e.eliminated);
  const share = teams.length > 0 ? alive.length / teams.length : 0;
  // One team left of several is the champion, whether the final decided it or the organiser knocked the rest out.
  const champion = alive.length === 1 && teams.length > 1 ? alive[0] : null;
  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={styles.title}>TEAMS</Text>
        <Text style={styles.count}>{champion ? `${champion.team.name} won` : `${alive.length} of ${teams.length} still in`}</Text>
      </View>
      <View style={styles.track} accessible accessibilityRole="progressbar" accessibilityLabel="Teams still in"
        accessibilityValue={{ min: 0, max: teams.length, now: alive.length }}>
        <View style={[styles.fill, { width: `${Math.round(share * 100)}%` }]} />
      </View>
      <View style={styles.grid}>
        {[...alive, ...out].map(({ team, eliminated }) => (
          <View key={team.id} style={styles.team} accessible accessibilityLabel={`${team.name}, ${eliminated ? 'out' : champion ? 'champion' : 'still in'}`}>
            <View style={eliminated ? styles.faded : null}>
              <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl ?? undefined} size={dp(40)} shape="square" />
            </View>
            <Text numberOfLines={1} style={[styles.code, eliminated && styles.out]}>{team.shortName}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.hint}>Teams go out as the rounds are played. The organiser can also knock a team out by hand.</Text>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.md, ...shadows.card },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.labelUppercase, color: colors.textMuted },
  count: { ...typography.labelMd, color: colors.text },
  track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.success },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  team: { width: dp(52), alignItems: 'center', gap: dp(4) },
  faded: { opacity: 0.35 },
  code: { ...typography.labelSm, color: colors.text },
  out: { color: colors.textMuted, textDecorationLine: 'line-through' },
  hint: { ...typography.bodySm, color: colors.textMuted },
});
