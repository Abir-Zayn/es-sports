import { useSyncExternalStore } from 'react';
import { notificationsStore } from './notifications-store';

export function useNotifications() {
  const notifications = useSyncExternalStore(notificationsStore.subscribe, notificationsStore.getSnapshot, notificationsStore.getSnapshot);
  return { notifications, unreadCount: notifications.filter((item) => !item.isRead).length, ...notificationsStore };
}
