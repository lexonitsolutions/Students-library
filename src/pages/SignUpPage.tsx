import { useState } from 'react';
import { Mail, Lock, Smartphone, ArrowRight, BookOpen, CheckCircle2, User as UserIcon, Eye, EyeOff, Award, Sparkles } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { AnimatedInput } from '../components/ui/AnimatedInput';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, sendMobileOtp } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.prefillEmail ?? '');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  return (
    <div className="flex min-h-screen bg-white text-on-surface">
      {/* ── LEFT SIDE: BRANDING SHOWCASE PANEL (Desktop only) ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 border-r border-slate-200/90 bg-gradient-to-br from-slate-100 via-[#EDF2F9] to-slate-100 relative overflow-hidden">
        {/* Subtle tinted grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(99,102,241,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.07)_1px,transparent_1px)] bg-[size:2.5rem_2.5rem] pointer-events-none" />
        <div className="absolute -top-28 -right-28 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

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

        {/* Center Showcase */}
        <motion.div
          key="signup-showcase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="relative z-10 max-w-md mx-auto my-auto py-12"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-6">
            <Sparkles size={13} />
            <span>Join 50,000+ Students</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-4 leading-tight">
            Share knowledge. Ace your semester together.
          </h1>
          <p className="text-on-surface-variant text-base leading-relaxed mb-8">
            Upload your handwritten lecture notes, past exams, and study guides. Earn recognition and help your university peers excel.
          </p>

          {/* Academic Showcase Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-on-surface">Digital Electronics & Circuits</h4>
                  <p className="text-xs text-on-surface-variant">EE204 • Solved Midterm • 28 Pages</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Top Rated
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Colleges</span>
                <span className="text-2xl font-bold text-on-surface">120+</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block">Documents</span>
                <span className="text-2xl font-bold text-on-surface">15,000+</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer Pill */}
        <div className="relative z-10 flex items-center justify-between text-xs text-on-surface-variant border-t border-card-border/60 pt-6">
          <span className="flex items-center gap-1.5 font-medium">
            <Award size={14} className="text-primary" /> 100% Free Account
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 size={14} className="text-primary" /> Verified Student Network
          </span>
        </div>
      </div>

      {/* ── RIGHT SIDE: SIGN UP INTERFACE ── */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-12 bg-white">
        {/* Mobile-only brand link */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-black text-sm">
              Q
            </div>
            <span className="font-bold text-lg text-on-surface">QuickLearnit</span>
          </Link>
          <Link to="/signin" className="text-xs font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          key="signup-form"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md mx-auto my-auto py-6"
        >
          <div className="mb-6 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Create an account</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Join thousands of students sharing and discovering study materials.</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Social Sign-Up Buttons */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 transition-all cursor-pointer shadow-xs"
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
              <span>Sign up with Google</span>
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
                  navigate('/verify-otp', { state: { target: phone, type: 'mobile', otpKind: 'sms' } });
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/40 p-1.5 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
              >
                <div className="flex items-center pl-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="ml-2 text-on-surface-variant text-xs font-semibold border-r border-indigo-200 pr-2">+91</span>
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
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 hover:bg-indigo-100/80 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition-all cursor-pointer shadow-xs"
              >
                <Smartphone className="h-4 w-4 text-indigo-600" />
                <span>Continue with Mobile</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-on-surface-variant font-semibold tracking-wider">
                or register with email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-on-surface mb-1.5 text-left">
                Full Name
              </label>
              <AnimatedInput
                type="text"
                id="name"
                icon={<UserIcon className="h-4 w-4 text-on-surface-variant" />}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-on-surface mb-1.5 text-left">
                Email Address
              </label>
              <AnimatedInput
                type="email"
                id="email"
                icon={<Mail className="h-4 w-4 text-on-surface-variant" />}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-on-surface mb-1.5 text-left">
                Password
              </label>
              <div className="relative">
                <AnimatedInput
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  icon={<Lock className="h-4 w-4 text-on-surface-variant" />}
                  className="block w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="At least 6 characters"
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
            <label className="flex items-start gap-2.5 pt-1 select-none cursor-pointer group">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked);
                  if (error && error.includes('Terms')) setError(null);
                }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer transition-colors"
                required
              />
              <span className="text-xs font-medium text-on-surface-variant leading-snug">
                I agree to the{' '}
                <span className="font-semibold text-primary hover:underline">Terms of Service</span>
                {' '}and{' '}
                <span className="font-semibold text-primary hover:underline">Privacy Policy</span>
              </span>
            </label>

            {/* Create Account Button */}
            <button
              type="submit"
              disabled={isSubmitting || !agreedToTerms}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover px-4 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer pt-2"
            >
              <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Footer link */}
          <p className="mt-6 text-center text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/signin" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>

        {/* Legal */}
        <div className="text-center text-[11px] text-on-surface-variant">
          By continuing, you agree to our Terms of Service and Honor Code.
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;
