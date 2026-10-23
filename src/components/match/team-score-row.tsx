import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { LiveTeam } from '@/types/cricket';

const TEAM_AVATAR_SIZE = 30;

/** A team's avatar, name and score. The batting side is full strength, the other muted. */
export function TeamScoreRow({ team }: { team: LiveTeam }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const color = team.batting ? colors.text : colors.textMuted;
  return (
    <View style={styles.row}>
      <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={TEAM_AVATAR_SIZE} />
      <Text style={[styles.name, { color }]} numberOfLines={1}>
        {team.name}
      </Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color }]}>{team.score}</Text>
        {team.overs ? <Text style={styles.overs}>{team.overs}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
    scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
    score: { fontSize: 20, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    overs: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  });
