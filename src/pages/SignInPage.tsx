import { ArrowRight, Eye, EyeOff, Smartphone, BookOpen, CheckCircle2, Lock, Mail, Award, Sparkles } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { AnimatedInput } from '../components/ui/AnimatedInput';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noAccountEmail, setNoAccountEmail] = useState<string | null>(null);
  const { signIn, signInWithGoogle, sendMobileOtp, checkAccountStatus } = useAuth();
  const { chooseWorkspace } = useWorkspace();
  const { getAndClearRedirectPath } = useSignupRedirect();
  const navigate = useNavigate();

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

    const { error: signInError } = await signIn({ email: emailVal, password: passwordVal });
    setIsSubmitting(false);

    if (signInError) {
      if (signInError.toLowerCase().includes('pending')) {
        navigate('/verify-otp', {
          state: {
            target: emailVal,
            type: 'email',
          },
        });
      } else {
        setError(signInError);
      }
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
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-surface-container-lowest text-on-surface">
      {/* ── LEFT BRANDING PANEL (Desktop only) ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-slate-200/90 dark:border-card-border bg-gradient-to-br from-slate-100 via-[#EDF2F9] to-slate-100 dark:from-surface-container-low dark:to-surface-container relative overflow-hidden">
        {/* Subtle tinted grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.07)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-black text-lg shadow-sm">
              Q
            </div>
            <span className="font-bold text-xl tracking-tight text-on-surface">
              Quick<span className="text-primary">Learnit</span>
            </span>
          </Link>
        </div>

        {/* Center Content Showcase */}
        <motion.div
          key="signin-showcase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="relative z-10 max-w-md mx-auto my-auto py-12"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
            <Sparkles size={13} />
            <span>Academic Resource Exchange</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-4 leading-tight">
            Elevate your study routine with verified resources.
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed mb-8">
            Access thousands of curriculum-aligned notes, past semester exams, and lecture summaries uploaded by top students.
          </p>

          {/* Academic Resource Card Preview */}
          <div className="rounded-2xl border border-slate-200 dark:border-card-border bg-white dark:bg-surface-container p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">Algorithms & Data Structures</h4>
                  <p className="text-xs text-on-surface-variant">CS301 • 42 Pages • Verified PDF</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Verified
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-card-border/60 text-center">
              <div>
                <div className="text-xs text-on-surface-variant">Downloads</div>
                <div className="text-sm font-bold text-on-surface">3.8k+</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">Rating</div>
                <div className="text-sm font-bold text-on-surface">4.9 / 5</div>
              </div>
              <div>
                <div className="text-xs text-on-surface-variant">Contributors</div>
                <div className="text-sm font-bold text-on-surface">120+</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Meta */}
        <div className="relative z-10 flex items-center justify-between text-xs text-on-surface-variant border-t border-card-border/60 pt-6">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} className="text-primary" /> Verified Academic Content
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <Award size={14} className="text-primary" /> Free for Students
          </span>
        </div>
      </div>

      {/* ── RIGHT AUTHENTICATION PANEL ── */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-12 bg-white dark:bg-surface-container-lowest">
        {/* Mobile-only brand link */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-black text-sm">
              Q
            </div>
            <span className="font-bold text-lg text-on-surface">QuickLearnit</span>
          </Link>
          <Link to="/signup" className="text-xs font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          key="signin-form"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto my-auto py-6"
        >
          <div className="mb-6 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Sign in</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Welcome back. Enter your credentials to access your library.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* No Account Prompt */}
          {noAccountEmail && (
            <div className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs">
              <p className="font-semibold text-amber-700 dark:text-amber-300 mb-1">No account found for this email.</p>
              <p className="text-amber-800/80 dark:text-amber-400/80 mb-3">
                <span className="font-bold">{noAccountEmail}</span> is not registered yet.
              </p>
              <button
                type="button"
                onClick={() => navigate('/signup', { state: { prefillEmail: noAccountEmail } })}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-semibold transition-colors cursor-pointer"
              >
                Create a new account →
              </button>
            </div>
          )}

          {/* Social Sign-in Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-card-border bg-white hover:bg-slate-50 dark:bg-surface-container dark:hover:bg-surface-container-high px-4 py-2.5 text-sm font-medium text-slate-800 dark:text-on-surface transition-all cursor-pointer shadow-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            {showMobileInput ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  const phone = `+91${mobileNumber}`;
                  const { error: otpError } = await sendMobileOtp(phone);
                  if (otpError) {
                    setError(otpError);
                    return;
                  }
                  navigate('/verify-otp', { state: { target: phone, type: 'mobile' } });
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-indigo-200 dark:border-primary/30 bg-indigo-50/40 dark:bg-surface-container p-1.5 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
              >
                <div className="flex items-center pl-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="ml-2 text-on-surface-variant text-xs font-semibold border-r border-indigo-200 dark:border-card-border pr-2">+91</span>
                </div>
                <AnimatedInput
                  type="tel"
                  className="flex-1 bg-transparent px-2 py-1 text-sm text-on-surface outline-none w-full placeholder:text-on-surface-variant/50"
                  placeholder="98765 43210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  inputMode="numeric"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary hover:bg-primary-hover px-3 py-1.5 text-xs font-semibold text-on-primary transition-colors cursor-pointer"
                >
                  Verify
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowMobileInput(true)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-indigo-200/90 dark:border-primary/25 bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-primary/10 dark:hover:bg-primary/15 px-4 py-2.5 text-sm font-semibold text-indigo-700 dark:text-primary transition-all cursor-pointer shadow-xs"
              >
                <Smartphone className="h-4 w-4 text-indigo-600 dark:text-primary" />
                <span>Continue with Mobile</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-card-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-surface-container-lowest px-3 text-on-surface-variant font-semibold tracking-wider">
                or sign in with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-on-surface mb-1.5 text-left">
                Email address
              </label>
              <AnimatedInput
                type="email"
                id="email"
                icon={<Mail className="h-4 w-4 text-on-surface-variant" />}
                className="block w-full rounded-xl border border-slate-200 dark:border-card-border bg-slate-50 dark:bg-surface-container pl-10 pr-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setNoAccountEmail(null); }}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-on-surface text-left">
                  Password
                </label>
                <a href="#forgot" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <AnimatedInput
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  icon={<Lock className="h-4 w-4 text-on-surface-variant" />}
                  className="block w-full rounded-xl border border-slate-200 dark:border-card-border bg-slate-50 dark:bg-surface-container pl-10 pr-10 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-on-surface-variant hover:text-on-surface cursor-pointer z-30"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-xs text-on-surface-variant">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </motion.div>

        {/* Legal Footer */}
        <div className="text-center text-[11px] text-on-surface-variant">
          Protected by university-grade encryption. QuickLearnit Academic Platform.
        </div>
      </div>
    </div>
  );
}

export default SignInPage;

