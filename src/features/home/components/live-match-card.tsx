import { Pressable, StyleSheet, View } from 'react-native';

import { TeamBadge } from '@/components/team/team-badge';
import { Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { LiveMatch } from '../sample-data';

export const LIVE_CARD_WIDTH = 300;

type Props = { match: LiveMatch; onPress?: () => void };

export function LiveMatchCard({ match, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${match.label}. ${match.teams[0].name} ${match.teams[0].score}, ${match.teams[1].name} ${match.teams[1].score}. ${match.status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.label} numberOfLines={1}>
          {match.label}
        </Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.teams}>
        {match.teams.map((team) => {
          const color = team.batting ? colors.text : colors.textMuted;
          return (
            <View key={team.short} style={styles.teamRow}>
              <TeamBadge short={team.short} color={team.color} />
              <Text style={[styles.teamName, { color }]} numberOfLines={1}>
                {team.name}
              </Text>
              <View style={styles.scoreRow}>
                <Text style={[styles.score, { color }]}>{team.score}</Text>
                {team.overs ? <Text style={styles.overs}>{team.overs}</Text> : null}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />
      <Text style={styles.status}>{match.status}</Text>

      <View style={styles.ballsRow}>
        <Text style={styles.thisOver}>This over</Text>
        {match.balls.map((ball, i) => (
          <BallChip key={`${ball}-${i}`} value={ball} />
        ))}
      </View>
    </Pressable>
  );
}

function BallChip({ value }: { value: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  let background = colors.surfaceRaised;
  let color = colors.text;
  let fontSize = 12;
  if (value === 'W') {
    background = colors.dangerSoft;
    color = colors.dangerSoftText;
  } else if (value === '4' || value === '6') {
    background = colors.primary;
    color = colors.primaryText;
  } else if (value === 'Wd' || value === 'Nb') {
    background = colors.accentSoft;
    color = colors.accent;
    fontSize = 10;
  }
  return (
    <View style={[styles.ball, { backgroundColor: background }]}>
      <Text style={{ color, fontSize, lineHeight: 16, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      width: LIVE_CARD_WIDTH,
      paddingTop: spacing.lg,
      paddingHorizontal: 18,
      paddingBottom: 18,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 14,
    },
    pressed: { opacity: 0.85 },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    label: { flexShrink: 1, fontSize: 11, lineHeight: 14, fontWeight: '600', letterSpacing: 1, color: colors.textMuted },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.live,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onLive },
    liveText: { fontSize: 10, lineHeight: 12, fontWeight: '800', letterSpacing: 1, color: colors.onLive },
    teams: { gap: 10 },
    teamRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    teamName: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    score: { fontSize: 24, lineHeight: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
    overs: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.border },
    status: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.link },
    ballsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    thisOver: { fontSize: 11, lineHeight: 14, color: colors.textMuted, marginRight: spacing.xs },
    ball: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  });
