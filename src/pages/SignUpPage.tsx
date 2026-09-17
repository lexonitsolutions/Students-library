import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui/Logo';

export function SignUpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signUp, signInWithGoogle, session } = useAuth();
  
  const googleUser = session?.user?.app_metadata?.provider === 'google' ? session.user : null;
  const googleName = (googleUser?.user_metadata?.full_name as string) || (googleUser?.user_metadata?.name as string) || '';
  const googleEmail = googleUser?.email || '';
  
  const [name, setName] = useState(googleName || '');
  const [email, setEmail] = useState(googleEmail || location.state?.prefillEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Password strength logic
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: '', color: 'bg-slate-200', text: '' };
    if (pass.length < 6) return { label: 'Weak', color: 'bg-red-400', text: 'text-red-500' };
    if (pass.length < 10 && !/\d/.test(pass)) return { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-500' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' };
  };
  const strength = getPasswordStrength(password);

  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => { navigate('/get-started', { replace: true }); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service');
      return;
    }
    setError(null);
    setIsSubmitting(true);

    const { error: signUpError } = await signUp({ email, password, name });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError);
    } else {
      navigate('/verify-otp', { state: { target: email, type: 'email' } });
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

  return (
    <div className="flex min-h-screen w-full relative overflow-hidden font-sans bg-gradient-to-br from-[#E8EEFC] via-[#F2F5FE] to-[#E2EAFD]">
      {/* Background soft ambient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-[#D6E2FD] blur-[120px] opacity-70 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] rounded-full bg-[#E5E9FC] blur-[100px] opacity-80 pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-white/40 blur-[80px] pointer-events-none" />

      {/* TOP HEADER */}
      <div className="absolute top-6 left-6 lg:top-10 lg:left-10 z-30">
        <Link to="/get-started">
          <Logo height={32} />
        </Link>
      </div>

      <div className="absolute top-8 right-8 lg:top-10 lg:right-10 z-30 hidden md:block">
        <span className="text-sm text-slate-500 font-medium">
          Already have an account? <Link to="/signin" className="text-primary font-bold hover:underline ml-1">Sign In &rarr;</Link>
        </span>
      </div>

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative z-20 w-full h-full flex flex-col lg:flex-row items-center justify-between max-w-[1500px] mx-auto min-h-screen px-6 pt-24 pb-12 lg:p-12 lg:pt-16 gap-8 lg:gap-4">
        
        {/* 1. LEFT CONTENT AREA (Marketing) */}
        <div className="w-full lg:w-[35%] xl:w-[40%] flex flex-col z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-white shadow-sm w-max mb-6 backdrop-blur-sm">
            <span className="text-[13px]">🎓</span>
            <span className="text-[11px] font-bold text-indigo-700 tracking-wide uppercase">Your Learning Partner</span>
          </div>

          <h1 className="text-5xl lg:text-6xl xl:text-[72px] font-extrabold text-slate-900 leading-[1.05] tracking-tight mb-4">
            Let's get <br />
            <span className="text-primary">started!</span>
          </h1>

          <p className="text-slate-600 text-base lg:text-lg mb-10 max-w-[360px] leading-relaxed">
            Create your Studexa account and start learning smarter.
          </p>

          <div className="space-y-6">
            <FeatureRow 
              icon="📄" 
              title="Access Study Materials" 
              subtitle="Notes, PDFs, past papers & more" 
              color="bg-blue-100/80 text-blue-600" 
            />
            <FeatureRow 
              icon="👥" 
              title="Connect & Collaborate" 
              subtitle="Message, share and grow together" 
              color="bg-indigo-100/80 text-indigo-600" 
            />
            <FeatureRow 
              icon="📈" 
              title="Track Your Progress" 
              subtitle="Stay consistent with your goals" 
              color="bg-emerald-100/80 text-emerald-600" 
            />
            <FeatureRow 
              icon="🛡️" 
              title="Safe & Student Focused" 
              subtitle="Your data, your control" 
              color="bg-slate-200/80 text-slate-700" 
            />
          </div>
        </div>

        {/* 2. CENTER 3D CHARACTER AREA */}
        <div className="hidden lg:flex flex-1 relative h-[650px] items-center justify-center -ml-4 z-10 pointer-events-none">
          <img 
            src="/images/signup-illustration.png" 
            alt="Studexa Student Illustration" 
            className="w-full max-w-[340px] h-auto object-contain rounded-2xl shadow-sm relative z-10" 
          />
        </div>

        {/* 3. RIGHT SIGN UP CARD */}
        <div className="w-full max-w-[420px] lg:w-[32%] xl:w-[30%] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 z-30">
          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-slate-900 mb-1 tracking-tight flex items-center gap-2">
              Create your account <span className="text-xl">✨</span>
            </h2>
            <p className="text-[13px] text-slate-500 font-medium">Join Studexa and make your learning journey simpler.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-3 text-[13px] font-bold text-slate-700 transition-all cursor-pointer mb-5 shadow-sm active:scale-[0.98]"
          >
            {isGoogleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-primary" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">or</span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 ml-1">Full name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 ml-1">Email address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 py-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5 ml-1">Confirm password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-4 pr-10 py-3 text-[13px] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 ml-1">
                <div className="flex gap-1 h-1 w-full max-w-[120px] mb-1">
                  <div className={`h-full flex-1 rounded-full ${password.length > 0 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${password.length >= 6 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-full flex-1 rounded-full ${password.length >= 10 && /\d/.test(password) ? strength.color : 'bg-slate-200'}`} />
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  Password strength: <span className={strength.text}>{strength.label}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 shrink-0 rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-500 cursor-pointer select-none">
                I agree to the <Link to="/terms" className="font-bold text-primary hover:underline">Terms of Service</Link> and <Link to="/privacy" className="font-bold text-primary hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover px-4 py-3.5 text-[14px] font-bold text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer mt-2 active:scale-[0.98]"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="mt-6 text-center lg:hidden">
            <span className="text-[12px] text-slate-500">
              Already have an account? <Link to="/signin" className="text-primary font-bold hover:underline">Sign In</Link>
            </span>
          </div>
        </div>

      </div>

      {/* BOTTOM FOOTER LABELS */}
      <div className="absolute bottom-6 left-10 text-[11px] text-slate-500 hidden md:flex items-center gap-1.5 font-bold tracking-wide">
        <CheckCircle2 size={13} className="text-primary" /> Verified Academic Content
      </div>
      <div className="absolute bottom-6 right-10 text-[11px] text-slate-500 hidden md:flex items-center gap-1.5 font-bold tracking-wide">
        <span className="text-[14px] text-primary">♙</span> Free for University Students
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, subtitle, color }: { icon: React.ReactNode, title: string, subtitle: string, color: string }) {
  return (
    <div className="flex items-center gap-3.5">
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shadow-sm border border-white/50 ${color}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[13px] font-bold text-slate-900">{title}</h4>
        <p className="text-[11px] text-slate-500 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}
