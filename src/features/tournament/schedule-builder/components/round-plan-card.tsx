import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { RoundPlan, ScheduleTeam } from '../types';

type Props = { plan: RoundPlan; teams: ScheduleTeam[]; onDraw: () => void };

/**
 * The owner's way into a round that has no matches yet: who meets whom, then one button that adds this round's matches
 * (for a knockout, every match up to the final) and leaves the earlier rounds as they are.
 */
export function RoundPlanCard({ plan, teams, onDraw }: Props) {
  const styles = useThemedStyles(createStyles);
  const name = (id: string) => teams.find((t) => t.id === id)?.name ?? 'Team';
  const knockout = plan.kind === 'knockout';
  const pairs = knockout ? Array.from({ length: Math.floor(plan.slots.length / 2) }, (_, i) => [plan.slots[2 * i], plan.slots[2 * i + 1]]) : [];
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>{`Round ${plan.round + 1} · ${knockout ? 'Knockout' : 'Groups'}`}</Text>
      {knockout ? (
        <>
          {pairs.map(([home, away], i) => (
            <View key={i} style={styles.pair} accessible accessibilityLabel={`${name(home ?? '')} against ${name(away ?? '')}`}>
              <Text style={styles.team} numberOfLines={1}>{name(home ?? '')}</Text>
              <Text muted style={styles.vs}>v</Text>
              <Text style={[styles.team, styles.right]} numberOfLines={1}>{name(away ?? '')}</Text>
            </View>
          ))}
          <Text muted>Every match up to the final is added. Later matches show "Winner of Match N" until those are played.</Text>
        </>
      ) : <Text muted>This round's group matches are added. Earlier rounds stay as they are.</Text>}
      <Button label={knockout ? 'Draw knockout matches' : `Draw round ${plan.round + 1} matches`} onPress={onDraw} />
    </Card>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { gap: spacing.md },
  title: typography.headlineMd,
  pair: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceRaised },
  team: { ...typography.bodyMd, flex: 1, minWidth: 0 },
  right: { textAlign: 'right' },
  vs: typography.labelMd,
});
