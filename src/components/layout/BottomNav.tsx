import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '../../lib/cn';
import { navItems } from './navConfig';
import { useAuth } from '../../hooks/useAuth';

export function BottomNav() {
  const { isExploring } = useAuth();
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
              'group relative flex h-11 w-11 flex-col items-center justify-center rounded-xl transition-all duration-150 cursor-pointer select-none',
              isActive
                ? 'bg-primary/10 text-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="apple-liquid-active-pill"
                  className="absolute inset-0 rounded-full apple-liquid-pill-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <item.icon
                size={20}
                className={cn(
                  'relative z-10 transition-transform duration-200 group-hover:scale-110',
                  isActive && 'scale-105',
                )}
              />
              <span className="relative z-10 mt-0.5 text-[10px] font-medium leading-tight">
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
