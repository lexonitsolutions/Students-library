import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { navItems } from './navConfig';

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-card-border bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Primary"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex min-w-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-label-sm transition-colors duration-150',
              isActive ? 'text-primary' : 'text-outline',
            )
          }
        >
          <item.icon size={22} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
