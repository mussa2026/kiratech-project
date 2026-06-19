import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
          return { success: true, user: data.user };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Login failed' };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          set({ isLoading: false });
          return { success: true, message: data.message };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, error: err.response?.data?.error || 'Registration failed' };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (updatedUser) => {
        set({ user: { ...get().user, ...updatedUser } });
      },

      initializeAuth: () => {
        const { token } = get();
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      },
    }),
    {
      name: 'kiratech-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
