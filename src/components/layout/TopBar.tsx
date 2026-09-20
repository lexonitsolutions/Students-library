import { AnimatePresence, motion } from 'framer-motion';
import { Bell, History, Menu, Moon, Settings, Sun, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useIsDesktop } from '../../hooks/useMediaQuery';
import type { AppNotification } from '../../data/types';
import * as notificationsService from '../../services/notificationsService';
import { Avatar } from '../ui/Avatar';
import { Logo } from '../ui/Logo';
import { IconButton } from '../ui/IconButton';
import { NotificationList } from './NotificationList';
import { GlobalSearch } from './GlobalSearch';

interface TopBarProps {
  readonly onMenuOpen?: () => void;
}

export function TopBar({ onMenuOpen }: TopBarProps) {
  const { user, isExploring } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { theme, cycleTheme } = useDarkMode();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
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
  }, [user?.id, isExploring]);

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

  useEffect(() => {
    if (notificationsOpen && notificationsList.some((n) => !n.read)) {
      setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
      if (user && !isExploring) {
        notificationsService.markAllRead(user.id).catch(() => {});
      }
    }
  }, [notificationsOpen, notificationsList, user, isExploring]);

  const handleDeleteNotification = (id: string) => {
    setNotificationsList((prev) => prev.filter((n) => n.id !== id));
    notificationsService.deleteNotification(id, user?.id).catch(() => {});
  };

  const handleMarkAllRead = () => {
    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
    if (user && !isExploring) notificationsService.markAllRead(user.id).catch(() => {});
  };

  return (
    <header className="sticky top-0 z-30 shrink-0 flex h-16 items-center gap-2 sm:gap-4 border-b border-card-border bg-surface-container-low px-3 sm:px-4 lg:px-6 2xl:px-8 shadow-xs">
      {/* Hamburger button – mobile and tablet screens */}
      <button
        type="button"
        onClick={onMenuOpen}
        aria-label="Open navigation menu"
        className="xl:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
      >
        <Menu size={20} />
      </button>

      {/* Brand & Logo */}
      <div
        className="flex items-center shrink-0 cursor-pointer select-none transition-transform hover:opacity-95 active:scale-[0.98]"
        onClick={() => navigate('/dashboard')}
        title="answersbro Home"
      >
        <Logo imgClassName="h-[34px] sm:h-[38px] w-auto object-contain" />
      </div>

      {/* Centered Global Search – desktop only */}
      <div className="hidden flex-1 min-w-0 justify-center lg:flex">
        <GlobalSearch />
      </div>

      <div className="relative ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
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
                setNotificationsOpen((open) => {
                  const next = !open;
                  if (next && notificationsList.some((n) => !n.read)) {
                    setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
                    if (user && !isExploring) {
                      notificationsService.markAllRead(user.id).catch(() => {});
                    }
                  }
                  return next;
                });
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
                  onClick={() => {
                    setNotificationsOpen(false);
                    setShowHistory(false);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-12 z-40 w-[min(384px,calc(100vw-24px))] rounded-2xl border border-card-border bg-surface-container-low p-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between px-2 py-1 pb-2 mb-1 border-b border-card-border/60">
                    <div className="flex items-center gap-2">
                      <p className="text-label-md font-bold text-on-surface">
                        {showHistory ? 'Past Week History' : 'Notifications'}
                      </p>
                      {showHistory && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide uppercase">
                          7 Days
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHistory((prev) => !prev)}
                      title={showHistory ? 'Show recent notifications' : 'Notification history (Past 7 days)'}
                      aria-label="Notification history"
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                        showHistory
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                      }`}
                    >
                      <History size={14} />
                      <span>{showHistory ? 'Recent' : 'History'}</span>
                    </button>
                  </div>

                  <NotificationList
                    notifications={
                      showHistory
                        ? notificationsList.filter(notificationsService.isWithinPastWeek)
                        : notificationsList
                    }
                    onMarkAllRead={handleMarkAllRead}
                    onDeleteNotification={handleDeleteNotification}
                    compact
                    isHistory={showHistory}
                    emptyTitle={showHistory ? 'No past week notifications' : 'No notifications'}
                    emptySubtitle={
                      showHistory
                        ? 'No notification activity recorded in the past 7 days.'
                        : "You're all caught up!"
                    }
                  />

                  <div className="mt-2 pt-2 border-t border-card-border/50 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        setShowHistory(false);
                        navigate('/notifications');
                      }}
                      className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      View all on notifications page
                    </button>
                  </div>
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
            className="ml-1 sm:ml-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:border-primary transition-all cursor-pointer shadow-xs"
          >
            <User size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            aria-label="View profile"
            title={user?.name ? `${user.name} — View Profile` : 'View Profile'}
            className="ml-1 sm:ml-1.5 shrink-0 flex items-center justify-center rounded-full p-[2px] ring-2 ring-primary/40 hover:ring-primary dark:ring-primary/60 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95 group bg-surface-container-low"
          >
            <Avatar
              name={user?.name ?? 'User'}
              src={user?.avatar}
              size={38}
              className="ring-1 ring-black/15 dark:ring-white/20 shadow-2xs group-hover:brightness-105 transition-all"
            />
          </button>
        )}
      </div>
    </header>
  );
}

export default TopBar;
