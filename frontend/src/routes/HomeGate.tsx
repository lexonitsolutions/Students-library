import { Navigate } from 'react-router-dom';
import { RouteLoader } from '../components/ui/RouteLoader';
import { useAuth } from '../hooks/useAuth';
import { useWorkspace } from '../hooks/useWorkspace';
import { DashboardPage } from '../pages/DashboardPage';

export function HomeGate() {
  const { user, loading } = useAuth();
  const { workspace } = useWorkspace();

  if (loading) {
    return <RouteLoader />;
  }

  if (typeof window !== 'undefined' && sessionStorage.getItem('oauth_signup_pending')) {
    const provider = sessionStorage.getItem('oauth_signup_pending') || 'google';
    return <Navigate to={`/signup?oauth_return=${provider}`} replace />;
  }

  // Admins default to the admin workspace unless they explicitly switched
  // to student view via the workspace switcher (workspace === 'student').
  if (user?.role === 'admin' && workspace !== 'student') {
    return <Navigate to="/admin" replace />;
  }

  return <DashboardPage />;
}

export default HomeGate;
