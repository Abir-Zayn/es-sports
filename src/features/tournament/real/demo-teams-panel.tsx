import { useMutation, useQueryClient } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { clearDemoTeams, seedDemoTeams } from '../data/demo-teams';
import { tournamentErrorText } from '../data/tournament-errors';
import { tournamentKey } from '../data/tournament-repository';

/** Owner-only test aid: fill the empty seats with demo teams, or take them out again. */
export function DemoTeamsPanel({ tournamentId }: { tournamentId: string }) {
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: tournamentKey(tournamentId) });
  const seed = useMutation({ mutationFn: () => seedDemoTeams(tournamentId), onSuccess: refresh });
  const clear = useMutation({ mutationFn: () => clearDemoTeams(tournamentId), onSuccess: refresh });
  const error = seed.error ?? clear.error;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Testing tools</Text>
      <Text muted variant="caption">Fills the empty seats with computer-made teams that have full squads, so you can test with two phones.</Text>
      <Button label="Fill with demo teams" variant="secondary" loading={seed.isPending} onPress={() => seed.mutate()} />
      <Button label="Remove demo teams" variant="secondary" loading={clear.isPending} onPress={() => clear.mutate()} />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(error)}</Text> : null}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  box: { gap: spacing.sm, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, borderRadius: 12 },
  title: { fontWeight: '700' },
  error: { color: colors.danger },
});
