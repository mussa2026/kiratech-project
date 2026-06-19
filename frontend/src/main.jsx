import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, useToasterStore } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import { useThemeStore } from './store/themeStore.js';

// Apply saved theme before first render — prevents flash of wrong theme
useThemeStore.getState().init();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToasterWithTheme />
    </BrowserRouter>
  </React.StrictMode>
);

// Toaster that adapts its background to the current theme
function ToasterWithTheme() {
  const { isDark } = useThemeStore();
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: isDark
          ? { background: '#1e293b', color: '#f1f5f9', borderRadius: '8px', border: '1px solid #334155' }
          : { background: '#1e293b', color: '#f1f5f9', borderRadius: '8px' },
        success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
      }}
    />
  );
}
