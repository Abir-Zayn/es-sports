import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

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
  const { t } = useTranslation();
  const quota = oversPerBowler(overs);
  const stats = [
    { key: 'overs', value: overs, label: t('friendly.hero.overs') },
    { key: 'side', value: playersPerSide, label: t('friendly.hero.aSide') },
    { key: 'quota', value: quota, label: t('friendly.hero.perBowler') },
  ];
  return <View style={s.card} accessible accessibilityLabel={t('friendly.hero.a11y', { teamA: nameA, teamB: nameB, overs, players: playersPerSide, quota })}>
    <View style={s.faceoff}>
      <Side squad={teamA} name={nameA} />
      <View style={s.vs}><Text style={s.vsText}>{t('friendly.hero.vs')}</Text></View>
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
  const { t } = useTranslation();
  return <View style={s.side}>
    <InitialsAvatar label={initialsOf(name)} imageUri={squad.imageUri} tone={squad.tone} size={dp(56)} />
    <Text style={s.sideName} numberOfLines={1}>{name}</Text>
    <Text muted style={s.sideMeta}>{t('friendly.hero.inSquad', { count: squad.players.length })}</Text>
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.lg, padding: sizes.cardPadding, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  faceoff: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  side: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
  sideName: { ...typography.headlineMd, marginTop: spacing.xs, textAlign: 'center' },
  sideMeta: typography.bodySm,
  vs: {
    marginTop: dp(14), width: dp(36), height: dp(28), alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, backgroundColor: c.surfaceRaised,
  },
  vsText: { ...typography.labelSm, color: c.textMuted },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, alignItems: 'center', gap: dp(2), paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  statValue: typography.numeralStat,
  statLabel: typography.bodySm,
});
