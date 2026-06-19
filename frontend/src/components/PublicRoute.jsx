import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PublicRoute() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const roleRedirects = { admin: '/admin', technician: '/technician', customer: '/dashboard' };
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  return <Outlet />;
}
