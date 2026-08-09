import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BookMarked, Moon, Search, Settings, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import { notifications as allNotifications } from '../../data/mockData';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { NotificationList } from './NotificationList';

export function TopBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState(allNotifications);
  const unreadCount = notificationsList.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleGlobalClick = () => {
      setNotificationsOpen(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('click', handleGlobalClick);
    }, 10);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [notificationsOpen]);

  const handleDeleteNotification = (id: string) => {
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-9 w-16 items-center rounded-full border border-card-border bg-surface-container-low p-1 transition-all duration-300 hover:border-primary/50"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full shadow-sm transition-all duration-300"
            style={{
              transform: isDark ? 'translateX(28px)' : 'translateX(0)',
              backgroundColor: isDark ? '#818cf8' : '#1e3a8a',
            }}
          >
            {isDark
              ? <Moon size={14} className="text-white" />
              : <Sun size={14} className="text-white" />
            }
          </span>
        </button>

        <div className="relative">
          <IconButton
            label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isDesktop) {
                setNotificationsOpen((open) => !open);
              } else {
                navigate('/notifications');
              }
            }}
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
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 z-40 w-96 rounded-xl border border-card-border bg-white p-3 shadow-card-hover"
                >
                  <p className="px-1 pb-2 text-headline-md text-on-surface">Notifications</p>
                  <NotificationList
                    notifications={notificationsList}
                    onMarkAllRead={handleMarkAllRead}
                    onDeleteNotification={handleDeleteNotification}
                    compact
                  />
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
