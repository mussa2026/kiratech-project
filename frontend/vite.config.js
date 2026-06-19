import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,          // no source maps in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom', 'react-router-dom'],
          stripe:  ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          zustand: ['zustand'],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
}));
