import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CircleHelp,
  Download,
  Info,
  LogOut,
  Moon,
  Palette,
  Pencil,
  Shield,
  Sun,
  SunMoon,
  Trash2,
  User,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { useDarkMode } from '../hooks/useDarkMode';
import { AccountSettingsModal } from '../components/settings/AccountSettingsModal';
import { PrivacySettingsModal } from '../components/settings/PrivacySettingsModal';

const settingsSections = [
  {
    heading: 'General',
    items: [
      { label: 'Account', icon: UserCog },
      { label: 'Privacy', icon: Shield },
    ],
  },
  {
    heading: 'Preferences',
    items: [
      { label: 'Notifications', icon: Bell },
      { label: 'Downloads', icon: Download },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help & Support', icon: CircleHelp },
      { label: 'About QuickLearnit', icon: Info },
    ],
  },
];

export function SettingsPage() {
  const { user, isExploring, signOut, deleteAccount } = useAuth();
  const { openSignupModal } = useSignupRedirect();
  const { theme, cycleTheme } = useDarkMode();
  const navigate = useNavigate();

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  if (!user) return null;

  const handleConfirmLogout = async () => {
    await signOut();
    navigate('/signin', { replace: true });
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await deleteAccount(deletePassword);
    if (error) {
      setPasswordError(error);
      return;
    }
    navigate('/signup', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-headline-lg-mobile text-on-surface sm:text-headline-lg">Settings</h1>

      <Card hoverable={false} className="flex items-center gap-3 relative">
        {isExploring ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
            <User size={24} />
          </div>
        ) : (
          <Avatar name={user.name} src={user.avatar} size={48} />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-body-md font-semibold text-on-surface">{user.name}</p>
          {user.quickId && (
            <p className="mt-1 truncate text-label-xs font-mono font-bold tracking-wider text-primary">ID: {user.quickId}</p>
          )}
        </div>
        <button 
          onClick={() => {
            if (isExploring) {
              openSignupModal('/settings');
            } else {
              setShowAccountModal(true);
            }
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-soft hover:text-primary transition-colors cursor-pointer ml-auto shrink-0"
          aria-label="Edit Profile"
        >
          <Pencil size={18} />
        </button>
      </Card>

      {settingsSections.map((section) => (
        <div key={section.heading} className="mt-5">
          <p className="mb-2 px-1 text-label-sm font-semibold uppercase tracking-wide text-outline">
            {section.heading}
          </p>
          <Card hoverable={false} padded={false}>
            {section.items.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.label === 'Downloads') {
                    navigate('/library?tab=downloaded');
                  } else if (item.label === 'Account') {
                    if (isExploring) {
                      openSignupModal('/settings');
                    } else {
                      setShowAccountModal(true);
                    }
                  } else if (item.label === 'Privacy') {
                    setShowPrivacyModal(true);
                  }
                }}
                className={`flex w-full items-center gap-3 border-b border-card-border px-4 py-3.5 text-left text-body-sm text-on-surface first:rounded-t-xl hover:bg-surface-soft cursor-pointer transition-colors ${
                  section.heading === 'Preferences' && index === section.items.length - 1 ? '' : 'last:rounded-b-xl last:border-b-0'
                }`}
              >
                <item.icon size={18} className="text-on-surface-variant" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight size={16} className="text-outline" />
              </button>
            ))}
            {section.heading === 'Preferences' && (
              <div className="flex w-full items-center justify-between px-4 py-3.5 text-left text-body-sm text-on-surface rounded-b-xl hover:bg-surface-soft transition-colors">
                <div className="flex items-center gap-3">
                  <Palette size={18} className="text-on-surface-variant" />
                  <div>
                    <p className="font-medium text-on-surface">Appearance</p>
                    <p className="text-label-sm text-on-surface-variant capitalize">
                      {theme} theme enabled
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={cycleTheme}
                  aria-label="Cycle theme"
                  className="flex h-8 w-16 items-center rounded-full border border-card-border bg-surface-container-low p-1 transition-all duration-300 hover:border-primary/50 cursor-pointer relative"
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-300 absolute left-1"
                    style={{
                      transform: theme === 'dark' ? 'translateX(30px)' : theme === 'mid' ? 'translateX(15px)' : 'translateX(0)',
                      backgroundColor: theme === 'dark' ? '#818cf8' : theme === 'mid' ? '#6B84E8' : '#1e3a8a',
                    }}
                  >
                    {theme === 'dark' ? (
                      <Moon size={12} className="text-white" />
                    ) : theme === 'mid' ? (
                      <SunMoon size={12} className="text-white" />
                    ) : (
                      <Sun size={12} className="text-white" />
                    )}
                  </span>
                </button>
              </div>
            )}
          </Card>
        </div>
      ))}

      {/* Account Actions Section */}
      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowLogoutAlert(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-card-border bg-white py-3 text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-soft cursor-pointer"
        >
          <LogOut size={18} className="text-on-surface-variant" />
          Log Out
        </button>

        <button
          type="button"
          onClick={() => {
            setDeletePassword('');
            setPasswordError('');
            setShowDeleteModal(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-error/30 bg-error/5 py-3 text-label-md font-semibold text-error transition-colors hover:bg-error-container/40 cursor-pointer"
        >
          <Trash2 size={18} />
          Delete Account
        </button>
      </div>

      {/* Designed Logout Alert Modal */}
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

      {/* Delete Account Modal with Password Validation */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl bg-error-container/20 p-3.5 border border-error/30 text-error">
            <AlertTriangle size={24} className="shrink-0" />
            <p className="text-body-sm">
              This action is permanent and cannot be undone. All your saved documents, uploads, and data will be erased.
            </p>
          </div>

          <p className="text-body-sm text-on-surface-variant font-medium">
            Please enter your password below to confirm account deletion:
          </p>

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
            label="Your Password"
            placeholder="••••••••"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              setPasswordError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConfirmDeleteAccount(e);
              }
            }}
          />

          {passwordError && (
            <p className="text-label-sm font-semibold text-error">{passwordError}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmDeleteAccount}
              className="bg-error hover:bg-error/90 text-white"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>

      <AccountSettingsModal 
        open={showAccountModal} 
        onClose={() => setShowAccountModal(false)} 
      />

      <PrivacySettingsModal
        open={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </div>
  );
}

export default SettingsPage;
