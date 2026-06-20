import axios from 'axios';

// In production (Render), VITE_API_URL must be set to the backend Render URL.
// In development, the Vite proxy forwards /api → localhost:5000.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

if (import.meta.env.DEV) {
  console.log('[api] baseURL:', baseURL);
}

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor — attach token if present
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('kiratech-auth');
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) {
      // ignore parse errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
