import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public Pages
import Home from './pages/public/Home';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminLogin from './pages/auth/AdminLogin';
import TechnicianLogin from './pages/auth/TechnicianLogin';

// Customer Dashboard
import CustomerLayout from './layouts/CustomerLayout';
import CustomerDashboard from './pages/customer/Dashboard';
import RequestService from './pages/customer/RequestService';
import MyRequests from './pages/customer/MyRequests';
import RequestDetail from './pages/customer/RequestDetail';
import CustomerNotifications from './pages/customer/Notifications';
import CustomerProfile from './pages/customer/Profile';

// Technician Dashboard
import TechnicianLayout from './layouts/TechnicianLayout';
import TechnicianDashboard from './pages/technician/Dashboard';
import TechnicianTasks from './pages/technician/Tasks';
import TaskDetail from './pages/technician/TaskDetail';
import TechnicianProfile from './pages/technician/Profile';

// Admin Dashboard
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminTechnicians from './pages/admin/Technicians';
import AdminRequests from './pages/admin/Requests';
import AdminRequestDetail from './pages/admin/RequestDetail';
import AdminServices from './pages/admin/Services';
import AdminReports from './pages/admin/Reports';
import AdminPayments from './pages/admin/Payments';
import AdminPaymentSetup from './pages/admin/PaymentSetup';

// Guards
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Guard: already-logged-in admins skip back to /admin
function AdminLoginGuard() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  return <AdminLogin />;
}

// Guard: already-logged-in technicians skip back to /technician
function TechnicianLoginGuard() {
  const { isAuthenticated, user } = useAuthStore();
  if (isAuthenticated && user?.role === 'technician') {
    return <Navigate to="/technician" replace />;
  }
  return <TechnicianLogin />;
}

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Auth (redirect if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Admin login — separate portal, redirects to /admin if already authenticated as admin */}
      <Route path="/admin/login" element={<AdminLoginGuard />} />

      {/* Technician login — separate portal, redirects to /technician if already authenticated */}
      <Route path="/technician/login" element={<TechnicianLoginGuard />} />

      {/* Customer Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
        <Route path="/dashboard" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="request-service" element={<RequestService />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="my-requests/:id" element={<RequestDetail />} />
          <Route path="notifications" element={<CustomerNotifications />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>
      </Route>

      {/* Technician Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['technician']} />}>
        <Route path="/technician" element={<TechnicianLayout />}>
          <Route index element={<TechnicianDashboard />} />
          <Route path="tasks" element={<TechnicianTasks />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="profile" element={<TechnicianProfile />} />
        </Route>
      </Route>

      {/* Admin Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="technicians" element={<AdminTechnicians />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="requests/:id" element={<AdminRequestDetail />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="payment-setup" element={<AdminPaymentSetup />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
