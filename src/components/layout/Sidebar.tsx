import { motion } from 'framer-motion';
import { Headphones, LayoutDashboard, Library, LogOut, Shield, Users } from 'lucide-react';
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
  { label: 'Users', to: '/admin/students', icon: Users },
  { label: 'Manage Admins', to: '/admin/admins', icon: Shield },
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
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-2 py-1.5 2xl:px-2.5 2xl:py-2">
          {/* Admin section */}
          {isAdmin && (
            <div className="mb-1">
              {/* Section Header with fixed height - ZERO vertical shift */}
              <div className="h-5 px-1 flex items-center mb-0.5 overflow-hidden">
                <div
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-300',
                    expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none',
                  )}
                >
                  <Shield size={11} className="text-primary shrink-0" />
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
                    Admin
                  </span>
                </div>
              </div>

              {/* Admin Nav Items */}
              <nav className="flex flex-col gap-0.5">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end
                    title={!expanded ? item.label : undefined}
                    onClick={() => chooseWorkspace('admin')}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center h-9.5 2xl:h-10.5 w-full rounded-xl transition-all duration-200 px-1',
                        isActive
                          ? 'text-[#24378F] dark:text-[#F8F9FC] font-semibold'
                          : 'text-on-surface-variant hover:bg-[#EEF1FF]/60 dark:hover:bg-[#202A4A]/60 hover:text-on-surface',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active unified pill */}
                        {isActive && (
                          <motion.div
                            layoutId="sidebarActivePill"
                            className="absolute inset-0 rounded-xl bg-[#EEF1FF] border border-[#3049B8]/15 dark:bg-[#202A4A] dark:border-[#7185E6]/30 shadow-2xs"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}

                        {/* Icon slot */}
                        <div className="relative z-10 flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                          <item.icon
                            size={18}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className={cn(
                              'shrink-0 transition-colors duration-200',
                              isActive ? 'text-[#3049B8] dark:text-[#7185E6]' : 'text-on-surface-variant group-hover:text-on-surface',
                            )}
                          />
                        </div>

                        {/* Text label */}
                        <span
                          className={cn(
                            'relative z-10 ml-2 whitespace-nowrap text-[13px] 2xl:text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
                            isActive ? 'font-semibold text-[#24378F] dark:text-[#F8F9FC]' : 'font-medium',
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
              <div className="h-5 px-1 flex items-center my-0.5 overflow-hidden">
                <div
                  className={cn(
                    'flex items-center gap-1.5 transition-all duration-300',
                    expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 pointer-events-none',
                  )}
                >
                  <span className="text-[10.5px] font-bold uppercase tracking-wider text-on-surface-variant/60">
                    Student
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Student Nav */}
          <nav className="flex flex-col gap-0.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === '/'}
                title={!expanded ? item.label : undefined}
                onClick={() => isAdmin && chooseWorkspace('student')}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center h-9.5 2xl:h-10.5 w-full rounded-xl transition-all duration-200 px-1',
                    isActive
                      ? 'text-[#24378F] dark:text-[#F8F9FC] font-semibold'
                      : 'text-on-surface-variant hover:bg-[#EEF1FF]/60 dark:hover:bg-[#202A4A]/60 hover:text-on-surface',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active unified pill */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActivePill"
                        className="absolute inset-0 rounded-xl bg-[#EEF1FF] border border-[#3049B8]/15 dark:bg-[#202A4A] dark:border-[#7185E6]/30 shadow-2xs"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}

                    {/* Icon slot */}
                    <div className="relative z-10 flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                      <item.icon
                        size={18}
                        strokeWidth={isActive ? 2.2 : 1.8}
                        className={cn(
                              'shrink-0 transition-colors duration-200',
                              isActive ? 'text-[#3049B8] dark:text-[#7185E6]' : 'text-on-surface-variant group-hover:text-on-surface',
                        )}
                      />
                      {/* Red indicator dot for messages */}
                      {item.to === '/messages' && hasUnread && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
                        </span>
                      )}
                    </div>

                    {/* Text label */}
                    <span
                      className={cn(
                        'relative z-10 ml-2 whitespace-nowrap text-[13px] 2xl:text-[13.5px] tracking-tight overflow-hidden transition-all duration-300 flex-1 flex items-center justify-between',
                        isActive ? 'font-semibold text-[#24378F] dark:text-[#F8F9FC]' : 'font-medium',
                        expanded
                          ? 'opacity-100 translate-x-0 max-w-[160px]'
                          : 'opacity-0 -translate-x-2 max-w-0 pointer-events-none',
                      )}
                    >
                      <span>{item.label}</span>
                      {item.to === '/messages' && unreadCount > 0 ? (
                        <span className="flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold text-white shadow-2xs">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      ) : (
                        item.badge && (
                          <span className="text-[9.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
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
        <div className="shrink-0 px-2 py-1.5 2xl:px-2.5 2xl:py-2 border-t border-card-border/60 bg-surface-container-low/50 flex flex-col gap-0.5">
          {/* Customer Support Link */}
          <NavLink
            to="/support"
            title={!expanded ? 'Customer Support' : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center h-9.5 2xl:h-10.5 w-full rounded-xl transition-all duration-200 px-1',
                isActive
                  ? 'text-[#24378F] dark:text-[#F8F9FC] font-semibold'
                  : 'text-on-surface-variant hover:bg-[#EEF1FF]/60 dark:hover:bg-[#202A4A]/60 hover:text-on-surface',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute inset-0 rounded-xl bg-[#EEF1FF] border border-[#3049B8]/15 dark:bg-[#202A4A] dark:border-[#7185E6]/30 shadow-2xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}

                <div className="relative z-10 flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                  <Headphones
                    size={18}
                    strokeWidth={isActive ? 2.2 : 1.8}
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      isActive ? 'text-[#3049B8] dark:text-[#7185E6]' : '',
                    )}
                  />
                </div>

                <span
                  className={cn(
                    'relative z-10 ml-2 whitespace-nowrap text-[13px] 2xl:text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
                    isActive ? 'font-semibold text-[#24378F] dark:text-[#F8F9FC]' : 'font-medium',
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
                  'group relative flex items-center h-9.5 2xl:h-10.5 w-full rounded-xl transition-all duration-200 px-1',
                  isActive
                    ? 'text-[#24378F] dark:text-[#F8F9FC] font-semibold'
                    : 'text-on-surface-variant hover:bg-[#EEF1FF]/60 dark:hover:bg-[#202A4A]/60 hover:text-on-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 rounded-xl bg-[#EEF1FF] border border-[#3049B8]/15 dark:bg-[#202A4A] dark:border-[#7185E6]/30 shadow-2xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  {/* User avatar slot */}
                  <div className="relative z-10 flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <Avatar
                      name={user?.name || 'User'}
                      src={user?.avatar}
                      size={26}
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
                      'relative z-10 ml-2 whitespace-nowrap text-[13px] 2xl:text-[13.5px] tracking-tight overflow-hidden transition-all duration-300',
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
            className="group relative flex items-center h-9.5 2xl:h-10.5 w-full rounded-xl transition-colors duration-150 px-1 text-on-surface-variant hover:bg-error/10 hover:text-error cursor-pointer"
          >
            {/* Fixed icon slot - 100% stationary */}
            <div className="flex h-8.5 w-8.5 2xl:h-9 2xl:w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105">
              <LogOut size={18} strokeWidth={1.8} className="shrink-0 transition-colors" />
            </div>

            {/* Text label - slides & fades smoothly */}
            <span
              className={cn(
                'ml-2 whitespace-nowrap text-[13px] 2xl:text-[13.5px] font-medium tracking-tight overflow-hidden transition-all duration-300',
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
