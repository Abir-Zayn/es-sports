import { useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import Bell from 'lucide-react-native/icons/bell';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { InviteCard } from './components/invite-card';
import { MatchUpdateCard } from './components/match-update-card';
import { NotificationDetailModal } from './components/notification-detail-modal';
import { NotificationRow } from './components/notification-row';
import { NotificationTabs } from './components/notification-tabs';
import { SquadAlertCard } from './components/squad-alert-card';
import type { AppNotification, NotificationFilterTab } from './types';
import { useNotifications } from './use-notifications';

function matchesTab(item: AppNotification, tab: NotificationFilterTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'invites') return item.kind === 'invite' || item.kind === 'invite_response';
  if (tab === 'squad_alerts') return item.kind === 'squad_alert';
  return item.kind === 'match_update';
}

export function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [tab, setTab] = useState<NotificationFilterTab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { notifications, unreadCount, isResponding, error, markAllRead, markRead, respondToInvite } =
    useNotifications();

  const filtered = notifications.filter((item) => matchesTab(item, tab));
  const selectedItem = selectedId ? (notifications.find((item) => item.id === selectedId) ?? null) : null;

  function openItem(item: AppNotification) {
    markRead(item.id);
    const assigned = item.meta?.scorerAssignment;
    if (assigned) router.push({ pathname: '/scorer/[id]', params: { id: assigned.matchId } });
    else setSelectedId(item.id);
  }

  function renderItem({ item }: { item: AppNotification }) {
    if (item.kind === 'invite' || item.kind === 'invite_response') {
      return (
        <InviteCard
          item={item}
          busy={isResponding}
          onOpen={() => openItem(item)}
          onRespond={item.kind === 'invite' ? (status) => respondToInvite(item.id, status) : undefined}
        />
      );
    }
    if (item.kind === 'squad_alert') {
      return (
        <SquadAlertCard
          item={item}
          onOpen={() => {
            markRead(item.id);
            const id = item.meta?.squadAlert?.tournamentId;
            if (id) router.push({ pathname: '/tournament/[id]', params: { id } });
            else setSelectedId(item.id);
          }}
        />
      );
    }
    if (item.kind === 'match_update') {
      return (
        <MatchUpdateCard
          item={item}
          onOpen={() => {
            const match = item.meta?.matchUpdate;
            if (!match?.matchId) return;
            markRead(item.id);
            if (match.status === 'completed') router.push({ pathname: '/match/[id]/scorecard', params: { id: match.matchId } });
            else router.push({ pathname: '/match/[id]', params: { id: match.matchId } });
          }}
        />
      );
    }
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open notification: ${item.title}`}
        onPress={() => openItem(item)}
      >
        <NotificationRow item={item} icon={<Bell size={sizes.icon} color={colors.link} />} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        >
          <ArrowLeft color={colors.text} size={sizes.icon} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={markAllRead} disabled={unreadCount === 0} style={styles.mark}>
          <Text style={[styles.markText, unreadCount === 0 ? styles.disabled : null]}>Mark all as read</Text>
        </Pressable>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 ? <Text style={styles.pill}>{unreadCount} unread</Text> : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={styles.errorBanner}>
          {error}
        </Text>
      ) : null}
      <View>
        <NotificationTabs selected={tab} onSelect={setTab} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All caught up</Text>
            <Text style={styles.emptyText}>No notifications in this category.</Text>
          </View>
        }
      />
      <NotificationDetailModal
        item={selectedItem}
        busy={isResponding}
        error={error}
        onClose={() => setSelectedId(null)}
        onRespond={
          selectedItem && selectedItem.kind === 'invite'
            ? (status) => respondToInvite(selectedItem.id, status)
            : undefined
        }
      />
    </View>
  );
}

const createStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    top: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    back: { width: sizes.iconButton, height: sizes.iconButton, borderRadius: radius.pill, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', ...shadows.iconButton },
    pressed: { transform: [{ scale: 0.95 }] },
    mark: { minHeight: dp(48), justifyContent: 'center' },
    markText: { ...typography.labelMd, color: c.link },
    disabled: { color: c.textMuted },
    titleRow: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
    title: { ...typography.displayMd, color: c.text },
    pill: { ...typography.labelSm, color: c.link, backgroundColor: c.primarySoft, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, overflow: 'hidden', borderRadius: radius.pill },
    errorBanner: { ...typography.bodyMd, color: c.dangerSoftText, paddingHorizontal: sizes.gutter, paddingBottom: spacing.md },
    list: { flexGrow: 1, paddingHorizontal: sizes.gutter, paddingTop: spacing.md, gap: spacing.md },
    empty: { padding: spacing.xxl, alignItems: 'center', gap: spacing.sm },
    emptyTitle: { ...typography.headlineMd, color: c.text },
    emptyText: { ...typography.bodyMd, color: c.textMuted, textAlign: 'center' },
  });
