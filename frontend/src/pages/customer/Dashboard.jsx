import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PlusIcon, ClipboardDocumentListIcon, BellIcon } from '@heroicons/react/24/outline';

export default function CustomerDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/requests?limit=5').then(({ data }) => {
      setRecentRequests(data.data);
      const s = data.data.reduce(
        (acc, r) => {
          acc.total++;
          if (r.status === 'pending' || r.status === 'assigned') acc.active++;
          if (r.status === 'completed') acc.completed++;
          return acc;
        },
        { total: 0, active: 0, completed: 0 }
      );
      s.total = data.pagination.total;
      setStats(s);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here's an overview of your service requests.</p>
        </div>
        <Link to="/dashboard/request-service" className="btn-primary gap-2 flex-shrink-0">
          <PlusIcon className="h-4 w-4" /> New Request
        </Link>
      </div>

      {!user?.isVerified && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 text-sm text-amber-800 dark:text-amber-400 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>Your email is not verified. Some features may be limited.</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Requests', value: stats?.total ?? 0,     color: 'text-gray-900 dark:text-white',          bg: '' },
          { label: 'Active',         value: stats?.active ?? 0,    color: 'text-blue-700 dark:text-blue-400',       bg: 'border-blue-200 dark:border-blue-800/50' },
          { label: 'Completed',      value: stats?.completed ?? 0, color: 'text-green-700 dark:text-green-400',     bg: 'border-green-200 dark:border-green-800/50' },
        ].map((s) => (
          <div key={s.label} className={`card-cyber p-5 ${s.bg}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{s.label}</p>
            <p className={`text-4xl font-black mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/dashboard/request-service" className="btn-primary gap-2">
          <PlusIcon className="h-4 w-4" /> New Request
        </Link>
        <Link to="/dashboard/my-requests" className="btn-secondary gap-2">
          <ClipboardDocumentListIcon className="h-4 w-4" /> All Requests
        </Link>
        <Link to="/dashboard/notifications" className="btn-secondary gap-2">
          <BellIcon className="h-4 w-4" /> Notifications
        </Link>
      </div>

      {/* Recent requests */}
      <div className="card-cyber p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-700/60 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent Requests</h2>
          <Link to="/dashboard/my-requests" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all →</Link>
        </div>
        {recentRequests.length === 0 ? (
          <div className="text-center py-12 px-6">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 dark:text-slate-400 mb-4">No service requests yet.</p>
            <Link to="/dashboard/request-service" className="btn-primary text-sm">Submit Your First Request</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Ticket', 'Service', 'Issue', 'Priority', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((r) => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3">
                      <Link to={`/dashboard/my-requests/${r.id}`} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                        {r.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{r.service?.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[160px] truncate">{r.title}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
