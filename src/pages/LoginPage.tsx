import { motion } from 'framer-motion';
import { Landmark, School } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../hooks/useAuth';

type Mode = 'Sign In' | 'Create Account';

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('Sign In');
  const [email, setEmail] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const asAdmin = email.toLowerCase().includes('admin');
    login(asAdmin);
    navigate(asAdmin ? '/admin' : '/', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Branding panel — desktop only */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-12 text-on-primary lg:flex">
        <div className="flex items-center gap-2">
          <School size={24} />
          <span className="text-headline-md">Lexon</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-headline-xl">Advancing Academic Excellence</h1>
          <p className="mt-4 text-body-lg text-on-primary/80">
            Access premier study materials, collaborate with peers, and elevate your educational journey in a
            focused environment.
          </p>
        </div>
        <div aria-hidden className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5" />
        <div aria-hidden className="absolute -top-16 -left-10 h-48 w-48 rounded-full bg-white/5" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-on-primary">
              <School size={20} />
            </div>
            <span className="text-headline-md text-on-surface">Lexon</span>
          </div>

          <div className="hidden lg:block">
            <Tabs tabs={['Sign In', 'Create Account']} active={mode} onChange={(tab) => setMode(tab as Mode)} />
          </div>

          <div className="mt-1 lg:hidden">
            <h1 className="text-headline-lg-mobile text-on-surface">Welcome back</h1>
            <p className="mt-1 text-body-sm text-on-surface-variant">Please enter your details to sign in.</p>
          </div>

          <button
            type="button"
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-card-border bg-white text-label-md text-on-surface transition-colors duration-150 hover:bg-surface-soft cursor-pointer"
          >
            <Landmark size={18} />
            Sign in with University SSO
          </button>

          <div className="my-6 flex items-center gap-3 text-label-sm text-outline">
            <span className="h-px flex-1 bg-card-border" />
            Or {mode === 'Sign In' ? 'sign in' : 'sign up'} with email
            <span className="h-px flex-1 bg-card-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'Create Account' && (
              <Input label="Full Name" name="name" placeholder="Jane Student" required autoComplete="name" />
            )}
            <Input
              label="University Email"
              name="email"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-label-md text-on-surface-variant">
                  Password
                </label>
                {mode === 'Sign In' && (
                  <a href="#forgot-password" className="text-label-sm font-semibold text-primary">
                    Forgot password?
                  </a>
                )}
              </div>
              <Input id="password" name="password" type="password" placeholder="********" required className="mt-1.5" autoComplete="current-password" />
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth className="mt-2">
              {mode === 'Sign In' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-body-sm text-on-surface-variant lg:hidden">
            {mode === 'Sign In' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => setMode(mode === 'Sign In' ? 'Create Account' : 'Sign In')}
              className="font-semibold text-primary cursor-pointer"
            >
              {mode === 'Sign In' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {mode === 'Create Account' && (
            <p className="mt-6 hidden text-center text-label-sm text-outline lg:block">
              By creating an account, you agree to our{' '}
              <a href="#terms" className="text-primary">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#privacy" className="text-primary">
                Privacy Policy
              </a>
              .
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default LoginPage;
