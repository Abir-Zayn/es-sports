import { useQuery } from '@tanstack/react-query';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { ScreenHeader } from '@/features/profile/components/screen-header';
import { dp, radius, shadows, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { deletedTournamentsKey, fetchDeletedTournaments, RESTORE_DAYS, restoreDaysLeft } from '../data/tournament-repository';
import { tournamentErrorText } from '../data/tournament-errors';
import { formatDate } from './draft';
import { useTournamentTrash } from './use-tournament-trash';

const daysLeftLabel = (days: number) => (days <= 1 ? 'Last day to restore' : `${days} days left to restore`);

/** Tournaments the owner deleted in the last 3 days, each with a Restore button. Found from the Profile screen. */
export function DeletedTournamentsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { restore } = useTournamentTrash(userId);
  const deleted = useQuery({ queryKey: deletedTournamentsKey(userId), queryFn: () => fetchDeletedTournaments(userId), enabled: Boolean(userId) });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScreenHeader title="Recently deleted" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <Text muted>{`Deleted tournaments stay here for ${RESTORE_DAYS} days. Restore one to bring back its teams, staff and schedule; after that it is deleted for good.`}</Text>
        {restore.isError ? <Text accessibilityRole="alert" style={styles.error}>{tournamentErrorText(restore.error)}</Text> : null}
        {deleted.isPending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading deleted tournaments" /> : null}
        {deleted.isError ? (
          <View style={styles.center}>
            <Text muted>Could not load your deleted tournaments.</Text>
            <Button label="Try again" variant="secondary" onPress={() => void deleted.refetch()} />
          </View>
        ) : null}
        {deleted.isSuccess && deleted.data.length === 0 ? (
          <View style={styles.empty}>
            <Trash size={dp(36)} color={colors.textMuted} strokeWidth={1.4} />
            <Text variant="heading">Nothing here</Text>
            <Text muted style={styles.centerText}>Tournaments you delete appear here and can be restored for {RESTORE_DAYS} days.</Text>
          </View>
        ) : null}
        {(deleted.data ?? []).map((t) => {
          const days = t.deletedAt ? restoreDaysLeft(t.deletedAt) : 0;
          const busy = restore.isPending && restoringId === t.id;
          return (
            <View key={t.id} style={styles.card}>
              <View style={styles.top}>
                <Text variant="heading" style={styles.name} numberOfLines={1}>{t.name}</Text>
                <AppBadge label={daysLeftLabel(days)} backgroundColor={days <= 1 ? colors.dangerSoft : colors.surfaceRaised}
                  color={days <= 1 ? colors.dangerSoftText : colors.textMuted} />
              </View>
              <Text muted>{`${t.city} · ${formatDate(t.startDate)}`}</Text>
              {t.deletedAt ? <Text variant="caption" muted>{`Deleted ${new Date(t.deletedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}</Text> : null}
              <Button label="Restore" variant="secondary" size="compact" loading={busy} disabled={restore.isPending && !busy}
                accessibilityLabel={`Restore ${t.name}`} onPress={() => { setRestoringId(t.id); restore.mutate(t.id); }} />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.gutter, gap: spacing.lg, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: sizes.cardPadding, gap: spacing.sm, alignItems: 'flex-start', ...shadows.card },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
  name: { flex: 1, minWidth: 0 },
  error: { color: colors.dangerSoftText },
  center: { alignItems: 'center', gap: spacing.md },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  centerText: { textAlign: 'center' },
});
