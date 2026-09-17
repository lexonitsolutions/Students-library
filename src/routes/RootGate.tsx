import { Navigate } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { GetStartedPage } from '../pages/GetStartedPage';

export function RootGate() {
  const { isAuthenticated, isExploring, loading, user } = useAuth();
  const { workspace } = useWorkspace();

  if (loading) {
    return <RouteLoader />;
  }

  // 1. Authenticated users go directly to their workspace dashboard
  if (isAuthenticated && !isExploring) {
    if (user?.role === 'admin' && workspace === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 2. Guest exploring users go to dashboard
  if (isExploring) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Returning users who already created an account:
  // Direct them to sign in so they can immediately log in to the dashboard
  const hasAccount = localStorage.getItem('quicklearnit.has_account') === 'true';

  if (hasAccount) {
    return <Navigate to="/signin" replace />;
  }

  // 4. First-time / new users see the GetStartedPage
  return <GetStartedPage />;
}

export default RootGate;
