import { useState } from 'react';

import { Button, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme';

import { Sheet } from '../../roster/components/sheet';
import type { TournamentPlayer } from '../../roster/types';

type Props = {
  player: TournamentPlayer | null;
  locked: boolean;
  removing: boolean;
  error: string | null;
  onRemove: (reason: string) => void;
  onClose: () => void;
};

/** Asks before a player leaves the squad. Once the rosters lock it warns that the organisers are alerted, and asks why. */
export function RemovePlayerSheet({ player, onClose, ...form }: Props) {
  return (
    <Sheet visible={player !== null} title="Remove player?" onClose={onClose}>
      {player ? <RemoveForm player={player} onClose={onClose} {...form} /> : null}
    </Sheet>
  );
}

function RemoveForm({ player, locked, removing, error, onRemove, onClose }: Props & { player: TournamentPlayer }) {
  const { colors } = useTheme();
  const [reason, setReason] = useState('');
  return (
    <>
      <Text muted>{`${player.name} will leave the squad.`}</Text>
      {locked ? (
        <>
          <Text style={{ color: colors.accent }}>
            The tournament has started. The tournament owner and moderators will be alerted to this change, with your reason.
          </Text>
          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="e.g. Injury, tactical replacement" maxLength={120} autoFocus />
        </>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <Button label="Remove player" loading={removing} onPress={() => onRemove(reason)} />
      <Button label="Keep them" variant="secondary" disabled={removing} onPress={onClose} />
    </>
  );
}
