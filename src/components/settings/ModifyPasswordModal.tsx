import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, KeyRound, AlertTriangle, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/authService';

interface ModifyPasswordModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export function ModifyPasswordModal({ open, onClose, onSuccess }: Readonly<ModifyPasswordModalProps>) {
  const navigate = useNavigate();
  const { user, session } = useAuth();

  const userProviders = session?.user?.app_metadata?.providers || [];
  const userIdentities = session?.user?.identities || [];
  const primaryProvider = session?.user?.app_metadata?.provider;

  const isGoogleLinked = primaryProvider === 'google' || userProviders.includes('google');
  const hasExistingPassword =
    userProviders.includes('email') ||
    userIdentities.some((id: any) => id.provider === 'email') ||
    primaryProvider === 'email';

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Current password
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');

  // Step 2: New password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState('');

  // Shake animation trigger
  const [shakeKey, setShakeKey] = useState(0);

  const resetForm = () => {
    setStep(hasExistingPassword ? 1 : 2);
    setCurrentPassword('');
    setShowCurrentPassword(false);
    setIsVerifying(false);
    setCurrentPasswordError('');
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setIsUpdating(false);
    setNewPasswordError('');
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleVerifyCurrentPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current password.');
      setShakeKey((k) => k + 1);
      return;
    }

    setIsVerifying(true);
    setCurrentPasswordError('');

    try {
      const email = session?.user?.email || user?.email;
      const { error } = await authService.verifyCurrentPassword(currentPassword, email);
      if (error) {
        setCurrentPasswordError(error.message || 'Incorrect current password. Please try again.');
        setShakeKey((k) => k + 1);
        return;
      }

      // Current password is correct! Proceed to Step 2
      setStep(2);
    } catch (err: any) {
      setCurrentPasswordError(err?.message || 'Failed to verify password. Please try again.');
      setShakeKey((k) => k + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      setNewPasswordError('Please enter a new password.');
      setShakeKey((k) => k + 1);
      return;
    }

    if (newPassword.length < 6) {
      setNewPasswordError('New password must be at least 6 characters long.');
      setShakeKey((k) => k + 1);
      return;
    }

    if (hasExistingPassword && currentPassword && newPassword === currentPassword) {
      setNewPasswordError('New password must be different from your current password.');
      setShakeKey((k) => k + 1);
      return;
    }

    if (newPassword !== confirmPassword) {
      setNewPasswordError('Passwords do not match. Please retype carefully.');
      setShakeKey((k) => k + 1);
      return;
    }

    setIsUpdating(true);
    setNewPasswordError('');

    try {
      const { error } = await authService.updatePassword(newPassword);
      if (error) {
        setNewPasswordError(error.message || 'Failed to update password. Please try again.');
        setShakeKey((k) => k + 1);
        return;
      }

      const userEmail = session?.user?.email || user?.email || '';

      if (onSuccess) onSuccess();

      sessionStorage.setItem('studexa_password_changed', 'true');
      if (userEmail) {
        sessionStorage.setItem('studexa_prefill_email', userEmail);
      }

      // Sign out and redirect directly to sign in page
      await authService.signOut();
      handleClose();

      navigate('/signin', {
        replace: true,
        state: {
          message: 'Password changed successfully! Please sign in with your new password.',
          prefillEmail: userEmail,
        },
      });
    } catch (err: any) {
      setNewPasswordError(err?.message || 'An unexpected error occurred while updating your password.');
      setShakeKey((k) => k + 1);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={
        step === 3
          ? 'Password Updated'
          : !hasExistingPassword
          ? 'Set Account Password'
          : 'Modify Password'
      }
      description={
        step === 1
          ? 'Step 1 of 2: Verify your current password'
          : step === 2
          ? hasExistingPassword
            ? 'Step 2 of 2: Set your new password'
            : 'Create a password for your account'
          : undefined
      }
    >
      <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleVerifyCurrentPassword}
              className="flex flex-col gap-4 py-1"
            >
              <div className="rounded-xl border border-card-border bg-surface-container-lowest p-3 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-on-surface">Security Verification</p>
                  <p className="text-[11px] text-on-surface-variant mt-0.5">
                    For your security, please enter your existing password to verify ownership before setting a new one.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface flex items-center justify-between">
                  <span>Current Password</span>
                </label>
                <motion.div
                  key={`shake-current-${shakeKey}`}
                  animate={currentPasswordError ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="relative"
                >
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (currentPasswordError) setCurrentPasswordError('');
                    }}
                    placeholder="Enter your current password"
                    autoFocus
                    required
                    className="h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border px-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 shadow-2xs transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </motion.div>

