import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { SignupPromptModal } from '../ui/SignupPromptModal';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { useSignupRedirect } from '../../hooks/useSignupRedirect';
import { useAuth } from '../../hooks/useAuth';

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { isSignupModalOpen, closeSignupModal } = useSignupRedirect();
  const isFullBleedPage = location.pathname.startsWith('/messages');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleSignupFromModal = () => {
    closeSignupModal();
    navigate('/signup');
  };

  const handleConfirmLogout = async () => {
    setShowLogoutAlert(false);
    await signOut();
    navigate('/signin', { replace: true });
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-surface',
        isFullBleedPage
          ? 'h-screen h-[100dvh] overflow-hidden'
          : 'min-h-screen xl:h-screen xl:overflow-hidden'
      )}
    >
      {/* Full-width top header */}
      <TopBar onMenuOpen={() => setMobileMenuOpen(true)} />

      {/* Body below the header */}
      <div className="relative flex flex-1 min-h-0 w-full overflow-hidden">
        <Sidebar />
        {isFullBleedPage ? (
          <main className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
            <Outlet />
          </main>
        ) : (
          <main className="flex-1 min-w-0 px-3.5 sm:px-6 pb-8 pt-4 sm:pt-6 lg:px-8 lg:pb-10 xl:overflow-y-auto">
            <div className="mx-auto w-full min-w-0 max-w-(--spacing-container-max)">
              <Outlet />
            </div>
          </main>
        )}
      </div>

      {/* Mobile drawer navigation */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={() => {
          setMobileMenuOpen(false);
          setShowLogoutAlert(true);
        }}
      />

      {/* Logout confirmation modal */}
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

      <SignupPromptModal
        isOpen={isSignupModalOpen}
        onClose={closeSignupModal}
        onSignup={handleSignupFromModal}
      />
    </div>
  );
}

export default AppShell;
