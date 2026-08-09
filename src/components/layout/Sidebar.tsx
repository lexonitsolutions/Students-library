import { BookMarked, LogOut, Plus } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { navItems } from './navConfig';

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const isAdmin = user?.role === 'admin';

  const handleConfirmLogout = () => {
    logout();
    navigate('/signin', { replace: true });
  };

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-card-border medium-liquid-glass px-4 py-6 lg:flex lg:h-full lg:overflow-y-auto">
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
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md transition-all duration-200',
                  isActive
                    ? 'bg-primary-container/10 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface hover:translate-x-1',
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
        onClick={() => setShowLogoutAlert(true)}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-md text-on-surface-variant transition-colors duration-150 hover:bg-surface-container-low hover:text-on-surface cursor-pointer"
      >
        <LogOut size={20} />
        Log out
      </button>

      {/* Logout Confirmation Alert Modal */}
      <Modal open={showLogoutAlert} onClose={() => setShowLogoutAlert(false)} title="Confirm Logout">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <LogOut size={28} />
          </div>
          <div>
            <h3 className="text-headline-md text-on-surface font-semibold">Are you sure you want to log out?</h3>
            <p className="mt-2 text-body-sm text-on-surface-variant max-w-xs mx-auto">
              You will need to enter your credentials again to access your saved study materials and notes.
            </p>
          </div>
          <div className="mt-5 flex w-full justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowLogoutAlert(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmLogout} className="bg-error hover:bg-error/90 text-white">
              Yes, Log Out
            </Button>
          </div>
        </div>
      </Modal>
    </aside>
  );
}

export default Sidebar;
