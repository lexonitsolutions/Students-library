import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Smartphone, RefreshCw, CheckCircle2, ArrowLeft, ExternalLink, Send, Check, Pencil, X } from 'lucide-react';
import { type FormEvent, useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CursorGlowTracker } from '../components/ui/CursorGlowTracker';
import { BackgroundVideo } from '../components/ui/BackgroundVideo';

const COOLDOWN_SECONDS = 60;

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyMobileOtp, resendSignupOtp, sendMobileOtp } = useAuth();

  const initialTarget: string = location.state?.target || 'your email address';
  const type: 'email' | 'mobile' = location.state?.type || 'email';

  const [target, setTarget] = useState<string>(initialTarget);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(initialTarget);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const OTP_LENGTH = type === 'mobile' ? 4 : 6;

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

  const handleMobileSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    const { error: verifyError } = await verifyMobileOtp(target, code);
    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError);
      return;
    }
    localStorage.setItem('quicklearnit.hasOnboarded', 'true');
    navigate('/dashboard', { replace: true });
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setSuccessMsg(null);
    setIsResending(true);

    const { error: resendError } = type === 'mobile' ? await sendMobileOtp(target) : await resendSignupOtp(target);
    setIsResending(false);

    if (resendError) {
      setError(resendError);
    } else {
      setSuccessMsg(
        type === 'mobile'
          ? `A new code has been sent to ${target}.`
          : `A new verification link has been sent to ${target}.`
      );
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const handleUpdateEmail = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newEmailInput.trim();
    if (!trimmed) {
      setError('Please enter a valid email address.');
      return;
    }
    if (type === 'email' && !trimmed.includes('@')) {
      setError('Please enter a valid email format.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsUpdatingEmail(true);

    const { error: resendErr } = type === 'mobile' ? await sendMobileOtp(trimmed) : await resendSignupOtp(trimmed);
    setIsUpdatingEmail(false);

    if (resendErr) {
      // If the email is not registered yet or needs full sign up, guide them
      if (resendErr.toLowerCase().includes('user not found') || resendErr.toLowerCase().includes('not registered')) {
        navigate('/signup', { state: { prefillEmail: trimmed } });
        return;
      }
      setError(resendErr);
    } else {
      setTarget(trimmed);
      setIsEditingEmail(false);
      setSuccessMsg(
        type === 'mobile'
          ? `Verification code sent to ${trimmed}.`
          : `Verification link sent to ${trimmed}.`
      );
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const isGmail = target.toLowerCase().includes('gmail.com');

  return (
    <div className="flex min-h-screen bg-[#0b0d14] text-slate-100 relative overflow-hidden select-none">
      <BackgroundVideo />
      <CursorGlowTracker />

      {/* ── BACKGROUND GLOW ORBS ── */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ── MAIN CENTERED LAYOUT ── */}
      <div className="flex flex-1 flex-col items-center justify-between p-6 sm:p-10 relative z-10 min-h-screen">
        {/* Brand Header */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div 
              whileHover={{ rotate: 12, scale: 1.05 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-500/25"
            >
              Q
            </motion.div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              QuickLearnit
            </span>
          </div>

          <Link
            to="/signup"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl hover:bg-white/10"
          >
            <ArrowLeft size={14} />
            <span>Back to Sign Up</span>
          </Link>
        </div>

        {/* Center Card */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[460px] bg-[#121522]/90 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-auto text-center"
        >
          {/* Animated Icon Header */}
          <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-500/10 border border-indigo-500/20 shadow-xl shadow-indigo-500/10">
            <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-md pointer-events-none" />
            {type === 'mobile' ? (
              <Smartphone className="h-10 w-10 text-indigo-400 relative z-10" />
            ) : (
              <Send className="h-10 w-10 text-indigo-400 relative z-10" />
            )}
          </div>

          {/* Heading & Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {type === 'mobile' ? 'Enter Mobile OTP' : 'Check your inbox'}
            </h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              {type === 'mobile' ? 'Enter the verification code sent to' : 'We sent a verification link to'}
            </p>
            
            <AnimatePresence mode="wait">
              {!isEditingEmail ? (
                <motion.div
                  key="display-target"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-2.5 flex items-center justify-center gap-2"
                >
                  <span className="inline-block max-w-[270px] font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm tracking-wide truncate shadow-sm">
                    {target}
                  </span>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setNewEmailInput(target);
                      setIsEditingEmail(true);
                    }}
                    title={type === 'mobile' ? 'Change mobile number' : 'Change email address'}
                    aria-label="Change email address"
                    className="flex h-8 w-8 items-center justify-center text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                  >
                    <Pencil size={13} />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.form
                  key="edit-target"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  onSubmit={handleUpdateEmail}
                  className="mt-3 flex flex-col items-center gap-2 max-w-sm mx-auto"
                >
                  <div className="flex w-full items-center gap-2">
                    <input
                      type={type === 'mobile' ? 'tel' : 'email'}
                      value={newEmailInput}
                      onChange={(e) => setNewEmailInput(e.target.value)}
                      placeholder={type === 'mobile' ? 'Enter new mobile number' : 'Enter new email address'}
                      autoFocus
                      required
                      className="flex-1 bg-white/5 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                    <button
                      type="submit"
                      disabled={isUpdatingEmail}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer shrink-0 shadow-md shadow-indigo-600/20"
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
                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer shrink-0"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Entered the wrong {type === 'mobile' ? 'number' : 'Gmail'}? Update it above or{' '}
                    <Link
                      to="/signup"
                      state={{ prefillEmail: newEmailInput || target }}
                      className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      sign up again
                    </Link>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Alert Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-400 text-left"
            >
              {error}
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-semibold text-emerald-400 flex items-center gap-2 text-left"
            >
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* EMAIL VERIFICATION LINK INTERFACE */}
          {type === 'email' ? (
            <div className="space-y-6">
              {/* Instructions Box */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5 text-left space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 mt-0.5">
                    1
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Open your email inbox and look for the confirmation message from <strong className="text-white">QuickLearnit</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold border border-indigo-500/30 mt-0.5">
                    2
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Click the <strong className="text-indigo-400">"Confirm your mail"</strong> link inside the email.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 mt-0.5">
                    <Check size={13} />
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    Your account will be verified and you will be signed in automatically!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-1">
                {isGmail && (
                  <motion.a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.015 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] px-5 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[position:right_center] transition-all duration-300 cursor-pointer"
                  >
                    <Mail size={16} />
                    <span>Open Gmail Inbox</span>
                    <ExternalLink size={14} className="ml-1" />
                  </motion.a>
                )}

                <motion.button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || isResending}
                  whileHover={{ scale: cooldown > 0 ? 1 : 1.015 }}
                  whileTap={{ scale: cooldown > 0 ? 1 : 0.98 }}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-xs font-semibold transition-all cursor-pointer ${
                    cooldown > 0
                      ? 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                      : 'bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {isResending ? (
                    <RefreshCw size={13} className="animate-spin text-indigo-400" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  <span>
                    {cooldown > 0 ? `Resend link in ${cooldown}s` : 'Resend verification link'}
                  </span>
                </motion.button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmailInput(target);
                      setIsEditingEmail(true);
                    }}
                    className="text-xs font-semibold text-slate-400 hover:text-indigo-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Pencil size={12} />
                    <span>Wrong email address? <strong className="underline decoration-indigo-500/50 underline-offset-4 text-indigo-400 hover:text-indigo-300">Change email</strong></span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MOBILE OTP FORM */
            <form onSubmit={handleMobileSubmit} className="space-y-6">
              {/* 4-digit OTP boxes */}
              <div className="flex justify-center gap-3 sm:gap-4">
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
                    className="h-16 w-14 sm:h-18 sm:w-16 text-center text-2xl font-extrabold rounded-2xl border-2 border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none transition-all duration-200 shadow-lg"
                  />
                ))}
              </div>

              <p className="text-center text-xs text-slate-500 -mt-2">
                Enter the {OTP_LENGTH}-digit code sent to <span className="text-indigo-400 font-semibold">{target}</span>
              </p>

              <motion.div className="relative group pt-1" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 blur group-hover:opacity-100 transition duration-300 group-hover:duration-200" />
                <button
                  type="submit"
                  disabled={otp.join('').length !== OTP_LENGTH || isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] px-5 py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[position:right_center] transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify Code'}</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </motion.div>

              <div className="text-center text-xs font-semibold text-slate-400">
                <span>Didn't receive the code? </span>
                {cooldown > 0 ? (
                  <span className="text-slate-500">Resend in {cooldown}s</span>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleResend} 
                    disabled={isResending}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5 ml-1 font-bold"
                  >
                    {isResending ? <RefreshCw size={12} className="animate-spin" /> : null}
                    <span>Resend code</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </motion.div>

        {/* Bottom Footer note */}
        <p className="text-xs text-slate-500 font-medium">
          Protected by QuickLearnit Security • Knowledge Sharing Platform
        </p>
      </div>
    </div>
  );
}

export default OtpVerificationPage;
