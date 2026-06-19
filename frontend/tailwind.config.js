/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        cyber: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        glass: {
          white: 'rgba(255,255,255,0.08)',
          blue:  'rgba(37,99,235,0.15)',
          dark:  'rgba(15,23,42,0.6)',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'cyber-grid':
          'linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.03) 100%)',
        'hero-gradient':
          'linear-gradient(135deg, #0f172a 0%, #0c2340 40%, #0f3460 70%, #1a1a2e 100%)',
        'section-gradient':
          'linear-gradient(180deg, #f8faff 0%, #eef4ff 100%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
        'grid-60': '60px 60px',
      },
      boxShadow: {
        'glass':     '0 4px 32px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.15)',
        'glass-lg':  '0 8px 48px rgba(37,99,235,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
        'cyber':     '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.1)',
        'cyber-sm':  '0 0 10px rgba(59,130,246,0.25)',
        'neon-blue': '0 0 6px #3b82f6, 0 0 20px #3b82f640',
      },
      keyframes: {
        'fade-in':       { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'fade-in-up':    { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in-down':  { '0%': { opacity: '0', transform: 'translateY(-14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-left': { '0%': { opacity: '0', transform: 'translateX(-24px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'scale-in':      { '0%': { opacity: '0', transform: 'scale(0.94)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        'float':         { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-slow':    { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
        'spin-slow':     { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
        'shimmer':       { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'glow-pulse':    { '0%,100%': { boxShadow: '0 0 8px rgba(59,130,246,0.4)' }, '50%': { boxShadow: '0 0 24px rgba(59,130,246,0.8), 0 0 48px rgba(59,130,246,0.3)' } },
        'border-flow':   { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
        'scan-line':     { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      },
      animation: {
        'fade-in':        'fade-in 0.4s ease-out both',
        'fade-in-up':     'fade-in-up 0.5s ease-out both',
        'fade-in-down':   'fade-in-down 0.35s ease-out both',
        'slide-in-left':  'slide-in-left 0.4s ease-out both',
        'scale-in':       'scale-in 0.3s ease-out both',
        'float':          'float 4s ease-in-out infinite',
        'pulse-slow':     'pulse-slow 2.5s ease-in-out infinite',
        'spin-slow':      'spin-slow 10s linear infinite',
        'shimmer':        'shimmer 2s linear infinite',
        'glow-pulse':     'glow-pulse 2s ease-in-out infinite',
        'border-flow':    'border-flow 3s ease infinite',
        'scan-line':      'scan-line 4s linear infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
