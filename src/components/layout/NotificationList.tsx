import { AnimatePresence, motion } from 'framer-motion';
import { BellOff, CheckCheck, CloudCheck, Megaphone, Trash2, TrendingUp } from 'lucide-react';
import type { AppNotification, NotificationType } from '../../data/types';
import { cn } from '../../lib/cn';

export interface NotificationListProps {
  readonly notifications: readonly AppNotification[];
  readonly onMarkAllRead?: () => void;
  readonly onDeleteNotification?: (id: string) => void;
  readonly compact?: boolean;
}

const iconByType: Record<NotificationType, typeof CloudCheck> = {
  download: CloudCheck,
  approval: CloudCheck,
  comment: Megaphone,
  system: Megaphone,
  save: TrendingUp,
};

export function NotificationList({
  notifications,
  onMarkAllRead,
  onDeleteNotification,
  compact,
}: Readonly<NotificationListProps>) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-low text-outline mb-2">
          <BellOff size={20} />
        </div>
        <p className="text-body-sm font-medium text-on-surface">No notifications</p>
        <p className="text-label-sm text-on-surface-variant">You&apos;re all caught up!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {onMarkAllRead && notifications.some((n) => !n.read) && (
        <div className="flex items-center justify-end px-1 pb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMarkAllRead();
            }}
            className="flex items-center gap-1.5 text-label-sm font-semibold text-primary cursor-pointer hover:opacity-80 transition-opacity"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        </div>
      )}
      <ul className="flex flex-col divide-y divide-card-border">
        <AnimatePresence initial={false}>
          {notifications.map((notification) => {
            const Icon = iconByType[notification.type];
            return (
              <motion.li
                key={notification.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className={cn('group flex items-start gap-3 py-3.5', compact ? 'px-1' : 'px-1 sm:px-2')}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container/10 text-primary-container">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-body-sm font-semibold text-on-surface">{notification.title}</p>
                    {!notification.read && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-label-sm text-on-surface-variant">{notification.description}</p>
                  <p className="mt-1 text-label-sm text-outline">{notification.timestamp}</p>
                </div>
                {onDeleteNotification && (
                  <button
                    type="button"
                    aria-label="Delete notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNotification(notification.id);
                    }}
                    className="shrink-0 text-outline hover:text-error cursor-pointer p-1 rounded transition-colors opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export default NotificationList;
