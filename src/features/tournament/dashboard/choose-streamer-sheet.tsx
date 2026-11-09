import { View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import type { PersonRecord } from '../data/tournament-repository';
import { Sheet } from '../roster/components/sheet';
import { useStreamerActions } from './use-streamer-actions';

type Props = { tournamentId: string; fixtureId: string; moderators: PersonRecord[]; currentId: string | null; onClose: () => void };

/** The owner picks which moderator streams this match on Facebook Live. */
export function ChooseStreamerSheet({ tournamentId, fixtureId, moderators, currentId, onClose }: Props) {
  const { colors } = useTheme();
  const { assign, clear, error, busy } = useStreamerActions(tournamentId, fixtureId);
  const done = { onSuccess: onClose };
  return (
    <Sheet visible title="Who streams this match?" onClose={busy ? () => {} : onClose}>
      <Text muted>Only a tournament moderator can stream. The streamer films the match and it goes out live on Facebook.</Text>
      {moderators.length === 0 ? <Text accessibilityRole="alert">Add a moderator to the tournament first (Overview tab).</Text> : null}
      <View style={{ gap: spacing.sm }}>
        {moderators.map((person) => (
          <Button key={person.id} label={person.id === currentId ? `${person.name} (current)` : person.name}
            variant={person.id === currentId ? 'primary' : 'secondary'} disabled={busy} onPress={() => assign.mutate(person.id, done)} />
        ))}
        {currentId ? <Button label="Remove streamer" variant="ghost" disabled={busy} onPress={() => clear.mutate(undefined, done)} /> : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{tournamentErrorText(error)}</Text> : null}
    </Sheet>
  );
}
