import {
  ArrowRight,
  Eye,
  EyeOff,
  BookOpen,
  CheckCircle2,
  Lock,
  Mail,
  Award,
  Sparkles,
  Users,
  ArrowLeft,
  KeyRound,
  Pencil,
  RotateCw,
} from 'lucide-react';
import { type FormEvent, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Logo } from '../components/ui/Logo';

export function SignInPage() {
  const location = useLocation();
  const emailFromStorage =
    sessionStorage.getItem('answersbro_prefill_email') ||
    sessionStorage.getItem('studexa_prefill_email');
  const wasPasswordChanged =
    sessionStorage.getItem('answersbro_password_changed') === 'true' ||
    sessionStorage.getItem('studexa_password_changed') === 'true';

  useEffect(() => {
    if (wasPasswordChanged) {
      sessionStorage.removeItem('answersbro_password_changed');
      sessionStorage.removeItem('answersbro_prefill_email');
      sessionStorage.removeItem('studexa_password_changed');
      sessionStorage.removeItem('studexa_prefill_email');
    }
  }, [wasPasswordChanged]);

  const [email, setEmail] = useState(
    (location.state as any)?.prefillEmail || emailFromStorage || '',
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isVerified = new URLSearchParams(location.search).get('verified') === 'true';
  const successMessage =
    ((location.state as any)?.message as string | undefined) ||
    (wasPasswordChanged
      ? 'Password changed successfully! Please sign in with your new password.'
      : isVerified
      ? 'Email verified successfully! Please sign in to your account.'
      : undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);
  const [noAccountEmail, setNoAccountEmail] = useState<string | null>(null);
  const {
    signIn,
    signInWithGoogle,
    signInWithLinkedIn,
    checkAccountStatus,
    resetPassword,
    sendSignInOtp,
    verifySignInOtp,
  } = useAuth();
  const { chooseWorkspace } = useWorkspace();
  const { getAndClearRedirectPath } = useSignupRedirect();
  const navigate = useNavigate();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    // Intercept back button to strictly go to /get-started
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      navigate('/get-started', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  useEffect(() => {
    sessionStorage.removeItem('oauth_signup_pending');
    sessionStorage.removeItem('oauth_signup_reason');
    sessionStorage.removeItem('oauth_source');
    setIsGoogleLoading(false);
    setIsLinkedInLoading(false);

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsGoogleLoading(false);
        setIsLinkedInLoading(false);
        sessionStorage.removeItem('oauth_signup_pending');
        sessionStorage.removeItem('oauth_signup_reason');
        sessionStorage.removeItem('oauth_source');
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const { error: resetError } = await resetPassword(email.trim());
    setIsSubmitting(false);
    
    if (resetError) {
      setError(resetError);
    } else {
      setResetEmailSent(true);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const emailVal = email.trim();
    const passwordVal = password;

    let userIsAdmin = false;
    try {
      const status = await checkAccountStatus(emailVal);
      if (status.isAdmin) {
        userIsAdmin = true;
      } else if (!status.hasAccount && !status.isUnconfirmed) {
        setIsSubmitting(false);
        setNoAccountEmail(emailVal);
        return;
      }
    } catch {
      // If status check fails, proceed with normal sign-in
    }

    const { error: signInError, needsSecondFactor } = await signIn({ email: emailVal, password: passwordVal });
    setIsSubmitting(false);

    if (signInError) {
      setError(signInError);
    } else if (needsSecondFactor) {
      chooseWorkspace(userIsAdmin ? 'admin' : 'student');
      navigate('/verify-otp', {
        state: { target: emailVal, type: 'email', isSecondFactor: true, isAdmin: userIsAdmin },
      });
    } else {
      chooseWorkspace(userIsAdmin ? 'admin' : 'student');
      const redirectPath = getAndClearRedirectPath();
      if (redirectPath && !userIsAdmin) {
        navigate(redirectPath);
      } else {
        navigate(userIsAdmin ? '/admin' : '/dashboard');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      sessionStorage.setItem('oauth_source', 'signin');
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError(googleError);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
      setIsGoogleLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    try {
      setIsLinkedInLoading(true);
      setError(null);
      sessionStorage.setItem('oauth_source', 'signin');
      const { error: linkedInError } = await signInWithLinkedIn();
      if (linkedInError) {
        setError(linkedInError);
        setIsLinkedInLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'LinkedIn sign-in failed');
      setIsLinkedInLoading(false);
    }
  };

  const handleSendOtp = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setNoAccountEmail(null);

    const emailVal = email.trim();
    if (!emailVal) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const status = await checkAccountStatus(emailVal);
      if (!status.isAdmin && !status.hasAccount && !status.isUnconfirmed) {
        setIsSubmitting(false);
        setNoAccountEmail(emailVal);
        return;
      }
    } catch {
      // Proceed if status check fails
    }

    const { error: sendError } = await sendSignInOtp(emailVal);
    setIsSubmitting(false);

    if (sendError) {
      setError(sendError);
    } else {
      setOtpSent(true);
      setOtp(Array(6).fill(''));
      setResendCooldown(30);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 100);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join('').trim();
    if (code.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setIsSubmitting(true);
    const emailVal = email.trim();

    let userIsAdmin = false;
    try {
      const status = await checkAccountStatus(emailVal);
      if (status.isAdmin) {
        userIsAdmin = true;
      }
    } catch {
      // Proceed
    }

    const { error: verifyError, needsSecondFactor } = await verifySignInOtp(emailVal, code);
    setIsSubmitting(false);

    if (verifyError) {
      setError(verifyError);
    } else if (needsSecondFactor) {
      chooseWorkspace(userIsAdmin ? 'admin' : 'student');
      navigate('/verify-otp', {
        state: { target: emailVal, type: 'email', isSecondFactor: true, isAdmin: userIsAdmin },
      });
    } else {
      chooseWorkspace(userIsAdmin ? 'admin' : 'student');
      const redirectPath = getAndClearRedirectPath();
      if (redirectPath && !userIsAdmin) {
        navigate(redirectPath);
      } else {
        navigate(userIsAdmin ? '/admin' : '/dashboard');
      }
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const val = element.value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = val ? val[val.length - 1] : '';
    setOtp(newOtp);

    if (val && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    const digits = pastedData.split('');
    digits.forEach((digit, idx) => {
      if (idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);

    const nextFocusIndex = Math.min(digits.length, 5);
    otpInputs.current[nextFocusIndex]?.focus();
  };

  const handleChangeEmail = () => {
    setOtpSent(false);
    setOtp(Array(6).fill(''));
    setError(null);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    const { error: resendError } = await sendSignInOtp(email.trim());
    setIsSubmitting(false);

    if (resendError) {
      setError(resendError);
    } else {
      setResendCooldown(30);
    }
  };

  return (
    <div className="relative h-screen w-full bg-[#FFFDF9] text-on-surface overflow-hidden flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ── ARCHITECTURAL GRID BACKGROUND ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,200,180,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,200,180,0.18)_1px,transparent_1px)] bg-[size:3.2rem_3.2rem] pointer-events-none" />

      {/* ── AMBIENT WARM & COOL GLOWS ── */}
      <div className="absolute -top-24 -left-24 h-[500px] w-[500px] rounded-full bg-blue-500/8 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 h-[450px] w-[450px] rounded-full bg-amber-400/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-24 right-0 h-[450px] w-[450px] rounded-full bg-orange-300/10 blur-[130px] pointer-events-none" />

      {/* ── TOP HEADER NAVIGATION ── */}
      <header className="relative z-30 w-full px-6 py-3 sm:px-10 lg:px-14 flex items-center justify-between shrink-0">
        <Link to="/get-started" className="flex items-center transition-opacity hover:opacity-90">
          <Logo height={30} />
        </Link>
        <Link
          to="/get-started"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft size={14} /> Back to home
        </Link>
      </header>

      {/* ── MAIN TWO-COLUMN CONTENT ── */}
      <main className="relative z-20 mx-auto w-full max-w-7xl px-6 sm:px-10 lg:px-14 flex-1 min-h-0 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center w-full">
          
          {/* ── LEFT COLUMN: HEADLINE & BENEFIT CARDS — hidden on mobile ── */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EEF2FF] text-primary border border-primary/20 mb-3 shadow-xs self-start">
              <Sparkles size={13} className="text-primary" />
              <span>Academic Resource Exchange</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl xl:text-[36px] font-extrabold tracking-tight text-on-surface leading-[1.18] mb-2.5">
              Elevate your study routine with <span className="text-primary">verified resources</span>.
            </h1>

            {/* Subtitle */}
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4 max-w-xl">
              Access thousands of curriculum-aligned notes, past semester exams, and lecture summaries uploaded by top students.
            </p>

            {/* Key Benefits of answersbro */}
            <div className="flex flex-col gap-2.5 max-w-[500px]">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BookOpen size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Verified Study Notes & Past Exams</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                    Access syllabus-tailored lecture notes, formula sheets, and past question papers curated by top-performing students.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
                  <Award size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">100% Free & Open Access</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                    No paywalls or hidden subscriptions. Every academic resource is freely accessible to empower students everywhere.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-xs backdrop-blur-xs transition-all hover:bg-white hover:shadow-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                  <Users size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-on-surface">Peer-to-Peer Academic Network</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed mt-0.5">
                    Collaborate with classmates across colleges, share solutions, ask questions, and prepare for finals together.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: AUTH CARD FLANKED BY 3D CHARACTERS ── */}
          <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex items-center justify-center relative w-full max-w-[420px] mx-auto lg:max-w-none lg:mx-0">
            
            {/* 3D Boy standing on left of card (rendered on sign in, removed on reset password for clean layout) */}
            {!isForgotPassword && (
              <div className="hidden xl:block absolute -left-28 2xl:-left-32 bottom-0 z-40 pointer-events-none select-none">
                <img
                  src="/images/answersbro-flanking-boy.png"
                  alt="Student with books"
                  className="h-[380px] 2xl:h-[420px] w-auto object-contain drop-shadow-2xl"
                />
              </div>
            )}

            {/* 3D Girl standing on right of card */}
            <div className="hidden xl:block absolute -right-32 2xl:-right-36 bottom-0 z-40 pointer-events-none select-none">
              <img
                src={isForgotPassword ? '/images/answersbro-reset-girl.png' : '/images/answersbro-flanking-girl.png'}
                alt={isForgotPassword ? 'Student studying' : 'Student with tablet'}
                className="h-[380px] 2xl:h-[420px] w-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Decorative Floating 3D Study Element */}
            <div className="hidden xl:flex absolute -top-8 -left-8 h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-md border border-amber-200/50 text-amber-500 z-10">
              <BookOpen size={18} />
            </div>

            {/* The Central Authentication Card */}
            <motion.div
              key="signin-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-[400px] rounded-[28px] border border-slate-200/85 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-200/60"
            >

              {/* Segmented Tab Switcher */}
              {!isForgotPassword && (
                <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl mb-5 text-xs font-semibold">
                  <button
                    type="button"
                    className="py-2 rounded-xl bg-white text-on-surface shadow-xs font-bold transition-all"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="py-2 rounded-xl text-on-surface-variant hover:text-on-surface transition-all font-medium cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              )}

              {isForgotPassword ? (
                <div className="mb-5 text-left">
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline mb-2 cursor-pointer"
                  >
                    <ArrowLeft size={13} /> Back to sign in
                  </button>
                  <h2 className="text-2xl font-bold tracking-tight text-on-surface">Reset Password</h2>
                  <p className="mt-1 text-xs text-on-surface-variant">Enter your email address to receive a recovery link.</p>
                </div>
              ) : (
                <div className="mb-4 text-left">
                  {loginMethod === 'otp' && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod('password');
                        setOtpSent(false);
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mb-2 cursor-pointer"
                    >
                      <ArrowLeft size={13} /> Back to password sign in
                    </button>
                  )}
                  <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                    {loginMethod === 'otp' ? 'Sign in with OTP' : 'Sign in'}
                  </h2>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {loginMethod === 'password'
                      ? 'Welcome back! Enter your credentials to access your library.'
                      : otpSent
                      ? 'Enter the 6-digit verification code sent to your email.'
                      : 'Sign in password-free with a one-time verification code.'}
                  </p>
                </div>
              )}



              {/* Success Message */}
              {successMessage && !isForgotPassword && (
                <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              {/* No Account Prompt */}
              {noAccountEmail && (
                <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-left">
                  <p className="font-semibold text-amber-800 mb-1">No account found for this email.</p>
                  <p className="text-amber-800/80 mb-2.5">
                    <span className="font-bold">{noAccountEmail}</span> is not registered yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/signup', { state: { prefillEmail: noAccountEmail } })}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Create a new account →
                  </button>
                </div>
              )}

              {/* Social Sign-in Options (only in Password login mode) */}
              {!isForgotPassword && loginMethod === 'password' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isGoogleLoading || isLinkedInLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isGoogleLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
                      ) : (
                        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                      )}
                      <span>{isGoogleLoading ? 'Connecting...' : 'Google'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLinkedInSignIn}
                      disabled={isGoogleLoading || isLinkedInLoading}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLinkedInLoading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#0A66C2]" />
                      ) : (
                        <svg className="h-4 w-4 shrink-0 fill-[#0A66C2]" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                        </svg>
                      )}
                      <span>{isLinkedInLoading ? 'Connecting...' : 'LinkedIn'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('otp');
                      setError(null);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 hover:bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-700 transition-all cursor-pointer shadow-xs active:scale-[0.99]"
                  >
                    <KeyRound className="h-4 w-4 text-primary shrink-0" />
                    <span>Sign in with OTP</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-on-surface-variant font-semibold tracking-wider text-[10px]">
                        or sign in with password
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Form */}
              {!resetEmailSent ? (
                <form
                  onSubmit={
                    isForgotPassword
                      ? handleResetPassword
                      : loginMethod === 'otp'
                      ? otpSent
                        ? handleVerifyOtp
                        : handleSendOtp
                      : handleSubmit
                  }
                  className="space-y-3.5"
                >
                  {/* Password Login Flow OR Forgot Password OR OTP Step 1 */}
                  {(!otpSent || isForgotPassword || loginMethod === 'password') && (
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-on-surface mb-1 text-left">
                        Email address
                      </label>
                      <AnimatedInput
                        type="email"
                        id="email"
                        icon={<Mail className="h-4 w-4 text-on-surface-variant" />}
                        className="block w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="student@university.edu"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setNoAccountEmail(null); }}
                        required
                      />
                    </div>
                  )}

                  {/* Password field only in password login mode */}
                  {!isForgotPassword && loginMethod === 'password' && (
                    <div>
                      <div className="mb-1">
                        <label htmlFor="password" className="block text-xs font-semibold text-on-surface text-left">
                          Password
                        </label>
                      </div>
                      <div className="relative">
                        <AnimatedInput
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          icon={<Lock className="h-4 w-4 text-on-surface-variant" />}
                          className="block w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required={!isForgotPassword && loginMethod === 'password'}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface cursor-pointer z-30"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end mt-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setLoginMethod('otp');
                            setError(null);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline cursor-pointer"
                        >
                          <KeyRound size={12} />
                          <span>Sign in with OTP instead</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP Step 2: 6-digit Code Input Form */}
                  {!isForgotPassword && loginMethod === 'otp' && otpSent && (
                    <div className="space-y-3 pt-1">
                      {/* Email banner with Change action */}
                      <div className="rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-4 w-4 text-primary shrink-0" />
                          <span className="truncate text-on-surface-variant text-left">
                            Code sent to <span className="font-semibold text-on-surface">{email}</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleChangeEmail}
                          className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0 ml-2 cursor-pointer"
                        >
                          <Pencil size={11} /> Change
                        </button>
                      </div>

                      {/* 6 Digit Input Boxes */}
                      <div>
                        <label className="block text-xs font-semibold text-on-surface mb-2 text-center">
                          Enter 6-digit verification code
                        </label>
                        <div className="flex justify-center gap-2 sm:gap-2.5">
                          {otp.map((digit, index) => (
                            <input
                              key={index}
                              type="text"
                              maxLength={1}
                              inputMode="numeric"
                              pattern="[0-9]*"
                              value={digit}
                              onChange={(e) => handleOtpChange(e.target, index)}
                              onFocus={(e) => e.target.select()}
                              onKeyDown={(e) => handleOtpKeyDown(e, index)}
                              onPaste={handleOtpPaste}
                              ref={(el) => {
                                otpInputs.current[index] = el;
                              }}
                              className="h-11 w-10 sm:h-12 sm:w-11 rounded-xl border border-slate-200 bg-slate-50/80 text-center text-lg sm:text-xl font-bold text-on-surface shadow-xs transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Resend OTP Link */}
                      <div className="text-center text-xs text-on-surface-variant pt-1">
                        <span>Didn't receive the code? </span>
                        {resendCooldown > 0 ? (
                          <span className="font-medium text-on-surface-variant/70">Resend in {resendCooldown}s</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                          >
                            <RotateCw size={12} /> Resend OTP
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      (loginMethod === 'otp' && otpSent && otp.join('').length !== 6) ||
                      (loginMethod === 'otp' && !otpSent && !email.trim())
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2"
                  >
                    <span>
                      {isSubmitting 
                        ? (isForgotPassword 
                            ? 'Sending...' 
                            : loginMethod === 'otp'
                            ? (otpSent ? 'Verifying...' : 'Sending OTP...')
                            : 'Signing in...') 
                        : (isForgotPassword 
                            ? 'Send Reset Link' 
                            : loginMethod === 'otp'
                            ? (otpSent ? 'Verify & Sign In' : 'Send Login OTP')
                            : 'Sign In')}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {loginMethod === 'otp' && (
                    <div className="text-center pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('password');
                          setOtpSent(false);
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <Lock size={12} />
                        <span>Sign in with password instead</span>
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center space-y-3">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface">Check your email</h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    We sent a password reset link to <span className="font-semibold text-on-surface">{email}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Return to Sign In
                  </button>
                </div>
              )}

              {/* Footer link */}
              <p className="mt-5 text-center text-xs text-on-surface-variant">
                {isForgotPassword ? (
                  <>
                    Remembered your password?{' '}
                    <button type="button" onClick={() => { setIsForgotPassword(false); setResetEmailSent(false); }} className="font-semibold text-primary hover:underline cursor-pointer">
                      Sign in instead
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <Link to="/signup" className="font-semibold text-primary hover:underline">
                      Create an account
                    </Link>
                  </>
                )}
              </p>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ── FULL WIDTH BOTTOM FOOTER ── */}
      <footer className="hidden lg:flex relative z-30 w-full px-6 py-2.5 sm:px-10 lg:px-14 border-t border-[#E9E2D8]/80 items-center justify-between gap-4 text-[11px] text-on-surface-variant bg-white/40 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-6 sm:gap-8">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={13} className="text-primary" /> Verified Academic Content
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Award size={13} className="text-amber-500" /> Free for Students
          </span>
        </div>
      </footer>
    </div>
  );
}

export default SignInPage;

