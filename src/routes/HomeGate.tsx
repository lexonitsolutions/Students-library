import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardPage } from '../pages/DashboardPage';

export function HomeGate() {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <DashboardPage />;
}

export default HomeGate;
