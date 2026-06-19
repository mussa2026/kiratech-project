import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function TechnicianDashboard() {
  const { user }  = useAuthStore();
  const [stats, setStats]       = useState(null);
  const [recentTasks, setRecent] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/technician/dashboard-stats'),
      api.get('/technician/tasks?limit=5'),
    ]).then(([sRes, tRes]) => {
      setStats(sRes.data.stats);
      setRecent(tRes.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { label: 'Total Tasks',  value: stats?.total ?? 0,      color: 'text-gray-900 dark:text-white',        border: '' },
    { label: 'Pending',      value: stats?.pending ?? 0,    color: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-800/50' },
    { label: 'In Progress',  value: stats?.inProgress ?? 0, color: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-800/50' },
    { label: 'Completed',    value: stats?.completed ?? 0,  color: 'text-green-600 dark:text-green-400',   border: 'border-green-200 dark:border-green-800/50' },
  ];

  const statusStyle = {
    completed:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    in_progress: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    accepted:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    assigned:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Technician Dashboard 👷
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={s.label} className={`card-cyber p-5 animate-fade-in-up delay-${i * 75} ${s.border}`}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {s.label}
            </p>
            <p className={`text-4xl font-black mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rating */}
      {parseFloat(stats?.rating) > 0 && (
        <div className="card-cyber p-5 border-amber-200 dark:border-amber-800/50 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-400
                          flex items-center justify-center text-xl shadow-cyber-sm flex-shrink-0">
            ⭐
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your Rating</p>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {Number(stats.rating).toFixed(1)} <span className="text-base font-normal text-slate-400">/ 5.0</span>
            </p>
          </div>
        </div>
      )}

      {/* Recent tasks */}
      <div className="card-cyber p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-blue-50 dark:border-slate-700/60 flex justify-between items-center">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-500" />
            Recent Tasks
          </h2>
          <Link to="/technician/tasks" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
            View all →
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-12 px-6">
            <ClipboardDocumentCheckIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No tasks assigned yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-blue-50 dark:divide-slate-700/40">
            {recentTasks.map((task) => (
              <Link key={task.id} to={`/technician/tasks/${task.id}`}
                className="flex items-center justify-between px-6 py-4
                           hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {task.customer?.name} · <span className="text-blue-500">{task.service?.name}</span>
                  </p>
                </div>
                <span className={`badge ml-3 flex-shrink-0 text-xs ${
                  statusStyle[task.status] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  {task.status.replace('_', ' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
