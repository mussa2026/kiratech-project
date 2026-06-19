import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';

export default function AdminDashboard() {
  const { user }  = useAuthStore();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard-stats').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const { stats, recentRequests } = data;

  const statCards = [
    { label: 'Customers',   value: stats.totalUsers,         color: 'text-blue-600 dark:text-blue-400',   border: 'border-blue-200 dark:border-blue-800/50',   href: '/admin/users' },
    { label: 'Technicians', value: stats.totalTechnicians,   color: 'text-teal-600 dark:text-teal-400',   border: 'border-teal-200 dark:border-teal-800/50',   href: '/admin/technicians' },
    { label: 'All Requests',value: stats.totalRequests,      color: 'text-gray-900 dark:text-white',      border: '',                                          href: '/admin/requests' },
    { label: 'Pending',     value: stats.pendingRequests,    color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', href: '/admin/requests' },
    { label: 'In Progress', value: stats.inProgressRequests, color: 'text-purple-600 dark:text-purple-400',border: 'border-purple-200 dark:border-purple-800/50',href: '/admin/requests' },
    { label: 'Completed',   value: stats.completedRequests,  color: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800/50', href: '/admin/requests' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard 🛡
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.name?.split(' ')[0]}. Here's your system overview.
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <Link key={s.label} to={s.href}
            className={`card-cyber p-5 hover:shadow-cyber hover:-translate-y-0.5
                        transition-all duration-200 animate-fade-in-up delay-${i * 50} ${s.border}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 leading-tight">
              {s.label}
            </p>
            <p className={`text-3xl font-black mt-2 ${s.color}`}>{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Recent requests table */}
      <div className="card-cyber p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-700/60 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Service Requests</h2>
          <Link to="/admin/requests" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                {['Ticket', 'Customer', 'Service', 'Priority', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((r) => (
                <tr key={r.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link to={`/admin/requests/${r.id}`}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline font-mono text-xs">
                      {r.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.customer?.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-[160px] truncate">
                    {r.service?.name}
                  </td>
                  <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
