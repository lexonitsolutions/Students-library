import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BookMarked, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { notifications as allNotifications } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { NotificationList } from './NotificationList';

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const unreadCount = allNotifications.filter((notification) => !notification.read).length;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-card-border bg-surface/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary lg:hidden">
        <BookMarked size={18} />
      </div>

      <div className="relative flex-1 max-w-xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" size={18} />
        <input
          type="search"
          placeholder="Search materials, subjects, authors..."
          aria-label="Search materials"
          className="h-11 w-full rounded-lg border border-transparent bg-surface-container-low pl-10 pr-4 text-body-sm text-on-surface placeholder:text-outline focus:border-primary-container focus:bg-white focus:outline-none"
        />
      </div>

      <div className="relative ml-auto flex items-center gap-1.5 sm:gap-2">
        <div className="relative">
          <IconButton
            label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            onClick={() => (isDesktop ? setNotificationsOpen((open) => !open) : navigate('/notifications'))}
          >
            <Bell size={20} />
          </IconButton>
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
          )}

          <AnimatePresence>
            {notificationsOpen && isDesktop && (
              <>
                <button
                  aria-label="Close notifications"
                  className="fixed inset-0 z-30 cursor-default"
                  onClick={() => setNotificationsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 top-12 z-40 w-96 rounded-xl border border-card-border bg-white p-3 shadow-card-hover"
                >
                  <p className="px-1 pb-2 text-headline-md text-on-surface">Notifications</p>
                  <NotificationList notifications={allNotifications} compact />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <IconButton label="Settings" onClick={() => navigate('/settings')}>
          <Settings size={20} />
        </IconButton>

        <button
          type="button"
          onClick={() => navigate('/profile')}
          aria-label="View profile"
          className="ml-1 cursor-pointer"
        >
          <Avatar name={user?.name ?? 'User'} src={user?.avatar} size={36} />
        </button>
      </div>
    </header>
  );
}

export default TopBar;
