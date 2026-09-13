import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleHelp,
  Clock,
  Info,
  KeyRound,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Sun,
  Trash2,
  User,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { useDarkMode } from '../hooks/useDarkMode';
import { AccountSettingsModal } from '../components/settings/AccountSettingsModal';
import { ModifyPasswordModal } from '../components/settings/ModifyPasswordModal';

const settingsSections = [
  {
    heading: 'General',
    items: [
      { label: 'Account', icon: UserCog },
      { label: 'Modify Password', icon: KeyRound },
    ],
  },
  {
    heading: 'Preferences',
    items: [
      { label: 'Notifications', icon: Bell },
      { label: 'Recent Activity', icon: Clock },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help & Support', icon: CircleHelp },
      { label: 'About Studexa', icon: Info },
    ],
  },
];

export function SettingsPage() {
  const { user, isExploring, signOut, deleteAccount } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const { theme, cycleTheme } = useDarkMode();
  const navigate = useNavigate();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showModifyPasswordModal, setShowModifyPasswordModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [deletePassword, setDeletePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) return null;

  const triggerBlink = () => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 1500);
  };

  const handleConfirmLogout = async () => {
    await signOut();
    navigate('/signin', { replace: true });
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword.trim()) {
      setPasswordError('Password is required to confirm account deletion.');
      triggerBlink();
      return;
    }

    setIsDeleting(true);
    const { error } = await deleteAccount(deletePassword);
    setIsDeleting(false);

    if (error) {
      setPasswordError(error);
      triggerBlink();
      return;
    }
    navigate('/signup', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl pb-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Settings</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Manage your account preferences, appearance, and security.
        </p>
      </div>

      {/* Profile Summary Card */}
      <div className="rounded-xl border border-card-border bg-surface p-4 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {isExploring ? (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
              <User size={22} />
            </div>
          ) : (
            <Avatar name={user.name} src={user.avatar} size={46} className="ring-1 ring-card-border shrink-0" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-surface">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              {user.quickId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container border border-card-border text-[11px] font-mono font-medium text-on-surface-variant">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant/60 font-sans">ID</span>
                  <span>{user.quickId}</span>
                </span>
              )}
              {user.email && (
                <span className="text-xs text-on-surface-variant truncate hidden sm:inline">{user.email}</span>
              )}
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            if (isExploring) {
              openSignupModal('/settings');
            } else {
              setShowAccountModal(true);
            }
          }}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-card-border bg-surface hover:bg-surface-container text-xs font-medium text-on-surface transition-colors cursor-pointer shrink-0 shadow-2xs"
          aria-label="Edit Profile"
        >
          <Pencil size={13} className="text-on-surface-variant" />
          <span>Edit</span>
        </button>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section) => (
        <div key={section.heading} className="mt-5">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/80">
            {section.heading}
          </p>
          <div className="rounded-xl border border-card-border bg-surface divide-y divide-card-border/60 shadow-2xs overflow-hidden">
            {section.items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.label === 'Notifications') {
                    navigate('/notifications');
                  } else if (item.label === 'Recent Activity') {
                    navigate('/library?tab=activity');
                  } else if (item.label === 'Help & Support') {
                    navigate('/support');
                  } else if (item.label === 'Account') {
                    if (isExploring) {
                      openSignupModal('/settings');
                    } else {
                      setShowAccountModal(true);
                    }
                  } else if (item.label === 'Modify Password') {
                    if (isExploring) {
                      openSignupModal('/settings');
                    } else {
                      setShowModifyPasswordModal(true);
                    }
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-on-surface hover:bg-surface-container-low/60 cursor-pointer transition-colors group"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container/70 text-on-surface-variant group-hover:text-on-surface transition-colors shrink-0">
                  <item.icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-on-surface">{item.label}</span>
                </div>
                <ChevronRight size={15} className="text-on-surface-variant/40 group-hover:text-on-surface-variant group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}

            {section.heading === 'Preferences' && (
              <div className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-on-surface">
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-container/70 text-on-surface-variant shrink-0">
                    <Palette size={15} />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-on-surface">Appearance</p>
                    <p className="text-[11px] text-on-surface-variant capitalize">
                      {theme} theme enabled
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cycleTheme}
                  aria-label="Toggle theme"
                  className="flex h-7 w-12 items-center rounded-full border border-card-border bg-surface-container-high p-0.5 transition-colors duration-200 hover:border-primary/50 cursor-pointer relative"
                >
                  <span
                    className="flex h-5.5 w-5.5 items-center justify-center rounded-full shadow-xs transition-all duration-200 absolute left-0.5"
                    style={{
                      transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0)',
                      backgroundColor: theme === 'dark' ? '#6366F1' : '#FFFFFF',
                    }}
                  >
                    {theme === 'dark' ? (
                      <Moon size={12} className="text-white" />
                    ) : (
                      <Sun size={12} className="text-amber-500" />
                    )}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Account Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          icon={<LogOut size={15} />}
          onClick={() => setShowLogoutAlert(true)}
          className="w-full sm:flex-1 h-10 rounded-xl text-sm font-medium"
        >
          Log Out
        </Button>
        <Button
          type="button"
          variant="danger"
          icon={<Trash2 size={15} />}
          onClick={() => {
            setDeletePassword('');
            setPasswordError('');
            setShowDeleteModal(true);
          }}
          className="w-full sm:flex-1 h-10 rounded-xl text-sm font-medium"
        >
          Delete Account
        </Button>
      </div>

      {/* Designed Logout Alert Modal */}
      <Modal open={showLogoutAlert} onClose={() => setShowLogoutAlert(false)} title="Confirm Logout">
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <LogOut size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Are you sure you want to log out?</h3>
            <p className="mt-1 text-xs text-on-surface-variant max-w-xs mx-auto">
              You will need to sign in again to access your personal dashboard and saved notes.
            </p>
          </div>
          <div className="mt-3 flex w-full justify-end gap-2 pt-3 border-t border-card-border/60">
            <Button variant="secondary" size="sm" onClick={() => setShowLogoutAlert(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleConfirmLogout} className="bg-error hover:bg-error/90 text-white">
              Log Out
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Account Modal with Password Validation */}
      <Modal
        open={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletePassword('');
          setPasswordError('');
          setIsBlinking(false);
        }}
        title="Delete Account"
        description="This action cannot be undone."
      >
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center gap-2.5 rounded-lg bg-error-container/20 p-3 border border-error/30 text-error text-xs">
            <AlertTriangle size={18} className="shrink-0" />
            <p>
              Permanently deletes your account, profile, uploads, and all personal data.
            </p>
          </div>

          <p className="text-xs text-on-surface-variant font-medium">
            Please enter your password to confirm:
          </p>

          <motion.div
            animate={
              isBlinking
                ? {
                    x: [-8, 8, -6, 6, -3, 3, 0],
                  }
                : {}
            }
            transition={{ duration: 0.4 }}
            className={`rounded-lg transition-all duration-200 ${
              isBlinking
                ? 'ring-2 ring-red-500/70 border-red-500 bg-red-500/10 p-0.5'
                : ''
            }`}
          >
            <Input
              type="text"
              style={{ WebkitTextSecurity: 'disc', textSecurity: 'disc' } as React.CSSProperties}
              name="verification_code_field"
              id="verification_code_field"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-form-type="other"
              label="Your Password *"
              placeholder="••••••••"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                setPasswordError('');
                setIsBlinking(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmDeleteAccount(e);
                }
              }}
            />
          </motion.div>

          {passwordError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs font-semibold text-error flex items-center gap-1.5"
            >
              <AlertTriangle size={13} className="shrink-0" />
              <span>{passwordError}</span>
            </motion.p>
          )}

          <div className="mt-2 flex justify-end gap-2 pt-3 border-t border-card-border/60">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword('');
                setPasswordError('');
                setIsBlinking(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDeleteAccount}
              className="bg-error hover:bg-error/90 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Modal>

      <AccountSettingsModal 
        open={showAccountModal} 
        onClose={() => setShowAccountModal(false)} 
      />

      <ModifyPasswordModal
        open={showModifyPasswordModal}
        onClose={() => setShowModifyPasswordModal(false)}
        onSuccess={() => showToast('Password modified successfully!')}
      />

      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl bg-surface border border-card-border px-4 py-3 shadow-xl text-sm font-medium text-on-surface"
        >
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}
    </div>
  );
}

export default SettingsPage;
