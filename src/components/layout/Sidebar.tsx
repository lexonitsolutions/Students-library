import { BookMarked, LogOut, Plus } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';
import { navItems } from './navConfig';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-card-border bg-white px-4 py-6 lg:flex">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
          <BookMarked size={20} />
        </div>
        <div>
          <p className="text-headline-md leading-tight text-on-surface">Lexon</p>
          <p className="text-label-sm text-on-surface-variant">Study Smart</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate('/upload')}
        className="mt-6 flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-label-md text-on-primary transition-colors duration-150 hover:bg-primary-container cursor-pointer"
      >
        <Plus size={18} />
        Upload Material
      </button>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const to = item.label === 'Home' && isAdmin ? '/admin' : item.to;
          return (
            <NavLink
              key={item.label}
              to={to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md transition-colors duration-150',
                  isActive
                    ? 'bg-primary-container/10 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md text-on-surface-variant transition-colors duration-150 hover:bg-surface-container-low hover:text-on-surface cursor-pointer"
      >
        <LogOut size={20} />
        Log out
      </button>
    </aside>
  );
}

export default Sidebar;
