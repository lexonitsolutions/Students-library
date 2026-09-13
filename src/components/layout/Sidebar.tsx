import { motion } from 'framer-motion';
import { GraduationCap, Headphones, LayoutDashboard, Library, LogOut, Shield, Users } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Avatar } from '../ui/Avatar';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
import { navItems } from './navConfig';

const adminNavItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Documents', to: '/admin/documents', icon: Library },
  { label: 'Students', to: '/admin/students', icon: GraduationCap },
  { label: 'Manage Admins', to: '/admin/admins', icon: Users },
];

export function Sidebar() {
  const { user, signOut, isExploring } = useAuth();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const { chooseWorkspace } = useWorkspace();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isAdmin = user?.role === 'admin';

  const visibleNavItems = (
    isExploring
      ? navItems.filter((item) => ['/dashboard', '/leaderboard', '/upload', '/library'].includes(item.to))
      : navItems
  ).filter((item) => item.to !== '/profile');

  const handleConfirmLogout = async () => {
    await signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <>
      {/* ── Collapsed placeholder: always occupies 72px in layout flow so main content doesn't jump ── */}
      <div className="hidden xl:block shrink-0 w-[72px]" />

      {/* ── Actual sidebar: fixed icons with smooth Instagram-style slide expansion on hover ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={cn(
          'hidden xl:flex absolute left-0 top-0 z-30 h-full flex-col',
          'border-r border-card-border bg-surface-container-low/95 backdrop-blur-md',
          'transition-[width] duration-300 ease-out select-none',
          expanded ? 'w-64 shadow-2xl ring-1 ring-black/5' : 'w-[72px]',
        )}
      >
        {/* Navigation scrollable container */}
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto px-2.5 py-3">
          {/* Admin section */}
          {isAdmin && (
            <div className="mb-2">
              {/* Section Header with fixed height - ZERO vertical shift */}
              <div className="h-6 px-1.5 flex items-center mb-1 overflow-hidden">
                <div
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-300',
                    expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none',
                  )}
                >
                  <Shield size={12} className="text-primary shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Admin
                  </span>
                </div>
              </div>

              {/* Admin Nav Items */}
              <nav className="flex flex-col gap-1">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end
                    title={!expanded ? item.label : undefined}
                    onClick={() => chooseWorkspace('admin')}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center h-11 w-full rounded-xl transition-all duration-200 px-1.5',
                        isActive
                          ? 'text-primary font-semibold'
                          : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active unified pill */}
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15 dark:bg-primary/20 dark:border-primary/30 shadow-2xs"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}

                        {/* Icon slot */}
                        <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                          <item.icon
                            size={20}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={cn(
                              'shrink-0 transition-colors duration-200',
                              isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface',
                            )}
                          />
                        </div>

                        {/* Text label */}
                        <span
                          className={cn(
                            'relative z-10 ml-2.5 whitespace-nowrap text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
                            isActive ? 'font-semibold text-primary' : 'font-medium',
                            expanded
                              ? 'opacity-100 translate-x-0 max-w-[160px]'
                              : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
                          )}
                        >
                          {item.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>

              {/* Divider between Admin and Student with fixed height - ZERO vertical shift */}
              <div className="h-6 px-1.5 flex items-center my-1 overflow-hidden">
                <div
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-300',
                    expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none',
                  )}
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                    Student
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Student Nav */}
          <nav className="flex flex-col gap-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                title={!expanded ? item.label : undefined}
                onClick={() => isAdmin && chooseWorkspace('student')}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center h-11 w-full rounded-xl transition-all duration-200 px-1.5',
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active unified pill */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePill"
                        className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15 dark:bg-primary/20 dark:border-primary/30 shadow-2xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}

                    {/* Icon slot */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      <item.icon
                        size={20}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={cn(
                          'shrink-0 transition-colors duration-200',
                          isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-on-surface',
                        )}
                      />
                      {/* Red indicator dot for messages */}
                      {item.to === '/messages' && hasUnread && (
                        <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-surface" />
                        </span>
                      )}
                    </div>

                    {/* Text label */}
                    <span
                      className={cn(
                        'relative z-10 ml-2.5 whitespace-nowrap text-[13.5px] tracking-tight overflow-hidden transition-all duration-300 flex-1 flex items-center justify-between',
                        isActive ? 'font-semibold text-primary' : 'font-medium',
                        expanded
                          ? 'opacity-100 translate-x-0 max-w-[160px]'
                          : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
                      )}
                    >
                      <span>{item.label}</span>
                      {item.to === '/messages' && unreadCount > 0 ? (
                        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-2xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      ) : (
                        item.badge && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            {item.badge}
                          </span>
                        )
                      )}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Bottom Section: Support, Profile & Log out ── */}
        <div className="shrink-0 px-2.5 py-2.5 border-t border-card-border/60 bg-surface-container-low/50 flex flex-col gap-1">
          {/* Customer Support Link */}
          <NavLink
            to="/support"
            title={!expanded ? 'Customer Support' : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center h-11 w-full rounded-xl transition-all duration-200 px-1.5',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15 dark:bg-primary/20 dark:border-primary/30 shadow-2xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <Headphones
                    size={20}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      isActive ? 'text-primary' : '',
                    )}
                  />
                </div>

                <span
                  className={cn(
                    'relative z-10 ml-2.5 whitespace-nowrap text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
                    isActive ? 'font-semibold text-primary' : 'font-medium',
                    expanded
                      ? 'opacity-100 translate-x-0 max-w-[160px]'
                      : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
                  )}
                >
                  Customer Support
                </span>
              </>
            )}
          </NavLink>

          {/* Profile Item */}
          {!isExploring && (
            <NavLink
              to="/profile"
              title={!expanded ? 'Profile' : undefined}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center h-11 w-full rounded-xl transition-all duration-200 px-1.5',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container/60 hover:text-on-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15 dark:bg-primary/20 dark:border-primary/30 shadow-2xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  {/* User avatar slot */}
                  <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <Avatar
                      name={user?.name || 'User'}
                      src={user?.avatar}
                      size={30}
                      className={cn(
                        'ring-2 transition-all',
                        isActive
                          ? 'ring-primary ring-offset-1 ring-offset-surface shadow-[0_0_6px_2px] shadow-primary/30'
                          : 'ring-card-border group-hover:ring-primary/40',
                      )}
                    />
                  </div>

                  {/* Text label */}
                  <span
                    className={cn(
                      'relative z-10 ml-2.5 whitespace-nowrap text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
                      isActive ? 'font-semibold text-primary' : 'font-medium',
                      expanded
                        ? 'opacity-100 translate-x-0 max-w-[160px]'
                        : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
                    )}
                  >
                    Profile
                  </span>
                </>
              )}
            </NavLink>
          )}

          {/* Log out Button */}
          <button
            type="button"
            onClick={() => setShowLogoutAlert(true)}
            title={!expanded ? 'Log out' : undefined}
            className="group relative flex items-center h-11 w-full rounded-xl transition-colors duration-150 px-1.5 text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer"
          >
            {/* Fixed icon slot - 100% stationary */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105">
              <LogOut size={20} strokeWidth={1.8} className="shrink-0 transition-colors" />
            </div>

            {/* Text label - slides & fades smoothly */}
            <span
              className={cn(
                'ml-2.5 whitespace-nowrap text-[13.5px] font-medium tracking-tight overflow-hidden transition-all duration-300',
                expanded
                  ? 'opacity-100 translate-x-0 max-w-[160px]'
                  : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
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
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
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
