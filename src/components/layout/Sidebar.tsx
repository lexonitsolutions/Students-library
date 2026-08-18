import { ArrowLeftRight, BookMarked, LayoutDashboard, LogOut, Plus, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { navItems } from './navConfig';

const adminNavItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Manage Admins', to: '/admin/admins', icon: Users },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { workspace, chooseWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const isAdmin = user?.role === 'admin';
  const inAdminWorkspace = isAdmin && workspace !== 'student';

  const handleSwitchWorkspace = () => {
    if (inAdminWorkspace) {
      chooseWorkspace('student');
      navigate('/');
    } else {
      chooseWorkspace('admin');
      navigate('/admin');
    }
  };

  const handleConfirmLogout = async () => {
    await signOut();
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

      {isAdmin && (
        <div className="mt-5">
          <p className="px-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant/70">
            Admin
          </p>
          <nav className="mt-1 flex flex-col gap-1">
            {adminNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={() => chooseWorkspace('admin')}
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
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSwitchWorkspace}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm text-on-surface-variant transition-colors duration-150 hover:bg-surface-container-low hover:text-on-surface cursor-pointer"
          >
            <ArrowLeftRight size={18} />
            {inAdminWorkspace ? 'Switch to Student view' : 'Switch to Admin Workspace'}
          </button>
          <p className="mt-3 flex items-center gap-1.5 px-3 text-label-sm font-semibold uppercase tracking-wider text-on-surface-variant/70">
            <ShieldCheck size={14} /> Student
          </p>
        </div>
      )}

      <nav className="mt-1 flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === '/'}
            onClick={() => isAdmin && chooseWorkspace('student')}
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
        ))}
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
