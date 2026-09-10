import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { NotificationList } from '../components/layout/NotificationList';
import type { AppNotification } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import * as notificationsService from '../services/notificationsService';

export function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!user) return;
    notificationsService.listNotifications(user.id).then((notifs) => {
      const hasUnread = notifs.some((item) => !item.read);
      if (hasUnread) {
        setItems(notifs.map((item) => ({ ...item, read: true })));
        notificationsService.markAllRead(user.id).catch(() => {});
        window.dispatchEvent(new CustomEvent('refresh_notifications'));
      } else {
        setItems(notifs);
      }
    });
  }, [user]);

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    if (user) {
      notificationsService.markAllRead(user.id).catch(() => {});
      window.dispatchEvent(new CustomEvent('refresh_notifications'));
    }
  };

  const deleteNotification = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    notificationsService.deleteNotification(id, user?.id).catch(() => {});
  };

  const displayedItems = showHistory
    ? items.filter(notificationsService.isWithinPastWeek)
    : items;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
              {showHistory ? 'Notification History' : 'Notifications'}
            </h1>
            {showHistory && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                Past 7 Days
              </span>
            )}
          </div>
          <p className="mt-1 text-body-md font-medium text-on-surface-variant">
            {showHistory
              ? 'Showing all notification history from the past 7 days.'
              : 'Stay updated with your latest academic activities.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowHistory((prev) => !prev)}
          title={showHistory ? 'Show all notifications' : 'View past week notification history'}
          aria-label="Notification history"
          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-label-sm font-semibold transition-all shadow-xs cursor-pointer ${
            showHistory
              ? 'border-primary bg-primary text-white shadow-primary/20'
              : 'border-card-border bg-surface-container-low text-on-surface hover:border-primary/50 hover:text-primary'
          }`}
        >
          <History size={17} />
          <span>{showHistory ? 'Show All' : 'Past Week History'}</span>
        </button>
      </div>

      <div className="mt-6">
        <NotificationList
          notifications={displayedItems}
          onMarkAllRead={markAllRead}
          onDeleteNotification={deleteNotification}
          isHistory={showHistory}
          emptyTitle={showHistory ? 'No past week notifications' : 'No notifications'}
          emptySubtitle={
            showHistory
              ? 'No notification activity recorded in the past 7 days.'
              : "You're all caught up!"
          }
        />
      </div>
    </div>
  );
}

export default NotificationsPage;
