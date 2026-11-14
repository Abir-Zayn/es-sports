import { StyleSheet, View } from 'react-native';
import { InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { PlayerCareer } from '../types';

export function PlayerHeroCard({ player }: { player: PlayerCareer }) {
  const styles = useThemedStyles(createStyles);
  const bio = player.profile;
  const location = [bio.area, bio.district].filter(Boolean).join(', ');
  return <View style={styles.card}>
    <View style={styles.row}>
      <InitialsAvatar label={initialsOf(bio.fullName)} imageUri={bio.avatarUri} size={dp(76)} />
      <View style={styles.details}>
        <Text style={styles.eyebrow}>PLAYER PROFILE</Text>
        <Text style={styles.name}>{bio.fullName}</Text>
        {player.jerseyNumber != null ? <Text style={styles.number}>#{player.jerseyNumber}</Text> : null}
      </View>
    </View>
    <View style={styles.pills}>
      <Text style={styles.pill}>{bio.role}</Text>
      <Text style={styles.pill}>{bio.battingStyle === 'left' ? 'Left-hand bat' : 'Right-hand bat'}</Text>
      {location ? <Text style={styles.pill}>{location}</Text> : null}
    </View>
    {player.isSample ? <Text style={styles.note}>Sample career data</Text> : null}
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.lg, ...shadows.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg }, details: { flex: 1, gap: spacing.xs },
  eyebrow: { ...typography.labelUppercase, color: c.link },
  name: { ...typography.headlineLg, color: c.text },
  number: { ...typography.labelMd, color: c.link, fontVariant: ['tabular-nums'] }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: { ...typography.labelSm, backgroundColor: c.surfaceRaised, color: c.textMuted, borderRadius: radius.pill, overflow: 'hidden', paddingHorizontal: spacing.md, paddingVertical: dp(6), textTransform: 'capitalize' },
  note: { ...typography.bodySm, color: c.textMuted },
});
