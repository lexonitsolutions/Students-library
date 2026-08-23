import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { useSignupRedirect } from '../hooks/useSignupRedirect';

export function PublicOnlyRoute() {
  const { isAuthenticated, isExploring, user, loading } = useAuth();
  const { workspace } = useWorkspace();
  const { getAndClearRedirectPath } = useSignupRedirect();

  if (isAuthenticated && loading) {
    return <RouteLoader />;
  }

  // Only redirect away fully authenticated non-guest users
  if (isAuthenticated && !isExploring) {
    const redirectPath = getAndClearRedirectPath();
    if (redirectPath) {
      return <Navigate to={redirectPath} replace />;
    }
    const target = user?.role === 'admin' && workspace === 'admin' ? '/admin' : '/';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
