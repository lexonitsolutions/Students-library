import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute() {
  const { isAuthenticated, hasOnboarded } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={hasOnboarded ? '/login' : '/onboarding'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
