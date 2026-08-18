import { Navigate, Outlet } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';

export function AdminRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoader />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
