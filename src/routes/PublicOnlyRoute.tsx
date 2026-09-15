import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';
import { useEffect } from 'react';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, user, loading, session, signOut } = useAuth();
  const { workspace } = useWorkspace();
  const { getAndClearRedirectPath } = useSignupRedirect();
  const location = useLocation();

  if (loading || (session && !isExploring && !user)) {
    return <RouteLoader />;
  }

  // Allow user to stay on /signup to complete Google account registration
  const isCompletingGoogleSignup =
    location.pathname === '/signup' &&
    (new URLSearchParams(location.search).get('from_google') === 'true' ||
      session?.user?.app_metadata?.provider === 'google') &&
    !localStorage.getItem('quicklearnit_google_signup_completed');

  if (isCompletingGoogleSignup) {
    return <Outlet />;
  }

  const isVerifiedSignup = location.pathname === '/signin' && new URLSearchParams(location.search).get('verified') === 'true';

  useEffect(() => {
    if (isAuthenticated && !isExploring && isVerifiedSignup) {
      // The user clicked an email verification link and Supabase auto-logged them in.
      // But we want them to manually log in. So we sign them out immediately.
      signOut().catch(() => {});
      
      // Tell other open tabs (like the OTP/Signup page) that verification succeeded
      try {
        const channel = new BroadcastChannel('studexa_auth');
        channel.postMessage('verified_signup');
        channel.close();
      } catch (e) {
        // BroadcastChannel might not be supported in older browsers
      }

      // Remove verified=true from URL so it doesn't trigger again on reload
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      window.history.replaceState({}, '', url.toString());
    }
  }, [isAuthenticated, isExploring, isVerifiedSignup, signOut]);

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring && !isVerifiedSignup) {
    const redirectPath = getAndClearRedirectPath();
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
    const target = user?.role === 'admin' && workspace === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  // If in guest explore mode and hitting the landing page, go directly to dashboard
  if (isExploring && (location.pathname === '/get-started' || location.pathname === '/onboarding')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
