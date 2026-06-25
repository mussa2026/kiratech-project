import axios from 'axios';

// ── Determine API base URL ────────────────────────────────────────────────────
// Priority:
//   1. VITE_API_URL env var (set in Render → Environment)
//   2. Auto-detect: if running on kiratech-frontend.onrender.com,
//      try kiratech-backend.onrender.com (common naming pattern)
//   3. Dev fallback: Vite proxy /api → localhost:5000

function getBaseURL() {
  // 1. Explicit env var (always preferred — set in Render → Environment)
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }

  // 2. Auto-detect from hostname (production on Render)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('onrender.com')) {
      // Hardcoded backend URL for this deployment
      return 'https://kiratech-backend-pic6.onrender.com/api';
    }
  }

  // 3. Dev: Vite proxy handles /api → localhost:5000
  return '/api';
}

const baseURL = getBaseURL();

if (import.meta.env.DEV) {
  console.log('[api] baseURL:', baseURL);
}

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

// Request interceptor — attach JWT token if present
api.interceptors.request.use(
  (config) => {
    try {
      const stored = localStorage.getItem('kiratech-auth');
      if (stored) {
        const { token } = JSON.parse(stored);
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (_) { /* ignore */ }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 → redirect to correct login page
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
