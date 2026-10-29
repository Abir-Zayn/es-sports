import { StyleSheet, View } from 'react-native';
import { InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { useThemedStyles, type Palette } from '@/theme';
import type { PlayerCareer } from '../types';

export function PlayerHeroCard({ player }: { player: PlayerCareer }) {
  const styles = useThemedStyles(createStyles);
  const bio = player.profile;
  const location = [bio.area, bio.district].filter(Boolean).join(', ');
  return <View style={styles.card}>
    <View style={styles.row}>
      <InitialsAvatar label={initialsOf(bio.fullName)} imageUri={bio.avatarUri} size={76} />
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
  card: { backgroundColor: c.surface, borderRadius: 20, padding: 20, gap: 18, borderWidth: 1, borderColor: c.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 }, details: { flex: 1, gap: 4 },
  eyebrow: { color: c.link, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  name: { color: c.text, fontSize: 23, lineHeight: 29, fontWeight: '700' },
  number: { color: c.link, fontSize: 14, fontWeight: '700' }, pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { backgroundColor: c.surfaceRaised, color: c.text, borderRadius: 16, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, textTransform: 'capitalize' },
  note: { color: c.textMuted, fontSize: 12 },
});
