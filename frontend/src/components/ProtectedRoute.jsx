import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  const isAdminRoute      = location.pathname.startsWith('/admin');
  const isTechnicianRoute = location.pathname.startsWith('/technician');

  if (!isAuthenticated || !user) {
    if (isAdminRoute)      return <Navigate to="/admin/login"      replace />;
    if (isTechnicianRoute) return <Navigate to="/technician/login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleRedirects = { admin: '/admin', technician: '/technician', customer: '/dashboard' };
    return <Navigate to={roleRedirects[user.role] || '/'} replace />;
  }

  return <Outlet />;
}
