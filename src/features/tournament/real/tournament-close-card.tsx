import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Trophy from 'lucide-react-native/icons/trophy';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { tournamentErrorText } from '../data/tournament-errors';
import { fetchStandings, standingsKey } from '../data/standings-repository';
import { myTournamentsKey, tournamentKey, type TournamentRecord } from '../data/tournament-repository';
import { closeTournament } from '../data/tournament-writes';
import { ConfirmSheet } from '../roster/components/confirm-sheet';

/** A closed tournament's banner: the winner, from the top of the final table. Nothing while it is running. */
export function TournamentWinnerCard({ tournament: t }: { tournament: TournamentRecord }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const closed = Boolean(t.closedAt);
  const table = useQuery({ queryKey: standingsKey(t.id), queryFn: () => fetchStandings(t.id), enabled: closed });
  if (!closed) return null;
  const winner = table.data?.[0];
  return (
    <View style={styles.card} accessibilityRole="summary">
      <Trophy size={dp(28)} color={colors.link} />
      <View style={styles.copy}>
        <Text variant="heading">Tournament completed</Text>
        <Text muted>{winner && winner.played > 0 ? `Winner: ${winner.team.name} · ${winner.points} pts` : 'The final table is on the Table tab.'}</Text>
      </View>
    </View>
  );
}

/** The owner's Close button for a running tournament, behind a confirmation. */
export function CloseTournamentButton({ tournament: t, userId }: { tournament: TournamentRecord; userId: string }) {
  const client = useQueryClient();
  const [asking, setAsking] = useState(false);
  const close = useMutation({
    mutationFn: () => closeTournament(t.id),
    onSuccess: () => {
      setAsking(false);
      void client.invalidateQueries({ queryKey: tournamentKey(t.id) });
      void client.invalidateQueries({ queryKey: myTournamentsKey(userId) });
    },
  });
  if (t.closedAt) return null;
  return (
    <>
      <Button label="Close tournament" variant="secondary" onPress={() => { close.reset(); setAsking(true); }} />
      <ConfirmSheet
        visible={asking}
        title="Close tournament?"
        message="Play is over and the table becomes final. Teams, squads and the schedule can no longer be changed. A match still being scored can be finished."
        confirmLabel="Close tournament"
        busy={close.isPending}
        error={close.isError ? tournamentErrorText(close.error) : null}
        onConfirm={() => close.mutate()}
        onClose={() => setAsking(false)}
      />
    </>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: sizes.cardPadding, borderRadius: radius.lg,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary, ...shadows.card },
  copy: { flex: 1, gap: spacing.xs },
});
