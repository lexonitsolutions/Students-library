import { useState } from 'react';
import { NotificationList } from '../components/layout/NotificationList';
import { notifications as seedNotifications } from '../data/mockData';

export function NotificationsPage() {
  const [items, setItems] = useState(seedNotifications);

  const markAllRead = () => setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  const deleteNotification = (id: string) => setItems((prev) => prev.filter((item) => item.id !== id));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">Notifications</h1>
      <p className="mt-1 text-body-sm text-on-surface-variant">Stay updated with your latest academic activities.</p>

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
