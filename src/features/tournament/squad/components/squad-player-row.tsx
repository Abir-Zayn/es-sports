import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui';
import { spacing } from '@/theme';

import { PersonRow } from '../../roster/components/person-row';
import type { TournamentPlayer } from '../../roster/types';

type Props = {
  player: TournamentPlayer;
  /** The team owner sees actions; everyone else only looks. */
  canManage: boolean;
  busy: boolean;
  onShare: () => void;
  onRemove: () => void;
};

function badgeOf(player: TournamentPlayer): { label: string; tone: 'primary' | 'muted' } | undefined {
  if (player.addedDuringTournament) return { label: 'Late change', tone: 'muted' };
  if (!player.userId) return { label: 'Guest', tone: 'muted' };
  return undefined;
}

/** One squad player: their role, whether they are a guest still to claim the profile, and the owner's actions. */
export function SquadPlayerRow({ player, canManage, busy, onShare, onRemove }: Props) {
  const guest = !player.userId;
  const detail = guest ? `${player.role} · not on esSports yet` : player.role;
  return (
    <View>
      <PersonRow user={{ id: player.id, name: player.name, area: null, avatarUrl: null }} detail={detail} badge={badgeOf(player)} />
      {canManage ? (
        <View style={styles.actions}>
          {guest && player.claimToken ? (
            <Button label="Share claim link" variant="secondary" size="compact" accessibilityLabel={`Share claim link with ${player.name}`} onPress={onShare} />
          ) : null}
          <Button label="Remove" variant="ghost" size="compact" disabled={busy} accessibilityLabel={`Remove ${player.name}`} onPress={onRemove} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginLeft: 52, paddingBottom: spacing.sm },
});
