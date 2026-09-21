import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, user, loading } = useAuth();
  const { workspace } = useWorkspace();
  const { getAndClearRedirectPath } = useSignupRedirect();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring) {
    // If user is on /signup with a pending OAuth registration (needs to create password), do not redirect yet
    const isPendingOAuthSignUp =
      location.pathname === '/signup' &&
      (Boolean(sessionStorage.getItem('oauth_signup_pending')) || location.search.includes('oauth_return'));

    if (isPendingOAuthSignUp) {
      return <Outlet />;
    }

    const redirectPath = getAndClearRedirectPath();
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
    const target = user?.role === 'admin' && workspace !== 'student' ? '/admin' : '/dashboard';
    return <Navigate to={target} replace />;
  }

  // If in guest explore mode and hitting the landing page, go directly to dashboard
  if (isExploring && (location.pathname === '/get-started' || location.pathname === '/onboarding')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
