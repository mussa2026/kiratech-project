import axios from 'axios';

// In production (Render), VITE_API_URL is set to the backend Render URL.
// In development, the Vite proxy forwards /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — redirect to correct login page on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('kiratech-auth');
      delete api.defaults.headers.common['Authorization'];
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        window.location.href = '/admin/login';
      } else if (path.startsWith('/technician') && path !== '/technician/login') {
        window.location.href = '/technician/login';
      } else if (!['/login', '/register'].includes(path)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
