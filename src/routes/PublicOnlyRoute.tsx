import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, loading } = useAuth();
  const { getAndClearRedirectPath } = useSignupRedirect();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring) {
    const redirectPath = getAndClearRedirectPath();
    return <Navigate to={redirectPath || '/dashboard'} replace />;
  }

  // If in guest explore mode and hitting the landing page, go directly to dashboard
  const isLandingPath = location.pathname === '/' || location.pathname === '/get-started' || location.pathname === '/onboarding';
  if (isExploring && isLandingPath) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
