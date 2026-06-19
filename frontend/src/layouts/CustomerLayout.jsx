import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon, WrenchScrewdriverIcon, ClipboardDocumentListIcon,
  BellIcon, UserCircleIcon, ArrowRightOnRectangleIcon, Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import KiratechLogo from '../components/KiratechLogo';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

const navItems = [
  { name: 'Dashboard',       href: '/dashboard',                icon: HomeIcon },
  { name: 'Request Service', href: '/dashboard/request-service', icon: WrenchScrewdriverIcon },
  { name: 'My Requests',     href: '/dashboard/my-requests',    icon: ClipboardDocumentListIcon },
  { name: 'Notifications',   href: '/dashboard/notifications',  icon: BellIcon },
  { name: 'Profile',         href: '/dashboard/profile',        icon: UserCircleIcon },
];

export default function CustomerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <KiratechLogo size={28} />
        <ThemeToggle />
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.subscriptionType} plan</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/60 dark:hover:text-gray-100'
              }`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700/60">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 z-50 shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <KiratechLogo size={24} />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
