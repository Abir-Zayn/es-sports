import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, AppIconTile, Button, Card, InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, sizes, spacing, useTheme } from '@/theme';

import { fetchMyTournaments, myTournamentsKey, RESTORE_DAYS, type MyTournament } from '../data/tournament-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { ConfirmSheet } from '../roster/components/confirm-sheet';
import { formatDate, oversLabel } from './draft';
import { useTournamentTrash } from './use-tournament-trash';

/** Tournaments this account runs, from the server. */
export function MyTournamentsSection({ userId }: { userId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const [deleting, setDeleting] = useState<MyTournament | null>(null);
  const { remove } = useTournamentTrash(userId);
  const close = () => { setDeleting(null); remove.reset(); };
  const mine = useQuery({ queryKey: myTournamentsKey(userId), queryFn: () => fetchMyTournaments(userId), enabled: Boolean(userId) });
  if (!userId) return null;
  return (
    <View style={styles.stack}>
      <Text variant="heading" accessibilityRole="header">Your tournaments</Text>
      {mine.isPending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading your tournaments" /> : null}
      {mine.isError ? (
        <Card padding="tight" style={styles.stack}>
          <Text muted>Could not load your tournaments.</Text>
          <Button label="Try again" variant="secondary" onPress={() => void mine.refetch()} />
        </Card>
      ) : null}
      {mine.isSuccess && mine.data.length === 0 ? (
        <Card padding="tight" style={styles.details}>
          <Text variant="headlineMd">No tournaments yet</Text>
          <Text muted>Tournaments you organise or moderate will appear here.</Text>
        </Card>
      ) : null}
      {(mine.data ?? []).map((tournament) => (
        <TournamentRow
          key={tournament.id}
          tournament={tournament}
          onPress={() => router.push({ pathname: '/tournament/[id]', params: { id: tournament.id } })}
          onDelete={() => { remove.reset(); setDeleting(tournament); }}
        />
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

type RowProps = {
  tournament: MyTournament;
  onPress: () => void;
  onDelete: () => void;
};

function TournamentRow({ tournament, onPress, onDelete }: RowProps) {
  const { colors } = useTheme();
  const isOwner = tournament.myRole === 'owner';
  const role = isOwner ? 'Organiser' : 'Moderator';
  const placeAndDate = [tournament.city, formatDate(tournament.startDate)].filter(Boolean).join(' · ');
  const format = `${oversLabel(tournament.overs)} · ${tournament.teamsPlanned} teams`;
  return (
    <Card padding="none" style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${tournament.name}`}
        accessibilityHint={`${role}. ${placeAndDate}. ${format}.`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <InitialsAvatar
          label={initialsOf(tournament.name)}
          imageUri={tournament.profileUrl}
          shape="square"
          size={dp(48)}
        />
        <View style={styles.info}>
          <Text variant="headlineMd">{tournament.name}</Text>
          <Text variant="caption" muted>{placeAndDate}</Text>
          <Text variant="caption" muted>{format}</Text>
          <AppBadge label={role} color={colors.textMuted} />
        </View>
        <ChevronRight size={sizes.iconSmall} color={colors.textMuted} />
      </Pressable>
      {isOwner ? (
        <AppIconTile
          icon={Trash}
          size={Math.max(48, sizes.iconButton)}
          iconSize={sizes.iconSmall}
          backgroundColor={colors.surface}
          iconColor={colors.textMuted}
          accessibilityLabel={`Delete ${tournament.name}`}
          onPress={onDelete}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
  details: { gap: spacing.xs },
  card: { flexDirection: 'row', alignItems: 'center', paddingEnd: spacing.sm },
  row: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingStart: spacing.lg, paddingEnd: spacing.sm, paddingVertical: spacing.lg,
  },
  info: { flex: 1, minWidth: 0, gap: spacing.xs },
  pressed: { transform: [{ scale: 0.95 }] },
});
