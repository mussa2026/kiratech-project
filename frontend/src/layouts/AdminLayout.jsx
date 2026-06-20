import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeIcon, UsersIcon, WrenchScrewdriverIcon, ClipboardDocumentListIcon,
  ChartBarIcon, CogIcon, ArrowRightOnRectangleIcon, Bars3Icon, CreditCardIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import KiratechLogo from '../components/KiratechLogo';
import ThemeToggle from '../components/ThemeToggle';
import toast from 'react-hot-toast';

const navItems = [
  { name: 'Dashboard',        href: '/admin',             icon: HomeIcon },
  { name: 'Users',            href: '/admin/users',       icon: UsersIcon },
  { name: 'Technicians',      href: '/admin/technicians', icon: WrenchScrewdriverIcon },
  { name: 'Service Requests', href: '/admin/requests',    icon: ClipboardDocumentListIcon },
  { name: 'Payments',         href: '/admin/payments',    icon: CreditCardIcon },
  { name: 'Services',         href: '/admin/services',    icon: CogIcon },
  { name: 'Reports',          href: '/admin/reports',     icon: ChartBarIcon },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/admin/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <KiratechLogo size={28} showText={false} linkTo={false} />
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-none">KIRATECH</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Admin Portal</p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Admin user */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-red-700 dark:text-red-300">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            location.pathname === item.href ||
            (item.href !== '/admin' && location.pathname.startsWith(item.href));
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
              <item.icon className="h-5 w-5" />
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
      <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-gray-200 dark:border-gray-700">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 z-50 shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
