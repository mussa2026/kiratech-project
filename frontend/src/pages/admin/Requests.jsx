import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/admin/requests${params}`).then(({ data }) => setRequests(data.data)).finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['', 'pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ClipboardDocumentListIcon className="h-7 w-7 text-blue-500" />
          Service Requests
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Manage and assign all customer requests.</p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
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

      {loading ? <LoadingSpinner /> : requests.length === 0 ? (
        <div className="card-cyber p-12 text-center text-slate-500 dark:text-slate-400">No requests found.</div>
      ) : (
        <div className="card-cyber p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Ticket', 'Customer', 'Service', 'Technician', 'Priority', 'Status', 'Cost', 'Date', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">
                      {r.ticketNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{r.customer?.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 max-w-[140px] truncate text-xs">
                      {r.service?.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">
                      {r.technician?.user?.name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {r.finalCost ? tzs(r.finalCost) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/requests/${r.id}`}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
