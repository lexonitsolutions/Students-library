import { motion } from 'framer-motion';
import { Smartphone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signInWithGoogle, sendMobileOtp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const { error: signInError } = await signIn({ email, password });
    setIsSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    navigate('/', { replace: true });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error: googleError } = await signInWithGoogle();
    if (googleError) setError(googleError);
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50 relative">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-white dark:bg-[#141720] border-r border-gray-100 dark:border-[#252a3d] relative overflow-hidden">
        <div className="flex items-center gap-2 z-10">
          <div className="font-bold text-xl tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold">L</span>
            <span className="dark:text-white text-gray-900">Lexon</span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
           {/* Abstract illustration placeholder based on design */}
           <div className="w-full max-w-md aspect-video bg-gray-50 dark:bg-[#1e2230] rounded-xl border border-gray-100 dark:border-[#2a2e3f] shadow-sm mb-12 flex items-center justify-center overflow-hidden">
              <div className="grid grid-cols-2 gap-4 p-8 w-full">
                 <div className="h-32 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg shadow-sm border border-indigo-200/50 dark:border-indigo-500/20"></div>
                 <div className="space-y-4">
                   <div className="h-16 bg-blue-100 dark:bg-blue-900/40 rounded-lg shadow-sm border border-blue-200/50 dark:border-blue-500/20"></div>
                   <div className="h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shadow-sm border border-emerald-200/50 dark:border-emerald-500/20"></div>
                 </div>
              </div>
           </div>

          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-serif text-slate-900 dark:text-white font-bold mb-4">
              Learn. Share. Grow.
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-300 max-w-md mx-auto">
              Your space for discovering and sharing knowledge.
            </p>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-blue-50/50 dark:bg-indigo-950/40 blur-3xl" />
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full max-w-[440px] bg-white p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100"
        >
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-slate-500">Sign in to continue your learning journey.</p>
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-error-container/20 px-3 py-2 text-sm font-medium text-error">{error}</p>
          )}

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50"
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
              Continue with Google
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
                  className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 transition-colors focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500"
                >
                <div className="flex items-center pl-2.5">
                  <Smartphone className="h-5 w-5 text-slate-400" />
                  <span className="ml-2 text-slate-500 text-sm font-medium border-r border-gray-200 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none w-full"
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
                <button
                  type="submit"
                  className="rounded-lg bg-[#1e1b4b] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#312e81]"
                >
                  Verify
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowMobileInput(true)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-gray-50"
              >
                <Smartphone className="h-5 w-5 text-slate-500" />
                Continue with Mobile Number
              </button>
            )}
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-medium tracking-wider">Or</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full rounded-xl border-gray-200 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 bg-gray-50/50 border"
                  placeholder="your@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <a href="#forgot" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="block w-full rounded-xl border-gray-200 pl-10 pr-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 bg-gray-50/50 border"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1e1b4b] px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#312e81] focus:outline-none focus:ring-2 focus:ring-[#312e81] focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'} <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default SignInPage;
