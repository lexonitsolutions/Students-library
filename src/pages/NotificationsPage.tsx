import { useEffect, useState } from 'react';
import { NotificationList } from '../components/layout/NotificationList';
import type { AppNotification } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import * as notificationsService from '../services/notificationsService';

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    notificationsService.listNotifications(user.id).then(setItems);
  }, [user]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    if (user) notificationsService.markAllRead(user.id).catch(() => {});
  };

  const deleteNotification = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    notificationsService.deleteNotification(id).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">Notifications</h1>
      <p className="mt-1 text-body-md font-medium text-on-surface-variant">Stay updated with your latest academic activities.</p>

      <div className="mt-6">
        <NotificationList
          notifications={items}
          onMarkAllRead={markAllRead}
          onDeleteNotification={deleteNotification}
        />
      </div>
    </div>
  );
}

export default NotificationsPage;
