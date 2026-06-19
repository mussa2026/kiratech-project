import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function MyRequests() {
  const [requests, setRequests]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchRequests = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/user/requests${params}`)
      .then(({ data }) => setRequests(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRequests(); }, [statusFilter]);

  const statuses = ['', 'pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Requests</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track all your service requests.</p>
        </div>
        <Link to="/dashboard/request-service" className="btn-primary gap-2 w-fit">
          <PlusIcon className="h-4 w-4" /> New Request
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-cyber-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-blue-100 dark:border-slate-700 hover:border-blue-400'
            }`}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? <LoadingSpinner /> : (
        requests.length === 0 ? (
          <div className="card-cyber p-12 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500 dark:text-slate-400 mb-4">No requests found.</p>
            <Link to="/dashboard/request-service" className="btn-primary text-sm">Submit a Request</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Link key={r.id} to={`/dashboard/my-requests/${r.id}`}
                className="card-cyber p-5 block hover:shadow-cyber hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {r.service?.name}
                      <span className="mx-1.5">·</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">#{r.ticketNumber}</span>
                    </p>
                    {r.technician && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        👷 Technician: {r.technician.user?.name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                  </div>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