                {currentPasswordError && (
                  <div className="flex flex-col gap-1.5 mt-0.5">
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-semibold text-error flex items-center gap-1.5"
                    >
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>{currentPasswordError}</span>
                    </motion.p>
                    {isGoogleLinked && (
                      <p className="text-[11px] text-on-surface-variant">
                        Signed in via Google? If you haven't created a Studexa password yet,{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPasswordError('');
                            setStep(2);
                          }}
                          className="font-semibold text-primary hover:underline cursor-pointer"
                        >
                          set your password directly
                        </button>
                        .
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-2 flex justify-end gap-2 pt-3 border-t border-card-border/60">
                <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isVerifying || !currentPassword.trim()}
                  icon={<KeyRound size={14} />}
                >
                  {isVerifying ? 'Verifying...' : 'Verify & Continue'}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              key="step-2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              onSubmit={handleUpdatePassword}
              className="flex flex-col gap-3.5 py-1"
            >
              {hasExistingPassword ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 flex items-center gap-2.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                  <span>Current password verified. You can now enter your new password.</span>
                </div>
              ) : (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 flex items-center gap-2.5 text-xs text-primary font-medium">
                  <KeyRound size={16} className="shrink-0 text-primary" />
                  <span>Set a password to use with your Studexa account.</span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError('');
                    }}
                    placeholder="Enter at least 6 characters"
                    autoFocus
                    required
                    minLength={6}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border px-3 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant/40 shadow-2xs transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface">Confirm New Password</label>
                <motion.div
                  key={`shake-new-${shakeKey}`}
                  animate={newPasswordError ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
                  transition={{ duration: 0.35 }}
                  className="relative"
                >
                  <input
                    type="text"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (newPasswordError) setNewPasswordError('');
                    }}
                    placeholder="Confirm your new password"
                    required
                    minLength={6}
                    className="h-10 w-full rounded-lg bg-surface-container-lowest border border-card-border px-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 shadow-2xs transition-colors focus:border-primary focus:ring-1 focus:ring-primary/25 focus:outline-none"
                  />
                </motion.div>

                {newPasswordError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs font-semibold text-error flex items-center gap-1.5 mt-0.5"
                  >
                    <AlertTriangle size={13} className="shrink-0" />
                    <span>{newPasswordError}</span>
                  </motion.p>
                )}
              </div>

              <div className="mt-2 flex justify-between items-center gap-2 pt-3 border-t border-card-border/60">
                {hasExistingPassword ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep(1);
                      setNewPasswordError('');
                    }}
                    icon={<ArrowLeft size={13} />}
                  >
                    Back
                  </Button>
                ) : <div />}
                <div className="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isUpdating || !newPassword || !confirmPassword}
                  >
                    {isUpdating ? 'Updating...' : hasExistingPassword ? 'Save New Password' : 'Set Password'}
                  </Button>
                </div>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center text-center gap-3 py-5"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-on-surface">Password Modified!</h3>
                <p className="mt-1 text-xs text-on-surface-variant max-w-xs mx-auto">
                  Your password has been successfully updated. Use your new password the next time you sign in.
                </p>
              </div>
              <div className="mt-3 w-full flex justify-center">
                <Button variant="primary" size="sm" onClick={handleClose}>
                  Done
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </Modal>
  );
}

export default ModifyPasswordModal;
