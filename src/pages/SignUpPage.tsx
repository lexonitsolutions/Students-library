import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Smartphone, ArrowRight, Sparkles, CheckCircle2, BookOpen, Award, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CursorGlowTracker } from '../components/ui/CursorGlowTracker';
import { BackgroundVideo } from '../components/ui/BackgroundVideo';
import { BackgroundTexture } from '../components/ui/BackgroundTexture';
import { AnimatedInput } from '../components/ui/AnimatedInput';
export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, sendMobileOtp } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    const { error: signUpError } = await signUp({
      email,
      password,
      name,
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignUp = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  return (
    <div className="flex min-h-screen bg-[#0b0d14] text-slate-100 relative overflow-hidden select-none">
      <BackgroundVideo />
      <CursorGlowTracker />
      {/* ── BACKGROUND GLOW ORBS ── */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-10 right-1/3 w-80 h-80 bg-blue-600/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ── LEFT SIDE: SIGN UP INTERFACE ── */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-1 flex-col items-center justify-between p-6 sm:p-10 relative z-10 min-h-screen"
      >
        {/* Brand Header (ANCHORED TOP-LEFT) */}
        <div className="w-full flex items-center justify-start gap-3">
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

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[440px] bg-[#121522]/90 backdrop-blur-2xl p-7 sm:p-9 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] my-auto"
        >
          {/* Header */}
          <div className="mb-6 text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Create an account</h2>
            <p className="mt-1.5 text-sm text-slate-400 font-medium">Sign up to join our learning community.</p>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-xs font-semibold text-red-400"
            >
              {error}
            </motion.div>
          )}

          {/* Social Sign-Up Buttons */}
          <div className="space-y-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.015, translateY: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignUp}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg cursor-pointer"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
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
              Sign up with Google
            </motion.button>

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
                className="flex w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30"
              >
                <div className="flex items-center pl-2.5">
                  <Smartphone className="h-5 w-5 text-indigo-400" />
                  <span className="ml-2 text-slate-400 text-xs font-semibold border-r border-white/10 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  className="flex-1 bg-transparent px-2 py-1.5 text-sm text-white outline-none w-full placeholder:text-slate-500"
                  placeholder="98765 43210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  inputMode="numeric"
                  title="Please enter a valid 10-digit Indian mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-indigo-500/25 cursor-pointer"
                >
                  Verify
                </motion.button>
              </form>
            ) : (
              <motion.button
                type="button"
                whileHover={{ scale: 1.015, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowMobileInput(true)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-lg cursor-pointer"
              >
                <Smartphone className="h-5 w-5 text-indigo-400" />
                Continue with Mobile Number
              </motion.button>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#121522] px-3 text-slate-500 font-bold tracking-widest">OR</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 text-left">
                User Name
              </label>
              <AnimatedInput
                type="text"
                id="name"
                icon={<UserIcon className="h-4 w-4" />}
                className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 text-left">
                Email Address
              </label>
              <AnimatedInput
                type="email"
                id="email"
                icon={<Mail className="h-4 w-4" />}
                className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
                placeholder="your@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 text-left">
                Password
              </label>
              <div className="relative">
                <AnimatedInput
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  icon={<Lock className="h-4 w-4" />}
                  className="block w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-10 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300 cursor-pointer z-30"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* ANIMATED CREATE ACCOUNT BUTTON */}
            <motion.div className="relative group pt-2" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
              <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 blur group-hover:opacity-100 transition duration-300 group-hover:duration-200" />
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] px-5 py-3 text-sm font-bold text-white shadow-xl hover:bg-[position:right_center] transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1.5 transition-transform duration-200" />
              </button>
            </motion.div>
          </form>

          {/* Footer link */}
          <p className="mt-5 text-center text-xs text-slate-400 font-medium">
            Already have an account?{' '}
            <Link to="/signin" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>

      {/* ── RIGHT SIDE: BRANDING SHOWCASE PANEL ── */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative z-10 border-l border-slate-200 bg-slate-50 text-slate-900 overflow-hidden"
      >
        <BackgroundTexture isLight={true} />

        {/* Center Showcase */}
        <div className="flex-1 flex flex-col items-center justify-center py-8 relative z-10">
          {/* Animated Hero Cards */}
          <div className="w-full max-w-md relative mb-10">
            {/* Top Floating Badge */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-6 -left-4 z-20 flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-semibold"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>Join 50,000+ Students</span>
            </motion.div>

            {/* Bottom Floating Badge */}
            <motion.div
              animate={{ y: [6, -6, 6] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -bottom-4 -right-4 z-20 flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-1.5 rounded-full shadow-lg text-xs font-semibold"
            >
              <CheckCircle2 size={14} className="text-emerald-200" />
              <span>Free Forever for Learners</span>
            </motion.div>

            {/* Showcase Main Container */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900">Create & Share Knowledge</h4>
                  <p className="text-xs font-medium text-slate-500">Upload exam papers, notes & solutions</p>
                </div>
                <span className="ml-auto text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100/80 p-3.5 flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Universities</span>
                  <span className="text-2xl font-black text-slate-900">100+</span>
                </div>
                <div className="rounded-2xl bg-purple-50/60 border border-purple-100/80 p-3.5 flex flex-col gap-0.5">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Study Notes</span>
                  <span className="text-2xl font-black text-slate-900">15k+</span>
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="text-center max-w-md">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight !text-slate-900 text-slate-900 mb-3 leading-tight">
              Learn. <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">Share.</span> Grow.
            </h1>
            <p className="text-base !text-slate-600 text-slate-600 font-medium leading-relaxed">
              Your space for discovering, uploading, and collaborating on academic resources.
            </p>
          </div>
        </div>

        {/* Footer Pill */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 border-t border-slate-200/60 pt-6 relative z-10">
          <span className="flex items-center gap-1.5"><Award size={14} className="text-indigo-600" /> Free Account</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>Peer to Peer</span>
          <span className="h-1 w-1 rounded-full bg-slate-300" />
          <span>Fast Sharing</span>
        </div>
      </motion.div>
    </div>
  );
}

export default SignUpPage;
