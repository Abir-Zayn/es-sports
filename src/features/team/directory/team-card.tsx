import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { TEAM_MIN } from '../data/team-lifecycle';
import type { TeamRecord, TeamRole } from '../data/team-repository';

const roleLabel: Record<TeamRole, string> = { owner: 'Owner', admin: 'Admin', player: 'Player', staff: 'Staff' };

type Props = { team: TeamRecord; members: number; role?: TeamRole | null; onPress: () => void };

/** One team in a list: its profile picture, name and area, how many players, and your role or its draft progress. */
export function TeamCard({ team, members, role = null, onPress }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const draft = team.registeredAt === null;
  const players = `${members} ${members === 1 ? 'player' : 'players'}`;
  const detail = [team.area, draft ? null : players].filter(Boolean).join(' · ');
  const label = [team.name, draft ? `draft, ${members} of ${TEAM_MIN} players` : players, role ? roleLabel[role] : null].filter(Boolean).join(', ');
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.pressed]}>
      <InitialsAvatar label={team.shortName} tone={team.tone} imageUri={team.logoUrl} size={dp(48)} />
      <View style={s.text}>
        <Text style={s.name} numberOfLines={1}>{team.name}</Text>
        {detail ? <Text style={s.detail} numberOfLines={1}>{detail}</Text> : null}
        {draft || role ? (
          <View style={s.badges}>
            {draft ? <AppBadge label={`Draft · ${members} of ${TEAM_MIN}`} backgroundColor={colors.accentSoft} color={colors.accent} /> : null}
            {role ? <AppBadge label={roleLabel[role]} backgroundColor={role === 'owner' ? colors.primarySoft : colors.surfaceRaised}
              color={role === 'owner' ? colors.link : colors.textMuted} /> : null}
          </View>
        ) : null}
      </View>
      <ChevronRight size={sizes.iconSmall} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card },
  pressed: { opacity: 0.7 },
  text: { flex: 1, minWidth: 0, gap: dp(4) },
  name: { ...typography.labelMd, color: c.text },
  detail: { ...typography.bodySm, color: c.textMuted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: dp(2) },
});
