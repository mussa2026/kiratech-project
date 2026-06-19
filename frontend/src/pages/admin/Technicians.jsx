import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { WrenchScrewdriverIcon, PlusCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const initialForm = { name:'', email:'', password:'', phone:'', specialization:'', experience:'' };

export default function AdminTechnicians() {
  const [technicians, setTechs] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [showForm, setShow]     = useState(false);
  const [form, setForm]         = useState(initialForm);
  const [submitting, setSub]    = useState(false);

  const fetchTechnicians = () => {
    setLoad(true);
    api.get('/admin/technicians').then(({ data }) => setTechs(data.data)).finally(() => setLoad(false));
  };

  useEffect(() => { fetchTechnicians(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password,
        ...(form.phone && { phone: form.phone }),
        ...(form.specialization && { specialization: form.specialization }),
        ...(form.experience !== '' && { experience: form.experience }),
      };
      await api.post('/admin/technicians', payload);
      toast.success('Technician account created!');
      setForm(initialForm); setShow(false); fetchTechnicians();
    } catch (err) {
      const data = err.response?.data;
      toast.error(data?.errors?.[0]?.msg || data?.error || 'Failed to create technician');
    } finally { setSub(false); }
  };

  const handleRemove = async (id) => {
    if (!confirm('Remove this technician?')) return;
    try { await api.delete(`/admin/technicians/${id}`); toast.success('Technician removed'); fetchTechnicians(); }
    catch { toast.error('Failed to remove'); }
  };

  const availBadge = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    busy:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    offline:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-7 w-7 text-blue-500" /> Technicians
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your technician team.</p>
        </div>
        <button onClick={() => setShow(!showForm)} className={showForm ? 'btn-secondary gap-2' : 'btn-primary gap-2'}>
          {showForm ? <><XCircleIcon className="h-4 w-4" /> Cancel</> : <><PlusCircleIcon className="h-4 w-4" /> Add Technician</>}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card-cyber p-6 animate-fade-in-down">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">New Technician Account</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" placeholder="Min 8 chars, upper + number"
                value={form.password} onChange={e => setForm({...form,password:e.target.value})} required minLength={8} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" placeholder="+255 7XX XXX XXX"
                value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} />
            </div>
            <div>
              <label className="label">Specialization</label>
              <input type="text" className="input" placeholder="e.g. Networking, Hardware…"
                value={form.specialization} onChange={e => setForm({...form,specialization:e.target.value})} />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input type="number" className="input" min={0}
                value={form.experience} onChange={e => setForm({...form,experience:e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary gap-2" disabled={submitting}>
                {submitting ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating…</> : '✓ Create Technician Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? <LoadingSpinner /> : (
        <div className="card-cyber p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Name', 'Email', 'Employee ID', 'Specialization', 'Rating', 'Jobs', 'Availability', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.id} className="table-row">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{t.user?.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{t.user?.email}</td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400">{t.employeeId}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">{t.specialization || '—'}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{Number(t.rating).toFixed(1)} ⭐</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{t.totalJobsDone}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${availBadge[t.availability] || availBadge.offline}`}>
                        {t.availability}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleRemove(t.id)}
                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {technicians.length === 0 && (
              <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                <WrenchScrewdriverIcon className="h-10 w-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                No technicians yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
