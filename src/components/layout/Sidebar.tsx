import { ArrowLeftRight, LayoutDashboard, LogOut, Plus, ShieldCheck, Users } from 'lucide-react';
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
  const { user, signOut, isExploring } = useAuth();
  const { workspace, chooseWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isAdmin = user?.role === 'admin';
  const inAdminWorkspace = isAdmin && workspace !== 'student';

  const visibleNavItems = isExploring
    ? navItems.filter((item) => ['/', '/leaderboard', '/upload', '/library'].includes(item.to))
    : navItems;

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
    <>
      {/* ── Collapsed placeholder: always occupies 64px in the layout flow ── */}
      <div className="hidden lg:block shrink-0 w-16" />

      {/* ── Actual sidebar: absolute so it overlays content when expanded ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          // Base / positioning
          'hidden lg:flex absolute left-0 top-0 z-20 h-full flex-col',
          'border-r border-card-border medium-liquid-glass',
          'overflow-hidden transition-[width] duration-250 ease-in-out',
          // Width driven by expanded state
          expanded ? 'w-64 shadow-lg' : 'w-16',
        )}
      >
        {/* ── Upload button ── */}
        <div className="shrink-0 px-2 pt-4 pb-2">
          <button
            type="button"
            onClick={() => navigate('/upload')}
              className={cn(
                'flex h-10 items-center rounded-lg bg-primary text-on-primary',
                'transition-all duration-200 hover:bg-primary-container cursor-pointer shadow-xs',
                expanded ? 'w-full justify-start gap-2 px-3' : 'w-10 justify-center mx-auto',
              )}
            >
              <Plus size={18} className="shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap text-body-lg font-semibold overflow-hidden transition-all duration-200',
                  expanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0',
                )}
              >
                Upload
              </span>
            </button>
          </div>

        {/* ── Admin section ── */}
        {isAdmin && (
          <div className="px-2 mb-1">
            {expanded && (
              <p className="px-1 py-1 text-label-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
                Admin
              </p>
            )}
            <nav className="flex flex-col gap-0.5">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  title={!expanded ? item.label : undefined}
                  onClick={() => chooseWorkspace('admin')}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-lg transition-all duration-150 h-10',
                      expanded ? 'gap-3 px-3' : 'justify-center w-10 mx-auto',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                    )
                  }
                >
                  <item.icon size={20} className="shrink-0" />
                  <span
                    className={cn(
                      'whitespace-nowrap text-body-lg overflow-hidden transition-all duration-200',
                      expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0',
                    )}
                  >
                    {item.label}
                  </span>
                </NavLink>
              ))}
            </nav>

            {/* Switch workspace */}
            <button
              type="button"
              onClick={handleSwitchWorkspace}
              title={!expanded ? (inAdminWorkspace ? 'Student View' : 'Admin Workspace') : undefined}
              className={cn(
                'flex items-center rounded-lg h-10 transition-colors duration-150 cursor-pointer',
                'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                expanded ? 'w-full gap-3 px-3' : 'justify-center w-10 mx-auto',
              )}
            >
              <ArrowLeftRight size={18} className="shrink-0" />
              <span
                className={cn(
                  'whitespace-nowrap text-body-md overflow-hidden transition-all duration-200',
                  expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0',
                )}
              >
                {inAdminWorkspace ? 'Student View' : 'Admin Workspace'}
              </span>
            </button>

            {expanded && (
              <p className="mt-1 px-1 py-1 flex items-center gap-1.5 text-label-xs font-bold uppercase tracking-wider text-on-surface-variant/60">
                <ShieldCheck size={13} /> Student
              </p>
            )}
          </div>
        )}

        {/* ── Main nav ── */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              title={!expanded ? item.label : undefined}
              onClick={() => isAdmin && chooseWorkspace('student')}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg transition-all duration-150 h-10',
                  expanded ? 'gap-3 px-3' : 'justify-center w-10 mx-auto',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    size={20}
                    className={cn('shrink-0', isActive ? 'text-primary' : '')}
                  />
                  <span
                    className={cn(
                      'whitespace-nowrap text-body-lg overflow-hidden transition-all duration-200',
                      expanded ? 'opacity-100 max-w-[160px]' : 'opacity-0 max-w-0',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Log out ── */}
        <div className="shrink-0 px-2 pb-4 pt-2 border-t border-card-border/50">
          <button
            type="button"
            onClick={() => setShowLogoutAlert(true)}
            title={!expanded ? 'Log out' : undefined}
            className={cn(
              'flex items-center rounded-lg h-10 transition-colors duration-150 cursor-pointer',
              'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
              expanded ? 'w-full gap-3 px-3' : 'justify-center w-10 mx-auto',
            )}
          >
            <LogOut size={20} className="shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap text-body-lg overflow-hidden transition-all duration-200',
                expanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0',
              )}
            >
              Log out
            </span>
          </button>
        </div>
      </aside>

      {/* ── Logout Modal ── */}
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
    </>
  );
}

export default Sidebar;
