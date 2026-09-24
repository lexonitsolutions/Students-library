import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Mail,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Check,
  Pencil,
  X,
  BookOpen,
  Award,
  Users,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { type FormEvent, useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui/Logo';

const COOLDOWN_SECONDS = 60;

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifySignupOtp, resendSignupOtp } = useAuth();

  const initialTarget: string = location.state?.target || 'your email address';
  const type: 'email' | 'mobile' = location.state?.type || 'email';

  const [target, setTarget] = useState<string>(initialTarget);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(initialTarget);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const OTP_LENGTH = 6;

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

  useEffect(() => {
    try {
      const channel = new BroadcastChannel('answersbro_auth');
      channel.onmessage = (event) => {
        if (event.data === 'verified_signup') {
          window.close();
          setTimeout(() => {
            navigate('/signin', {
              replace: true,
              state: { message: 'Email verified successfully! Please sign in.' },
            });
          }, 300);
        }
      };
      return () => channel.close();
    } catch {
      // BroadcastChannel not supported
    }
  }, [navigate]);

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

  const handleOtpSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);
    const { error: verifyError } = await verifySignupOtp(target, code);
    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError);
      return;
    }
    const isAdmin = location.state?.isAdmin || target.toLowerCase() === 'lexonitservices@gmail.com';
    localStorage.setItem('quicklearnit.hasOnboarded', 'true');
    navigate(isAdmin ? '/admin' : '/dashboard', { replace: true });
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;
    setError(null);
    setSuccessMsg(null);
    setIsResending(true);

    const { error: resendError } = await resendSignupOtp(target);
    setIsResending(false);

    if (resendError) {
      setError(resendError);
    } else {
      setSuccessMsg(`A new verification code has been sent to ${target}.`);
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

    const { error: resendErr } = await resendSignupOtp(trimmed);
    setIsUpdatingEmail(false);

    if (resendErr) {
      if (resendErr.toLowerCase().includes('user not found') || resendErr.toLowerCase().includes('not registered')) {
        navigate('/signup', { state: { prefillEmail: trimmed } });
        return;
      }
      setError(resendErr);
    } else {
      setTarget(trimmed);
      setIsEditingEmail(false);
      setSuccessMsg(`Verification code sent to ${trimmed}.`);
      setCooldown(COOLDOWN_SECONDS);
    }
  };

  const isGmail = target.toLowerCase().includes('gmail.com');

  return (
    <div className="relative flex min-h-screen flex-col justify-between overflow-x-hidden bg-[#FFFDF9] text-on-surface antialiased selection:bg-primary/20 selection:text-primary">
      {/* ── BACKGROUND ARCHITECTURAL GRID & GLOWS (identical to SignIn/SignUp) ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,rgba(215,200,180,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,200,180,0.18)_1px,transparent_1px)] bg-[size:32px_32px]"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[140px]" />
      <div className="pointer-events-none absolute top-1/2 -right-32 h-[450px] w-[450px] rounded-full bg-amber-400/8 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-24 right-0 h-[450px] w-[450px] rounded-full bg-orange-300/10 blur-[130px]" />

      {/* ── TOP HEADER NAVIGATION ── */}
      <header className="relative z-30 flex w-full shrink-0 items-center justify-between px-6 py-3 sm:px-10 lg:px-14">
        <Link to="/get-started" className="flex items-center transition-opacity hover:opacity-90">
          <Logo height={30} />
        </Link>
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft size={14} /> Back to sign up
        </Link>
      </header>

      {/* ── MAIN TWO-COLUMN CONTENT ── */}
      <main className="relative z-20 mx-auto flex w-full max-w-7xl flex-1 min-h-0 items-center px-6 sm:px-10 lg:px-14">
        <div className="grid w-full grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8">

          {/* ── LEFT COLUMN: HEADLINE & BENEFIT CARDS (Desktop) ── */}
          <div className="hidden flex-col justify-center lg:col-span-6 lg:flex xl:col-span-7">
            {/* Badge */}
            <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-[#EEF2FF] px-3.5 py-1 text-xs font-semibold text-primary shadow-xs">
              <Sparkles size={13} className="text-primary" />
              <span>Identity Verification</span>
            </div>

            {/* Headline */}
            <h1 className="mb-2.5 text-2xl font-extrabold tracking-tight text-on-surface leading-[1.18] sm:text-3xl xl:text-[36px]">
              Almost there! <span className="text-primary">Confirm your email</span> to continue.
            </h1>

            {/* Subtitle */}
            <p className="mb-4 max-w-xl text-sm leading-relaxed text-on-surface-variant">
              We need to verify your email address to ensure your account security and grant you instant access to the entire answersbro study library.
            </p>

            {/* Benefits matching SignIn & SignUp */}
            <div className="flex max-w-[500px] flex-col gap-2.5">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Secure Student Profiles</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">
                    Your verification safeguards your uploads, peer discussions, bookmarks, and academic achievements.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Immediate Resource Access</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">
                    Once verified, download free syllabus guides, lecture notes, formula sheets, and past question papers instantly.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Users size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Peer-to-Peer Academic Community</h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-on-surface-variant">
                    Connect with classmates across universities, exchange verified solutions, and prepare for exams together.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: OTP VERIFICATION CARD FLANKED BY 3D CHARACTERS ── */}
          <div className="relative col-span-1 mx-auto flex w-full max-w-[420px] items-center justify-center lg:col-span-6 lg:mx-0 lg:max-w-none xl:col-span-5">

            {/* 3D Student Girl — left flanking illustration */}
            <div className="pointer-events-none absolute -left-40 bottom-0 z-40 hidden select-none xl:block 2xl:-left-42">
              <img
                src="/images/answersbro-flanking-girl.png"
                alt="Student girl studying"
                className="h-[360px] w-auto object-contain drop-shadow-2xl 2xl:h-[400px]"
              />
            </div>

            {/* 3D Student Boy — right flanking illustration */}
            <div className="pointer-events-none absolute -right-34 bottom-0 z-40 hidden select-none xl:block 2xl:-right-36">
              <img
                src="/images/answersbro-flanking-boy.png"
                alt="Student boy with tablet"
                className="h-[360px] w-auto object-contain drop-shadow-2xl 2xl:h-[400px]"
              />
            </div>

            {/* Decorative Floating 3D Study Element */}
            <div className="absolute -top-8 -left-8 z-10 hidden h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/50 bg-white/90 text-amber-500 shadow-md xl:flex">
              <Award size={18} />
            </div>

            {/* The Central Verification Card */}
            <motion.div
              key="otp-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-[420px] rounded-[28px] border border-slate-200/85 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-200/60 text-center"
            >
              {/* Icon badge */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                {type === 'mobile' ? (
                  <Smartphone className="h-7 w-7" />
                ) : (
                  <Mail className="h-7 w-7" />
                )}
              </div>

              {/* Title & Subtitle */}
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
                {type === 'mobile' ? 'Enter Mobile Code' : 'Check your inbox'}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-on-surface-variant">
                {type === 'mobile'
                  ? 'Enter the 6-digit verification code sent to'
                  : 'We sent a 6-digit verification code to'}
              </p>

              {/* Target email / phone pill + inline editor */}
              <AnimatePresence mode="wait">
                {!isEditingEmail ? (
                  <div className="mt-2.5 flex items-center justify-center gap-2">
                    <span className="inline-block max-w-[240px] sm:max-w-[270px] truncate rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {target}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewEmailInput(target);
                        setIsEditingEmail(true);
                      }}
                      title={type === 'mobile' ? 'Change mobile number' : 'Change email address'}
                      aria-label="Change email address"
                      className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-on-surface-variant transition-colors hover:bg-slate-100 hover:text-on-surface"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdateEmail} className="mt-3 flex flex-col items-center gap-2">
                    <div className="flex w-full items-center gap-2">
                      <input
                        type={type === 'mobile' ? 'tel' : 'email'}
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        placeholder={type === 'mobile' ? 'Enter new mobile number' : 'Enter new email address'}
                        autoFocus
                        required
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                      />
                      <button
                        type="submit"
                        disabled={isUpdatingEmail}
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-50"
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
                        className="shrink-0 cursor-pointer rounded-xl border border-slate-200 p-1.5 text-on-surface-variant transition-colors hover:bg-slate-100 hover:text-on-surface"
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
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-left text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-left text-xs font-semibold text-emerald-600">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* OTP Input Form */}
              <form onSubmit={handleOtpSubmit} className="mt-6 space-y-5">
                <div className="flex justify-center gap-2 sm:gap-2.5">
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
                      className="h-12 w-10 sm:h-14 sm:w-12 rounded-xl border border-slate-200 bg-slate-50/80 text-center text-lg sm:text-xl font-bold text-on-surface shadow-xs transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={otp.join('').length !== OTP_LENGTH || isSubmitting}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm shadow-primary/20 transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify Code'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                {isGmail && (
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:bg-slate-100"
                  >
                    <Mail size={14} className="text-red-500" />
                    <span>Open Gmail Inbox</span>
                    <ExternalLink size={12} className="ml-0.5 opacity-70" />
                  </a>
                )}

                <div className="text-center text-xs text-on-surface-variant">
                  <span>Didn't receive the code? </span>
                  {cooldown > 0 ? (
                    <span className="font-medium text-on-surface-variant/70">Resend in {cooldown}s</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isResending}
                      className="ml-1 cursor-pointer font-semibold text-primary hover:underline"
                    >
                      {isResending ? 'Sending...' : 'Resend code'}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── BOTTOM FOOTER NOTE ── */}
      <footer className="relative z-30 shrink-0 py-4 text-center text-[11px] text-on-surface-variant/80">
        Protected by answersbro Security • Academic Learning Platform
      </footer>
    </div>
  );
}

export default OtpVerificationPage;

