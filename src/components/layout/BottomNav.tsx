import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/cn';
import { navItems } from './navConfig';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { Avatar } from '../ui/Avatar';

export function BottomNav() {
  const { isExploring, user } = useAuth();
  const { hasUnread } = useUnreadMessages();
  const [isScrolling, setIsScrolling] = useState(false);

  const visibleNavItems = isExploring
    ? navItems.filter((item) => ['/', '/leaderboard', '/upload', '/library'].includes(item.to))
    : navItems;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        setIsScrolling(false);
      }, 600);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 1, y: 0 }}
      animate={{ 
        opacity: isScrolling ? 0 : 1, 
        y: isScrolling ? 20 : 0,
      }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{ pointerEvents: isScrolling ? 'none' : 'auto' }}
      className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-row items-center gap-1 rounded-2xl border border-card-border bg-surface-container-low px-2 py-1.5 shadow-2xl lg:hidden"
      aria-label="Primary"
    >
      {visibleNavItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'group relative flex h-12 w-12 flex-col items-center justify-center rounded-xl transition-all duration-200 cursor-pointer select-none',
              isActive
                ? 'text-primary font-bold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="bottomNavActivePill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/20 to-primary/8 dark:from-primary/30 dark:to-primary/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <div className="relative">
                {item.to === '/profile' ? (
                  <Avatar
                    name={user?.name || 'User'}
                    src={user?.avatar}
                    size={20}
                    className={cn(
                      'relative z-10 transition-all duration-200 group-hover:scale-110 ring-1.5',
                      isActive
                        ? 'ring-primary scale-105 shadow-[0_0_6px_2px] shadow-primary/30'
                        : 'ring-card-border',
                    )}
                  />
                ) : (
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      'relative z-10 transition-all duration-200 group-hover:scale-110',
                      isActive
                        ? 'scale-110 drop-shadow-[0_0_4px_rgba(99,102,241,0.6)]'
                        : '',
                    )}
                  />
                )}
                {item.to === '/messages' && hasUnread && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
                  </span>
                )}
              </div>
              <span className={cn(
                'relative z-10 mt-0.5 text-[10px] leading-tight transition-all duration-200',
                isActive ? 'font-bold' : 'font-medium',
              )}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </motion.nav>
  );
}

export default BottomNav;
