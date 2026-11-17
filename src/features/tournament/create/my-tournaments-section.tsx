import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppIconTile, Button, Text } from '@/components/ui';
import { radius, shadows, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { fetchMyTournaments, myTournamentsKey, RESTORE_DAYS, type MyTournament } from '../data/tournament-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { formatDate, oversLabel } from './draft';
import { useTournamentTrash } from './use-tournament-trash';

/** Tournaments this account runs, from the server. Drafts above are on this device only. */
export function MyTournamentsSection({ userId }: { userId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [deleting, setDeleting] = useState<MyTournament | null>(null);
  const { remove } = useTournamentTrash(userId);
  const close = () => { setDeleting(null); remove.reset(); };
  const mine = useQuery({ queryKey: myTournamentsKey(userId), queryFn: () => fetchMyTournaments(userId), enabled: Boolean(userId) });
  if (!userId || (mine.isSuccess && mine.data.length === 0)) return null;
  return (
    <View style={styles.stack}>
      <Text variant="heading" accessibilityRole="header">Your tournaments</Text>
      {mine.isPending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading your tournaments" /> : null}
      {mine.isError ? (
        <View style={styles.gap}>
          <Text muted>Could not load your tournaments.</Text>
          <Button label="Try again" variant="secondary" onPress={() => void mine.refetch()} />
        </View>
      ) : null}
      {(mine.data ?? []).map((tournament) => (
        <Pressable key={tournament.id} accessibilityRole="button" accessibilityLabel={`Open ${tournament.name}`}
          onPress={() => router.push({ pathname: '/tournament/[id]', params: { id: tournament.id } })}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
          <View style={styles.top}>
            <Text variant="heading" style={styles.name} numberOfLines={1}>{tournament.name}</Text>
            <AppBadge label={tournament.myRole === 'owner' ? 'Organiser' : 'Moderator'} />
            {tournament.myRole === 'owner' ? (
              <AppIconTile icon={Trash} size={sizes.iconButton} backgroundColor={colors.dangerSoft} iconColor={colors.dangerSoftText}
                accessibilityLabel={`Delete ${tournament.name}`} onPress={() => { remove.reset(); setDeleting(tournament); }} />
            ) : null}
          </View>
          <Text muted>{`${tournament.city} · ${formatDate(tournament.startDate)}`}</Text>
          <Text variant="caption" muted>{`${oversLabel(tournament.overs)} · ${tournament.teamsPlanned} teams`}</Text>
        </Pressable>
      ))}
      <ConfirmSheet
        visible={deleting !== null}
        title="Delete tournament?"
        message={deleting ? `${deleting.name} is hidden from everyone and moved to Recently deleted in your Profile. You can restore it for ${RESTORE_DAYS} days; after that it is deleted for good.` : ''}
        confirmLabel="Delete tournament"
        busy={remove.isPending}
        error={remove.isError ? tournamentErrorText(remove.error) : null}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: close })}
        onClose={close}
      />
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  stack: { gap: spacing.lg },
  gap: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: sizes.cardPadding, gap: spacing.xs, ...shadows.card },
  pressed: { transform: [{ scale: 0.95 }] },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  name: { flex: 1, minWidth: 0 },
});
