import { useThemeStore } from '../store/themeStore';

/**
 * Sun/Moon toggle button.
 * variant: 'light' = for light backgrounds (navbar, sidebar)
 *          'dark'  = for dark backgrounds (admin login page)
 */
export default function ThemeToggle({ variant = 'light', className = '' }) {
  const { isDark, toggle } = useThemeStore();

  const base =
    'relative inline-flex items-center justify-center w-9 h-9 rounded-lg ' +
    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ' +
    'active:scale-90 select-none ';

  const colors =
    variant === 'dark'
      ? 'text-gray-400 hover:text-white hover:bg-white/10 focus:ring-offset-gray-900'
      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900';

  return (
    <button
      onClick={toggle}
      className={base + colors + ' ' + className}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {/* Sun icon — shown in dark mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
      </svg>

      {/* Moon icon — shown in light mode */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`absolute h-5 w-5 transition-all duration-300 ${
          isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        }`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </button>
  );
}
