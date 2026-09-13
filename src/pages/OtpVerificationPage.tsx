import { AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, RefreshCw, CheckCircle2, ArrowLeft, ExternalLink, Send, Check, Pencil, X } from 'lucide-react';
import { type FormEvent, useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useSignUp } from '@clerk/react/legacy';

const COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

export function OtpVerificationPage() {
  const location = useLocation();
  const { signUp, setActive, isLoaded } = useSignUp();

  const initialTarget: string = location.state?.target || 'your email address';

  const [target, setTarget] = useState<string>(initialTarget);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(initialTarget);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const val = element.value;
    if (val && isNaN(Number(val))) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    if (val !== '' && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, OTP_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];
    digits.forEach((digit, idx) => {
      if (idx < OTP_LENGTH) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    const lastIndex = Math.min(digits.length - 1, OTP_LENGTH - 1);
    inputs.current[lastIndex]?.focus();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;
    if (!isLoaded || !signUp) return;

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        localStorage.setItem('quicklearnit.hasOnboarded', 'true');
        window.location.href = '/dashboard';
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      const msg: string =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid code. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !isLoaded || !signUp) return;
    setError(null);
    setSuccessMsg(null);
    setIsResending(true);

    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setSuccessMsg(`A new verification code has been sent to ${target}.`);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      const msg: string =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to resend. Please try again.';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsUpdatingEmail(true);

    try {
      if (!isLoaded || !signUp) return;
      await signUp.update({ emailAddress: trimmed });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setTarget(trimmed);
      setIsEditingEmail(false);
      setSuccessMsg(`Verification code sent to ${trimmed}.`);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err: any) {
      const msg: string =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Failed to update email. Please try again.';
      setError(msg);
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const isGmail = target.toLowerCase().includes('gmail.com');

  return (
    <div className="flex min-h-screen flex-col justify-between bg-surface-container-lowest text-on-surface p-4 sm:p-10">
      {/* Brand Header */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-sm">
            Q
          </div>
          <span className="font-bold text-xl tracking-tight text-on-surface">
            Quick<span className="text-primary">Learnit</span>
          </span>
        </Link>

        <Link
          to="/signup"
          className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors bg-surface-container border border-card-border px-2.5 sm:px-3.5 py-2 rounded-xl hover:bg-surface-container-high"
        >
          <ArrowLeft size={14} />
          <span className="hidden sm:inline">Back to Sign Up</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>

      {/* Center Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6 sm:py-8">
        <div className="rounded-2xl border border-card-border bg-surface-container-low p-5 sm:p-8 shadow-md text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 sm:mb-6 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Send className="h-8 w-8" />
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Verify your email
          </h1>
          <p className="mt-1.5 text-sm text-on-surface-variant">
            We sent a 6-digit verification code to
          </p>

          <AnimatePresence mode="wait">
            {!isEditingEmail ? (
              <div className="mt-2.5 flex items-center justify-center gap-2">
                <span className="inline-block max-w-[260px] font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg text-xs sm:text-sm truncate">
                  {target}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewEmailInput(target);
                    setIsEditingEmail(true);
                  }}
                  title="Change email address"
                  aria-label="Change email address"
                  className="flex h-7 w-7 items-center justify-center text-on-surface-variant hover:text-on-surface bg-surface-container hover:bg-surface-container-high border border-card-border rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <Pencil size={12} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateEmail} className="mt-3 flex flex-col items-center gap-2">
                <div className="flex w-full items-center gap-2">
                  <input
                    type="email"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Enter new email address"
                    autoFocus
                    required
                    className="flex-1 bg-surface-container border border-card-border rounded-lg px-3 py-1.5 text-xs sm:text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={isUpdatingEmail}
                    className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {isUpdatingEmail ? (
                      <RefreshCw size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    <span>Update</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="p-1.5 text-on-surface-variant hover:text-on-surface rounded-lg border border-card-border cursor-pointer shrink-0"
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </form>
            )}
          </AnimatePresence>

          {/* Alert Messages */}
          {error && (
            <div className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 text-left">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-left">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* OTP Code Entry */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={data}
                  onChange={(e) => handleChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handlePaste}
                  ref={(el) => {
                    inputs.current[index] = el;
                  }}
                  className="h-14 w-12 sm:h-16 sm:w-14 text-center text-xl font-bold rounded-xl border border-card-border bg-surface-container text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors shadow-xs"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otp.join('').length !== OTP_LENGTH || isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Verify Code'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 space-y-2.5">
            {isGmail && (
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-colors cursor-pointer"
              >
                <Mail size={16} />
                <span>Open Gmail Inbox</span>
                <ExternalLink size={14} className="ml-1 opacity-70" />
              </a>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isResending}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-card-border bg-surface-container hover:bg-surface-container-high px-4 py-2.5 text-xs font-semibold text-on-surface transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={13} className={isResending ? 'animate-spin' : ''} />
              <span>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Footer note */}
      <div className="text-center text-xs text-on-surface-variant">
        Protected by Studexa Security • Academic Learning Platform
      </div>
    </div>
  );
}

export default OtpVerificationPage;
