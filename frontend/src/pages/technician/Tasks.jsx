import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export default function TechnicianTasks() {
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setFilter]   = useState('');

  useEffect(() => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}` : '';
    api.get(`/technician/tasks${params}`).then(({ data }) => setTasks(data.data)).finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['', 'assigned', 'accepted', 'in_progress', 'completed', 'rejected'];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <ClipboardDocumentCheckIcon className="h-7 w-7 text-blue-500" />
        My Tasks
      </h1>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
              statusFilter === s
                ? 'bg-blue-600 text-white shadow-cyber-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-blue-100 dark:border-slate-700 hover:border-blue-400'
            }`}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : tasks.length === 0 ? (
        <div className="card-cyber p-12 text-center">
          <ClipboardDocumentCheckIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, i) => (
            <Link key={task.id} to={`/technician/tasks/${task.id}`}
              className={`card-cyber p-5 block hover:shadow-cyber hover:-translate-y-0.5
                          transition-all duration-200 animate-fade-in-up delay-${Math.min(i * 50, 400)}`}>
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{task.title}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {task.service?.name}
                    <span className="mx-1.5">·</span>
                    <span className="font-mono text-blue-500">#{task.ticketNumber}</span>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    👤 {task.customer?.name}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">{new Date(task.createdAt).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
