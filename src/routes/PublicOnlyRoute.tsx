import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';

export function PublicOnlyRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  const { workspace } = useWorkspace();

  if (isAuthenticated && loading) {
    return <RouteLoader />;
  }

  if (isAuthenticated) {
    const target = user?.role === 'admin' && workspace === 'admin' ? '/admin' : '/';
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
