import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import KiratechLogo from './KiratechLogo';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { name: 'Home',     href: '/' },
  { name: 'About',    href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Contact',  href: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const { isAuthenticated, user }   = useAuthStore();
  const location = useLocation();

  const dashboardHref =
    user?.role === 'admin' ? '/admin' :
    user?.role === 'technician' ? '/technician' : '/dashboard';

  // Add blur/shadow when scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-glass border-b border-blue-100/60 dark:border-slate-700/50'
        : 'bg-white dark:bg-slate-900 border-b border-blue-50 dark:border-slate-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <KiratechLogo size={30} />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/60 dark:hover:bg-blue-900/20'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right — toggle + auth */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to={dashboardHref} className="btn-primary text-sm px-5 py-2">
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm px-4 py-2">Login</Link>
                <Link to="/register" className="btn-primary text-sm px-5 py-2">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 rounded-xl text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                        border-t border-blue-50 dark:border-slate-700 px-4 py-4 space-y-1
                        animate-fade-in-down">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => setMobileOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-blue-50 dark:border-slate-700 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link to={dashboardHref} className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary text-sm" onClick={() => setMobileOpen(false)}>Get Started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
