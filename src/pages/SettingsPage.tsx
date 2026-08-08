import { motion } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Download,
  Info,
  LogOut,
  Palette,
  Shield,
  UserCog,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';

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
      { label: 'About Lexon', icon: Info },
    ],
  },
];

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [lightTheme, setLightTheme] = useState(true);
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-headline-lg-mobile text-on-surface sm:text-headline-lg">Settings</h1>

      <Card hoverable={false} className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar} size={48} />
        <div className="min-w-0">
          <p className="truncate text-body-md font-semibold text-on-surface">{user.name}</p>
          <p className="truncate text-label-sm text-on-surface-variant">{user.email}</p>
        </div>
      </Card>

      <Card hoverable={false} className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette size={18} className="text-on-surface-variant" />
          <div>
            <p className="text-body-sm font-medium text-on-surface">Appearance</p>
            <p className="text-label-sm text-on-surface-variant">{lightTheme ? 'Light theme' : 'Dark theme'}</p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lightTheme}
          aria-label="Toggle light theme"
          onClick={() => setLightTheme((value) => !value)}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
            lightTheme ? 'bg-primary' : 'bg-outline-variant'
          }`}
        >
          <motion.span
            layout
            transition={{ duration: 0.18 }}
            className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
            style={{ left: lightTheme ? '22px' : '2px' }}
          />
        </button>
      </Card>

      {settingsSections.map((section) => (
        <div key={section.heading} className="mt-5">
          <p className="mb-2 px-1 text-label-sm font-semibold uppercase tracking-wide text-outline">
            {section.heading}
          </p>
          <Card hoverable={false} padded={false}>
            {section.items.map((item) => (
              <button
                key={item.label}
                type="button"
                className="flex w-full items-center gap-3 border-b border-card-border px-4 py-3.5 text-left text-body-sm text-on-surface last:border-b-0 hover:bg-surface-soft cursor-pointer"
              >
                <item.icon size={18} className="text-on-surface-variant" />
                <span className="flex-1">{item.label}</span>
                <ChevronRight size={16} className="text-outline" />
              </button>
            ))}
          </Card>
        </div>
      ))}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-error/30 py-3 text-label-md font-semibold text-error transition-colors duration-150 hover:bg-error-container/40 cursor-pointer"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}

export default SettingsPage;
