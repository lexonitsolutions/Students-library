import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <RouteLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
