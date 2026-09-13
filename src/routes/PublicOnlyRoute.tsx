import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, user, loading, session } = useAuth();
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

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring) {
    const redirectPath = getAndClearRedirectPath();
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
    const target = user?.role === 'admin' && workspace === 'admin' ? '/admin' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
