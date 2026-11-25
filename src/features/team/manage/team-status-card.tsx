import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Card, Text } from '@/components/ui';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { TeamLogoPicker } from '../components/team-logo-picker';
import { TEAM_MAX, TEAM_MIN } from '../data/team-lifecycle';
import type { TeamRecord } from '../data/team-repository';

type Props = {
  team: TeamRecord; members: number; invited: number; manager: boolean;
  logo: { uri: string | null; saving: boolean; onPick: (uri: string) => void; onError: (message: string) => void };
  register: { busy: boolean; onRegister: () => void };
  /** Opens the name, short name, colour and area editor. */
  onEdit: () => void;
};

/**
 * The team at the top of its member screen: its picture (changeable by the owner or an admin), and where it stands.
 * A draft shows how many of the 4 players it has and unlocks Register at 4; a registered team shows its 16-player room.
 */
export function TeamStatusCard({ team, members, invited, manager, logo, register, onEdit }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const draft = team.registeredAt === null;
  const ready = members >= TEAM_MIN;
  const share = Math.min(1, members / TEAM_MIN);
  return (
    <Card style={s.card}>
      {manager ? (
        <TeamLogoPicker uri={logo.uri ?? team.logoUrl} shortName={team.shortName} tone={team.tone} saving={logo.saving}
          onPick={logo.onPick} onError={logo.onError} />
      ) : null}
      <View style={s.titleRow}>
        <Text style={s.name} numberOfLines={2}>{team.name}</Text>
        <AppBadge label={draft ? 'Draft' : 'Registered'} backgroundColor={draft ? colors.accentSoft : colors.successSoft}
          color={draft ? colors.accent : colors.success} />
      </View>
      {manager ? <Button label="Edit details" variant="ghost" size="compact" accessibilityLabel={`Edit ${team.name} details`} onPress={onEdit} /> : null}
      {draft ? (
        <>
          <View style={s.progressText}>
            <Text style={s.count}>{`${Math.min(members, TEAM_MIN)} of ${TEAM_MIN} players`}</Text>
            {invited > 0 ? <Text style={s.muted}>{`${invited} invited`}</Text> : null}
          </View>
          <View style={s.track} accessible accessibilityRole="progressbar" accessibilityLabel="Players needed to register"
            accessibilityValue={{ min: 0, max: TEAM_MIN, now: Math.min(members, TEAM_MIN) }}>
            <View style={[s.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: ready ? colors.success : colors.primary }]} />
          </View>
          <Text style={s.muted}>{ready
            ? 'Everyone is in. Register the team so others can find it.'
            : `Invite players and wait for them to accept. ${TEAM_MIN - members} more needed to register.`}</Text>
          {manager ? <Button label="Register team" disabled={!ready} loading={register.busy} onPress={register.onRegister} /> : null}
        </>
      ) : (
        <Text style={s.muted}>{`${members} of ${TEAM_MAX} players${invited > 0 ? ` · ${invited} invited` : ''}`}</Text>
      )}
    </Card>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  card: { gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: { ...typography.headlineMd, color: c.text, textAlign: 'center', flexShrink: 1 },
  progressText: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  count: { ...typography.labelMd, color: c.text },
  muted: { ...typography.bodySm, color: c.textMuted },
  track: { height: sizes.progressBar, borderRadius: radius.pill, backgroundColor: c.surfaceRaised, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
