import { sampleNotifications } from './sample-notifications';
import type { AppNotification, InviteMeta } from './types';

type Listener = () => void;
let notifications: AppNotification[] = sampleNotifications.map((item) => ({ ...item, meta: { ...item.meta } }));
const listeners = new Set<Listener>();
const publish = (next: AppNotification[]) => {
  if (next.length === notifications.length && next.every((item, index) => item === notifications[index])) return;
  notifications = next;
  listeners.forEach((listener) => listener());
};
export const notificationsStore = {
  getSnapshot: () => notifications,
  subscribe: (listener: Listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
  markRead: (id: string) => publish(notifications.map((item) => item.id === id && !item.isRead ? { ...item, isRead: true } : item)),
  markAllRead: () => publish(notifications.map((item) => item.isRead ? item : { ...item, isRead: true })),
  respondToInvite: (id: string, status: Exclude<InviteMeta['status'], 'pending'>) => publish(notifications.map((item) => {
    const invite = item.meta?.invite;
    if (item.id !== id || item.kind !== 'invite' || invite?.status !== 'pending') return item;
    return { ...item, isRead: true, meta: { ...item.meta, invite: { ...invite, status } } };
  })),
  reset: () => publish(sampleNotifications.map((item) => ({ ...item, meta: { ...item.meta } }))),
};
