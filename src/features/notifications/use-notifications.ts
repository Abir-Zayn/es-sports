import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-provider';
import {
  acceptInvitation,
  declineInvitation,
  invitationErrorText,
  invitationsKey,
  toInvitationError,
} from '@/features/invitations';
import { queryClient as defaultQueryClient } from '@/lib/query-client';

import { watchNotifications } from './notifications-channel';
import { fetchNotifications, markNotificationsRead } from './notifications-repository';
import type { AppNotification } from './types';

export const notificationsKey = ['notifications'] as const;

function useSafeQueryClient(): QueryClient {
  try {
    return useQueryClient();
  } catch {
    return defaultQueryClient;
  }
}

function useSignedInUserId(): string | undefined {
  try {
    return useAuth().session?.user.id;
  } catch {
    return undefined;
  }
}

export function useNotifications() {
  const client = useSafeQueryClient();
  const userId = useSignedInUserId();

  const query = useQuery(
    {
      queryKey: notificationsKey,
      queryFn: () => fetchNotifications(),
    },
    client,
  );

  useEffect(() => {
    if (!userId) return;
    return watchNotifications(userId, () => {
      void client.invalidateQueries({ queryKey: notificationsKey });
      void client.invalidateQueries({ queryKey: invitationsKey });
    });
  }, [userId, client]);

  const markReadMutation = useMutation(
    {
      mutationFn: (id: string) => markNotificationsRead([id]),
      onMutate: (id: string) => {
        client.setQueryData<AppNotification[]>(notificationsKey, (prev) =>
          (prev ?? []).map((item) => (item.id === id && !item.isRead ? { ...item, isRead: true } : item)),
        );
      },
      onSettled: () => {
        void client.invalidateQueries({ queryKey: notificationsKey });
      },
    },
    client,
  );

  const markAllReadMutation = useMutation(
    {
      mutationFn: () => markNotificationsRead(null),
      onMutate: () => {
        client.setQueryData<AppNotification[]>(notificationsKey, (prev) =>
          (prev ?? []).map((item) => (item.isRead ? item : { ...item, isRead: true })),
        );
      },
      onSettled: () => {
        void client.invalidateQueries({ queryKey: notificationsKey });
      },
    },
    client,
  );

  const respondMutation = useMutation(
    {
      mutationFn: async ({
        id,
        invitationId,
        status,
      }: {
        id: string;
        invitationId: string;
        status: 'accepted' | 'declined';
      }) => {
        if (status === 'accepted') await acceptInvitation(invitationId);
        else await declineInvitation(invitationId);
        return { id, status };
      },
      onSuccess: ({ id, status }) => {
        client.setQueryData<AppNotification[]>(notificationsKey, (prev) =>
          (prev ?? []).map((item) => {
            const invite = item.meta?.invite;
            if (item.id !== id || !invite) return item;
            return { ...item, isRead: true, meta: { ...item.meta, invite: { ...invite, status } } };
          }),
        );
        void client.invalidateQueries({ queryKey: notificationsKey });
        void client.invalidateQueries({ queryKey: invitationsKey });
      },
      onError: (err: unknown) => {
        if (toInvitationError(err).closed) {
          void client.invalidateQueries({ queryKey: notificationsKey });
          void client.invalidateQueries({ queryKey: invitationsKey });
        }
      },
    },
    client,
  );

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  function markRead(id: string) {
    const target = notifications.find((item) => item.id === id);
    if (target && target.isRead) return;
    markReadMutation.mutate(id);
  }

  function markAllRead() {
    if (unreadCount === 0) return;
    markAllReadMutation.mutate();
  }

  function respondToInvite(id: string, status: 'accepted' | 'declined') {
    const target = notifications.find((item) => item.id === id);
    const invite = target?.meta?.invite;
    if (!target || target.kind !== 'invite' || invite?.status !== 'pending') return;
    respondMutation.mutate({ id, invitationId: invite.invitationId, status });
  }

  return {
    notifications,
    unreadCount,
    isLoading: query.isPending,
    isError: query.isError,
    isResponding: respondMutation.isPending,
    error: respondMutation.isError ? invitationErrorText(respondMutation.error) : null,
    refetch: query.refetch,
    markRead,
    markAllRead,
    respondToInvite,
  };
}
