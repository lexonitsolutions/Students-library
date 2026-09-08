import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BookMarked, Moon, Settings, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import type { AppNotification } from '../../data/types';
import * as notificationsService from '../../services/notificationsService';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';
import { NotificationList } from './NotificationList';
import { GlobalSearch } from './GlobalSearch';

export function TopBar() {
  const { user, isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { theme, cycleTheme } = useDarkMode();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsList, setNotificationsList] = useState<AppNotification[]>([]);
  const unreadCount = notificationsList.filter((notification) => !notification.read).length;

  useEffect(() => {
    if (!user || isExploring) return;

    const fetchNotifs = () => {
      notificationsService.listNotifications(user.id).then(setNotificationsList);
    };

    fetchNotifs();

    window.addEventListener('refresh_notifications', fetchNotifs);
    return () => window.removeEventListener('refresh_notifications', fetchNotifs);
  }, [user, isExploring]);

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
    notificationsService.deleteNotification(id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user && !isExploring) notificationsService.markAllRead(user.id).catch(() => {});
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 flex h-16 items-center gap-4 border-b border-card-border bg-surface-container-low px-4 sm:px-6 lg:px-4 shadow-xs">
      {/* Brand & Logo on Left */}
      <div
        className="flex items-center gap-3 w-56 shrink-0 cursor-pointer select-none"
        onClick={() => navigate('/')}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-xs">
          <BookMarked size={20} />
        </div>
        <div>
          <p className="text-body-md font-bold tracking-tight text-on-surface">QuickLearnit</p>
          <p className="text-[11px] font-medium text-on-surface-variant">Student Learning Platform</p>
        </div>
      </div>

      {/* ── Centered Global Search ── */}
      <div className="hidden flex-1 justify-center lg:flex">
        <GlobalSearch />
      </div>

      <div className="relative ml-auto flex items-center gap-1.5 sm:gap-2">
        {/* Theme toggle (desktop only) - 2-state Light / Dark */}
        <button
          onClick={cycleTheme}
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="hidden h-8 w-14 items-center rounded-full border border-card-border bg-surface-container p-0.5 transition-all duration-200 hover:border-primary/50 lg:flex relative cursor-pointer"
        >
          <span
            className="flex h-6.5 w-6.5 items-center justify-center rounded-full shadow-xs transition-all duration-200 absolute left-0.5"
            style={{
              transform: theme === 'dark' ? 'translateX(24px)' : 'translateX(0)',
              backgroundColor: theme === 'dark' ? '#6366D8' : '#F1F5F9',
            }}
          >
            {theme === 'dark' ? (
              <Moon size={13} className="text-white" />
            ) : (
              <Sun size={13} className="text-amber-500" />
            )}
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
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 z-40 w-96 rounded-2xl border border-card-border bg-surface-container-low p-3 shadow-2xl"
                >
                  <p className="px-2 py-1 text-label-md font-bold text-on-surface">Notifications</p>
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

        {isExploring ? (
          <button
            type="button"
            onClick={() => openSignupModal()}
            aria-label="Guest User"
            title="Guest Mode — Click to Sign Up"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <User size={18} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="View profile"
            className="ml-1 cursor-pointer"
          >
            <Avatar name={user?.name ?? 'User'} src={user?.avatar} size={36} />
          </button>
        )}
      </div>
    </header>
  );
}

export default TopBar;
