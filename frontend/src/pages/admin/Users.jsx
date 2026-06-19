import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = () => {
    setLoad(true);
    const params = search ? `?search=${encodeURIComponent(search)}&role=customer` : '?role=customer';
    api.get(`/admin/users${params}`).then(({ data }) => setUsers(data.data)).finally(() => setLoad(false));
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch { toast.error('Action failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UsersIcon className="h-7 w-7 text-blue-500" /> Customers
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Manage registered customer accounts.</p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input type="text" className="input pl-10" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card-cyber p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Name', 'Email', 'Phone', 'Plan', 'Verified', 'Status', 'Joined', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs">{u.email}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{u.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${u.subscriptionType === 'premium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                        {u.subscriptionType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${u.isVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {u.isVerified ? '✓ Verified' : '⚠ Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${u.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleStatus(u)}
                        className={`text-xs font-semibold hover:underline ${u.isActive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <UsersIcon className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No customers found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
