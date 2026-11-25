import { useMutation, useQueryClient } from '@tanstack/react-query';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { respondTeamSync } from '@/features/team/data/team-sync';
import { teamErrorText } from '@/features/team/data/team-errors';
import { sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { AppNotification } from '../types';
import { NotificationRow } from './notification-row';

const outcome = { accepted: 'Added to the team record', declined: 'Not added', expired: 'This request has expired' } as const;

/** A request to add a finished tournament or friendly to the team's record; the team owner accepts or declines it. */
export function TeamSyncCard({ item, notificationsKey }: { item: AppNotification; notificationsKey: readonly unknown[] }) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const client = useQueryClient();
  const sync = item.meta.teamSync;
  const respond = useMutation({
    mutationFn: (accept: boolean) => respondTeamSync(sync?.syncId ?? '', accept),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: notificationsKey });
      if (sync?.teamId) void client.invalidateQueries({ queryKey: ['team-history', sync.teamId] });
    },
  });
  const pending = sync?.status === 'pending' && !respond.isSuccess;
  return (
    <NotificationRow item={item} icon={<RefreshCw size={sizes.icon} color={colors.link} />}>
      {pending ? (
        <View style={s.actions}>
          <Button label="Accept" size="compact" loading={respond.isPending && respond.variables === true} disabled={respond.isPending}
            accessibilityLabel={`Accept: ${item.title}`} onPress={() => respond.mutate(true)} />
          <Button label="Decline" size="compact" variant="secondary" loading={respond.isPending && respond.variables === false}
            disabled={respond.isPending} accessibilityLabel={`Decline: ${item.title}`} onPress={() => respond.mutate(false)} />
        </View>
      ) : sync && sync.status !== 'pending' ? <Text style={s.status}>{outcome[sync.status]}</Text> : null}
      {respond.isError ? <Text accessibilityRole="alert" style={s.error}>{teamErrorText(respond.error)}</Text> : null}
    </NotificationRow>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  status: { ...typography.labelMd, color: c.textMuted, marginTop: spacing.sm },
  error: { ...typography.bodySm, color: c.dangerSoftText, marginTop: spacing.xs },
});
