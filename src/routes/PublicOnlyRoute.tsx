import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useSignupRedirect } from '../hooks/useSignupRedirect';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, loading } = useAuth();
  const { getAndClearRedirectPath } = useSignupRedirect();

  if (loading) {
    return <RouteLoader />;
  }

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring) {
    const redirectPath = getAndClearRedirectPath();
    return <Navigate to={redirectPath || '/dashboard'} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
