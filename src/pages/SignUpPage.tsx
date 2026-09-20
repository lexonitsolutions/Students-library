import { useState, useEffect } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  User as UserIcon,
  Eye,
  EyeOff,
  Award,
  Sparkles,
  Users,
  ArrowLeft,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AnimatedInput } from '../components/ui/AnimatedInput';
import { Logo } from '../components/ui/Logo';
import { supabase } from '../lib/supabaseClient';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, session, updateUser, signOut } = useAuth();
  
  const googleUser = session?.user?.app_metadata?.provider === 'google' ? session.user : null;
  const googleName = (googleUser?.user_metadata?.full_name as string) || (googleUser?.user_metadata?.name as string) || '';
  const googleEmail = googleUser?.email || '';
  const googleAvatar = (googleUser?.user_metadata?.avatar_url as string) || (googleUser?.user_metadata?.picture as string) || '';

  const [name, setName] = useState(googleName || '');
  const [email, setEmail] = useState(googleEmail || location.state?.prefillEmail || '');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (googleUser) {
      if (googleName) setName(googleName);
      if (googleEmail) setEmail(googleEmail);
    }
  }, [googleUser, googleName, googleEmail]);

  useEffect(() => {
    // Intercept back button to strictly go to /get-started
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      navigate('/get-started', { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailTrimmed = email.trim();
    const nameTrimmed = name.trim();

    if (!nameTrimmed) {
      setError('Please enter your name');
      return;
    }

    if (!emailTrimmed) {
      setError('Please enter your email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!agreedToTerms) {
      setError('Please accept the Terms and Conditions to create your account');
      return;
    }

    if (googleUser) {
      setIsSubmitting(true);
      try {
        const { error: passwordError } = await supabase.auth.updateUser({ password });
        if (passwordError) {
          throw new Error(passwordError.message || 'Failed to set password. Please try again.');
        }
        await updateUser({
          name: nameTrimmed,
          ...(googleAvatar ? { avatar: googleAvatar } : {}),
        });
        localStorage.setItem('quicklearnit_google_signup_completed', 'true');
        localStorage.setItem('quicklearnit_has_onboarded', 'true');
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete registration');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await signUp({
      email: emailTrimmed,
      password,
      name: nameTrimmed,
    });
    setIsSubmitting(false);

    if (signUpError) {
      if (signUpError.toLowerCase().includes('pending')) {
        navigate('/verify-otp', {
          state: {
            target: emailTrimmed,
            type: 'email',
          },
        });
      } else {
        setError(signUpError);
      }
    } else {
      navigate('/verify-otp', {
        state: {
          target: emailTrimmed,
          type: 'email',
        },
      });
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      setIsGoogleLoading(true);
      setError(null);
      const redirectUrl = `${window.location.origin}/signup?from_google=true`;
      const { error: googleError } = await signInWithGoogle(redirectUrl);
      if (googleError) {
        setError(googleError);
        setIsGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-up failed');
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await signOut();
    setName('');
    setEmail('');
    setPassword('');
    localStorage.removeItem('quicklearnit_google_signup_completed');
    navigate('/signup', { replace: true });
  };

  return (
    <div className="relative h-screen w-full bg-[#FFFDF9] text-on-surface overflow-hidden flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* ── ARCHITECTURAL GRID BACKGROUND ── */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(215,200,180,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(215,200,180,0.18)_1px,transparent_1px)] bg-[size:3.2rem_3.2rem] pointer-events-none" />

      {/* ── AMBIENT WARM & COOL GLOWS ── */}
      <div className="absolute -top-28 -right-28 h-[500px] w-[500px] rounded-full bg-emerald-500/8 blur-[130px] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 h-[450px] w-[450px] rounded-full bg-amber-400/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-28 -left-28 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[130px] pointer-events-none" />

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
              Share knowledge. <span className="text-primary">Ace your semester</span> together.
            </h1>

            {/* Subtitle */}
            <p className="text-on-surface-variant text-sm leading-relaxed mb-4 max-w-xl">
              Upload handwritten lecture notes, past exams, and study guides. Earn recognition and help university peers excel.
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
            
            {/* 3D Student Girl — left of card, neatly flanking */}
            <div className="hidden xl:block absolute -left-40 2xl:-left-42 bottom-0 z-40 pointer-events-none select-none">
              <img
                src="/images/answersbro-signup-girl.png"
                alt="Student girl with notebook"
                className="h-[360px] 2xl:h-[400px] w-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* 3D Student Boy — right of card, neatly flanking */}
            <div className="hidden xl:block absolute -right-34 2xl:-right-36 bottom-0 z-40 pointer-events-none select-none">
              <img
                src="/images/answersbro-signup-boy.png"
                alt="Student boy with tablet"
                className="h-[360px] 2xl:h-[400px] w-auto object-contain drop-shadow-2xl"
              />
            </div>

            {/* Decorative Floating 3D Study Element */}
            <div className="hidden xl:flex absolute -top-8 -left-8 h-10 w-10 items-center justify-center rounded-2xl bg-white/90 shadow-md border border-amber-200/50 text-amber-500 z-10">
              <BookOpen size={18} />
            </div>

            {/* The Central Authentication Card */}
            <motion.div
              key="signup-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-20 w-full max-w-[400px] rounded-[28px] border border-slate-200/85 bg-white p-5 sm:p-6 shadow-2xl shadow-slate-200/60"
            >

              {/* Segmented Tab Switcher */}
              <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl mb-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => navigate('/signin')}
                  className="py-1.5 rounded-xl text-on-surface-variant hover:text-on-surface transition-all font-medium cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="py-1.5 rounded-xl bg-white text-on-surface shadow-xs font-bold transition-all"
                >
                  Create Account
                </button>
              </div>

              <div className="mb-3 text-left">
                <h2 className="text-xl font-bold tracking-tight text-on-surface">Create an account</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">Join thousands of students sharing and discovering study materials.</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-3.5 rounded-xl bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              {/* Social Sign-Up or Connected Google Account */}
              <div className="space-y-2">
                {googleUser ? (
                  <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-3 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {googleAvatar ? (
                        <img
                          src={googleAvatar}
                          alt={googleName || 'Google Account'}
                          className="h-9 w-9 rounded-xl object-cover border border-primary/30 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {(googleName || googleEmail || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-on-surface truncate">
                            {googleName || 'Google Account'}
                          </span>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        </div>
                        <p className="text-[10px] text-on-surface-variant truncate">{googleEmail}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnectGoogle}
                      className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline ml-2 shrink-0 cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={isGoogleLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <span>{isGoogleLoading ? 'Connecting...' : 'Sign up with Google'}</span>
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-on-surface-variant font-semibold tracking-wider text-[10px]">
                    {googleUser ? 'Complete your details' : 'or register with email'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-on-surface mb-1 text-left">
                    Full Name
                  </label>
                  <AnimatedInput
                    type="text"
                    id="name"
                    icon={<UserIcon className="h-4 w-4 text-on-surface-variant" />}
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="email" className="block text-xs font-semibold text-on-surface text-left">
                      Email Address
                    </label>
                    {googleUser && (
                      <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified by Google
                      </span>
                    )}
                  </div>
                  <AnimatedInput
                    type="email"
                    id="email"
                    readOnly={Boolean(googleUser)}
                    icon={<Mail className="h-4 w-4 text-on-surface-variant" />}
                    className={`block w-full rounded-xl border border-slate-200 ${googleUser ? 'bg-slate-100 cursor-not-allowed opacity-90' : 'bg-slate-50/80 focus:bg-white'} pl-10 pr-3.5 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all`}
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="password" className="block text-xs font-semibold text-on-surface text-left">
                      set Password <span className="text-red-500">*</span>
                      {googleUser && (
                        <span className="text-on-surface-variant font-normal ml-1 text-[10px]">
                          (Set password to secure account)
                        </span>
                      )}
                    </label>
                  </div>
                  <div className="relative">
                    <AnimatedInput
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      icon={<Lock className="h-4 w-4 text-on-surface-variant" />}
                      className="block w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-10 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Create password (min 6 characters)"
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

                {/* Terms & Conditions Checkbox */}
                <label className="flex items-start gap-2 pt-0.5 select-none cursor-pointer group text-left">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (error && error.includes('Terms')) setError(null);
                    }}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-colors"
                    required
                  />
                  <span className="text-[11px] font-medium text-on-surface-variant leading-snug">
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary hover:underline"
                    >
                      Terms
                    </Link>
                    {' '}and{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-primary hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </span>
                </label>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99] mt-1"
                >
                  <span>{isSubmitting ? 'Creating account...' : googleUser ? 'Complete Registration' : 'Create Free Account'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              {/* Footer link */}
              <p className="mt-3 text-center text-xs text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/signin" className="font-semibold text-primary hover:underline">
                  Sign in
                </Link>
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

export default SignUpPage;
