import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { fetchMyTournaments, myTournamentsKey } from '../data/tournament-repository';
import { formatDate } from './draft';

/** Tournaments this account runs, from the server. Drafts above are on this device only. */
export function MyTournamentsSection({ userId }: { userId: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
          </View>
          <Text muted>{`${tournament.city} · ${formatDate(tournament.startDate)}`}</Text>
          <Text variant="caption" muted>{`${tournament.matchFormat} · ${tournament.teamsPlanned} teams`}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  stack: { gap: spacing.lg },
  gap: { gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.xs },
  pressed: { opacity: 0.75 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  name: { flex: 1, minWidth: 0 },
});
