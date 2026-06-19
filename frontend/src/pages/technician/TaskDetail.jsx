import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { UserIcon, WrenchScrewdriverIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const [task, setTask]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notes, setNotes]         = useState('');
  const [acting, setActing]       = useState(false);

  const fetchTask = () => {
    api.get(`/technician/tasks/${id}`).then(({ data }) => {
      setTask(data.request);
      setNotes(data.request.technicianNotes || '');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === 'accept')      { await api.put(`/technician/tasks/${id}/accept`); toast.success('Task accepted!'); }
      else if (action === 'reject') { await api.put(`/technician/tasks/${id}/reject`); toast.success('Task rejected'); }
      else if (action === 'in_progress') { await api.put(`/technician/tasks/${id}/status`, { status: 'in_progress', notes }); toast.success('Status: In Progress'); }
      else if (action === 'completed') {
        if (!notes.trim()) { toast.error('Add service notes before completing'); setActing(false); return; }
        await api.put(`/technician/tasks/${id}/status`, { status: 'completed', notes });
        toast.success('Task completed! 🎉');
      }
      fetchTask();
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed'); }
    finally { setActing(false); }
  };

  if (loading) return <LoadingSpinner text="Loading task..." />;
  if (!task)   return <div className="text-center py-20 text-slate-500">Task not found.</div>;

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in-up">
      <Link to="/technician/tasks" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← My Tasks
      </Link>

      {/* Task info */}
      <div className="card-cyber p-6">
        <div className="flex justify-between items-start gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
            <p className="text-xs font-mono text-blue-500 mt-1">#{task.ticketNumber}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          {[
            ['Service',  task.service?.name],
            ['Description', null],
            task.location && ['Location', task.location],
            task.preferredDate && ['Preferred', `${new Date(task.preferredDate).toLocaleDateString()} ${task.preferredTime||''}`],
          ].filter(Boolean).map(([l,v]) => (
            <div key={l}>
              <span className="font-medium text-slate-500 dark:text-slate-400">{l}: </span>
              {l === 'Description'
                ? <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                : <span className="text-gray-800 dark:text-gray-200">{v}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Customer */}
      <div className="card-cyber p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-blue-500" /> Customer
        </h2>
        <div className="space-y-1.5 text-sm">
          {[['Name', task.customer?.name], ['Email', task.customer?.email], task.customer?.phone && ['Phone', task.customer.phone], task.customer?.address && ['Address', task.customer.address]].filter(Boolean).map(([l,v]) => (
            <div key={l}>
              <span className="font-medium text-slate-500 dark:text-slate-400">{l}: </span>
              <span className="text-gray-800 dark:text-gray-200">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Accept / Reject */}
      {task.status === 'assigned' && (
        <div className="card-cyber p-5 flex gap-3">
          <button onClick={() => handleAction('accept')} disabled={acting}
            className="btn-primary flex-1 py-3">✓ Accept Task</button>
          <button onClick={() => handleAction('reject')} disabled={acting}
            className="btn-danger flex-1 py-3">✗ Reject Task</button>
        </div>
      )}

      {/* Progress update */}
      {(task.status === 'accepted' || task.status === 'in_progress') && (
        <div className="card-cyber p-6 space-y-4">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5 text-blue-500" /> Update Progress
          </h2>
          <div>
            <label className="label">Service Notes {task.status === 'in_progress' && <span className="text-red-400">*</span>}</label>
            <textarea className="input" rows={4}
              placeholder="Describe what was done, parts replaced, issues found…"
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3">
            {task.status === 'accepted' && (
              <button onClick={() => handleAction('in_progress')} disabled={acting}
                className="btn-primary flex-1 py-3">
                🔧 Start Working
              </button>
            )}
            {task.status === 'in_progress' && (
              <button onClick={() => handleAction('completed')} disabled={acting}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircleIcon className="h-5 w-5" /> Mark Completed
              </button>
            )}
          </div>
        </div>
      )}

      {/* Completed notes */}
      {task.technicianNotes && task.status === 'completed' && (
        <div className="card-cyber p-5 border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10">
          <h2 className="font-bold text-green-700 dark:text-green-400 mb-2">✅ Service Notes</h2>
          <p className="text-green-700 dark:text-green-300 text-sm">{task.technicianNotes}</p>
        </div>
      )}
    </div>
  );
}
