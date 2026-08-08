import { motion } from 'framer-motion';
import { CheckCheck, CloudCheck, Megaphone, TrendingUp } from 'lucide-react';
import type { AppNotification, NotificationType } from '../../data/types';
import { cn } from '../../lib/cn';

export interface NotificationListProps {
  readonly notifications: readonly AppNotification[];
  readonly onMarkAllRead?: () => void;
  readonly compact?: boolean;
}

const iconByType: Record<NotificationType, typeof CloudCheck> = {
  download: CloudCheck,
  approval: CloudCheck,
  comment: Megaphone,
  system: Megaphone,
  save: TrendingUp,
};

export function NotificationList({ notifications, onMarkAllRead, compact }: Readonly<NotificationListProps>) {
  return (
    <div className="flex flex-col">
      {onMarkAllRead && (
        <div className="flex items-center justify-end px-1 pb-2">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-label-sm font-semibold text-primary cursor-pointer"
          >
            <CheckCheck size={16} />
            Mark all as read
          </button>
        </div>
      )}
      <ul className="flex flex-col divide-y divide-card-border">
        {notifications.map((notification, index) => {
          const Icon = iconByType[notification.type];
          return (
            <motion.li
              key={notification.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className={cn('flex gap-3 py-3.5', compact ? 'px-1' : 'px-1 sm:px-2')}
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
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export default NotificationList;
