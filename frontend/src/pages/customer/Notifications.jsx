import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const typeIcon = {
  request_submitted:  '📤',
  request_assigned:   '👷',
  request_accepted:   '✅',
  request_in_progress:'🔧',
  request_completed:  '🎉',
  request_cancelled:  '❌',
  new_registration:   '👤',
  general:            '💬',
};

export default function CustomerNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);

  const fetchNotifications = () => {
    api.get('/notifications')
      .then(({ data }) => { setNotifications(data.notifications); setUnreadCount(data.unreadCount); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    toast.success('All notifications marked as read');
    fetchNotifications();
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  if (loading) return <LoadingSpinner text="Loading notifications..." />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-blue-500" />
            Notifications
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="btn-secondary text-sm gap-2">
            <CheckIcon className="h-4 w-4" />
            Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card-cyber p-12 text-center">
          <BellIcon className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`card-cyber p-4 cursor-pointer transition-all duration-200 hover:shadow-cyber ${
                !n.isRead
                  ? 'border-l-4 border-blue-500 dark:border-blue-400'
                  : 'opacity-80 hover:opacity-100'
              }`}>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {typeIcon[n.type] || '💬'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm text-gray-900 dark:text-white ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
