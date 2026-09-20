import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Headphones, LayoutDashboard, Library, LogOut, Shield, Users, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useWorkspace } from "../../hooks/useWorkspace";
import { useUnreadMessages } from "../../hooks/useUnreadMessages";
import { cn } from "../../lib/cn";
import { Avatar } from "../ui/Avatar";
import { Logo } from "../ui/Logo";
import { navItems } from "./navConfig";

const adminNavItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Documents", to: "/admin/documents", icon: Library },
  { label: "Students", to: "/admin/students", icon: GraduationCap },
  { label: "Manage Admins", to: "/admin/admins", icon: Users },
];

interface MobileDrawerProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onLogout: () => void;
}

export function MobileDrawer({ isOpen, onClose, onLogout }: MobileDrawerProps) {
  const { user, isExploring } = useAuth();
  const { chooseWorkspace } = useWorkspace();
  const { unreadCount, hasUnread } = useUnreadMessages();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const visibleNavItems = (
    isExploring
      ? navItems.filter((item) => ['/dashboard', '/leaderboard', '/upload', '/library'].includes(item.to))
      : navItems
  ).filter((item) => item.to !== '/profile');

  const handleNav = (cb?: () => void) => {
    onClose();
    cb?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            key="drawer-backdrop"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.aside
            key="drawer-panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 38, mass: 0.8 }}
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col bg-surface-container-low border-r border-card-border shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-card-border/60">
              <div
                className="flex items-center cursor-pointer select-none"
                onClick={() => handleNav(() => navigate("/"))}
                title="answersbro Home"
              >
                <Logo imgClassName="h-8 w-auto object-contain" />
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>


            <div className="flex-1 overflow-y-auto px-3 py-3">
              {isAdmin && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 px-2 mb-1.5">
                    <Shield size={11} className="text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Admin</span>
                  </div>
                  <nav className="flex flex-col gap-0.5">
                    {adminNavItems.map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        end
                        onClick={() => handleNav(() => chooseWorkspace("admin"))}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                          )
                        }
                      >
                        <item.icon size={18} strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </nav>
                  <div className="mt-2 mb-1.5 px-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/60">Student</span>
                  </div>
                </div>
              )}

              <nav className="flex flex-col gap-0.5">
                {visibleNavItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={() => handleNav(isAdmin ? () => chooseWorkspace("student") : undefined)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="relative shrink-0">
                          <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                          {item.to === "/messages" && hasUnread && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-surface" />
                            </span>
                          )}
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {item.to === "/messages" && unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </span>
                        )}
                        {item.to !== "/messages" && item.badge && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}

                {!isExploring && (
                  <NavLink
                    to="/profile"
                    onClick={() => handleNav()}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                          : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Avatar
                          name={user?.name || "User"}
                          src={user?.avatar}
                          size={20}
                          className={cn("ring-1.5 shrink-0", isActive ? "ring-primary" : "ring-card-border")}
                        />
                        <span>Profile</span>
                      </>
                    )}
                  </NavLink>
                )}
              </nav>
            </div>

            <div className="shrink-0 px-3 py-3 border-t border-card-border/60 flex flex-col gap-0.5">
              <NavLink
                to="/support"
                onClick={() => handleNav()}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/15"
                      : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  )
                }
              >
                <Headphones size={18} strokeWidth={1.8} />
                <span>Customer Support</span>
              </NavLink>

              <button
                type="button"
                onClick={() => handleNav(onLogout)}
                className="flex items-center gap-3 h-11 w-full px-3 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-error/10 hover:text-error transition-colors cursor-pointer"
              >
                <LogOut size={18} strokeWidth={1.8} />
                <span>Log out</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileDrawer;
