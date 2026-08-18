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

  // Admin capability alone never grants entry to the admin workspace — it
  // only activates when explicitly chosen (the "Login as Admin" checkbox on
  // sign-in, or the sidebar switcher), and only ever for a real admin role.
  if (user?.role === 'admin' && workspace === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <DashboardPage />;
}

export default HomeGate;
