import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

import { oversPerBowler } from '../friendly/friendly-rules';
import type { FriendlyTeamSquad } from '../types';

type Props = {
  teamA: FriendlyTeamSquad;
  teamB: FriendlyTeamSquad;
  nameA: string;
  nameB: string;
  overs: number;
  playersPerSide: number;
};

/** The screen's one hero: both sides facing off, with the format as three big numbers. */
export function FriendlyMatchupHero({ teamA, teamB, nameA, nameB, overs, playersPerSide }: Props) {
  const s = useThemedStyles(styles);
  const quota = oversPerBowler(overs);
  const stats = [
    { key: 'overs', value: overs, label: 'Overs' },
    { key: 'side', value: playersPerSide, label: 'A side' },
    { key: 'quota', value: quota, label: 'Per bowler' },
  ];
  return <View style={s.card} accessible accessibilityLabel={`${nameA} versus ${nameB}. ${overs} overs, ${playersPerSide} a side, up to ${quota} overs per bowler.`}>
    <View style={s.faceoff}>
      <Side squad={teamA} name={nameA} />
      <View style={s.vs}><Text style={s.vsText}>VS</Text></View>
      <Side squad={teamB} name={nameB} />
    </View>
    <View style={s.stats}>
      {stats.map((stat) => <View key={stat.key} style={s.stat}>
        <Text style={s.statValue}>{stat.value}</Text>
        <Text muted style={s.statLabel}>{stat.label}</Text>
      </View>)}
    </View>
  </View>;
}

function Side({ squad, name }: { squad: FriendlyTeamSquad; name: string }) {
  const s = useThemedStyles(styles);
  return <View style={s.side}>
    <InitialsAvatar label={initialsOf(name)} imageUri={squad.imageUri} tone={squad.tone} size={56} borderColor={s.ring.borderColor} borderWidth={1} />
    <Text style={s.sideName} numberOfLines={1}>{name}</Text>
    <Text muted style={s.sideMeta}>{squad.players.length} in squad</Text>
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: {
    gap: spacing.lg, padding: spacing.xl, borderRadius: 24, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceRaised,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 8 },
  },
  faceoff: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  side: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
  ring: { borderColor: c.border },
  sideName: { marginTop: spacing.xs, fontSize: 15, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  sideMeta: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  vs: {
    marginTop: 14, width: 36, height: 28, alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.background,
  },
  vsText: { fontSize: 11, lineHeight: 14, fontWeight: '800', letterSpacing: 1, color: c.textMuted },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: c.background },
  statValue: { fontSize: 24, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
});
