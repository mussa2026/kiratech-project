import { useState, useEffect } from 'react';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CogIcon, PlusCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;
const initialForm = { name:'', description:'', category:'standard', basePrice:'', estimatedDuration:'' };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [showForm, setShow]     = useState(false);
  const [form, setForm]         = useState(initialForm);
  const [submitting, setSub]    = useState(false);

  const fetchServices = () => {
    setLoad(true);
    api.get('/services').then(({ data }) => setServices(data.services)).finally(() => setLoad(false));
  };

  useEffect(() => { fetchServices(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSub(true);
    try {
      await api.post('/services', form);
      toast.success('Service created!');
      setForm(initialForm); setShow(false); fetchServices();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create service'); }
    finally { setSub(false); }
  };

  const toggleService = async (svc) => {
    try {
      await api.put(`/services/${svc.id}`, { isActive: !svc.isActive });
      toast.success(`Service ${!svc.isActive ? 'activated' : 'deactivated'}`);
      fetchServices();
    } catch { toast.error('Failed to update service'); }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CogIcon className="h-7 w-7 text-blue-500" /> Services
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage available IT services and their prices (TZS).</p>
        </div>
        <button onClick={() => setShow(!showForm)} className={showForm ? 'btn-secondary gap-2' : 'btn-primary gap-2'}>
          {showForm ? <><XCircleIcon className="h-4 w-4" /> Cancel</> : <><PlusCircleIcon className="h-4 w-4" /> Add Service</>}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card-cyber p-6 animate-fade-in-down">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Add New Service</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Service Name *</label>
              <input type="text" className="input" value={form.name} onChange={e => setForm({...form,name:e.target.value})} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form,description:e.target.value})} />
            </div>
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                <option value="standard">Standard</option>
                <option value="premium">⭐ Premium</option>
              </select>
            </div>
            <div>
              <label className="label">Base Price (TZS)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">TZS</span>
                <input type="number" className="input pl-10" min={0} step={1000}
                  placeholder="e.g. 25000"
                  value={form.basePrice} onChange={e => setForm({...form,basePrice:e.target.value})} />
              </div>
            </div>
            <div>
              <label className="label">Estimated Duration</label>
              <input type="text" className="input" placeholder="e.g. 1-2 hours"
                value={form.estimatedDuration} onChange={e => setForm({...form,estimatedDuration:e.target.value})} />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-primary gap-2" disabled={submitting}>
                {submitting ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</> : '✓ Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Service cards */}
      {loading ? <LoadingSpinner /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc, i) => (
            <div key={svc.id}
              className={`card-cyber p-5 transition-all duration-200 animate-fade-in-up delay-${Math.min(i*50,400)} ${!svc.isActive ? 'opacity-50' : 'hover:shadow-cyber hover:-translate-y-0.5'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight pr-2">{svc.name}</h3>
                <span className={`badge text-xs flex-shrink-0 ${svc.category==='premium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                  {svc.category==='premium' ? '⭐' : '●'} {svc.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{svc.description}</p>
              <div className="flex justify-between items-center text-xs border-t border-blue-50 dark:border-slate-700/50 pt-2.5">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {svc.basePrice > 0 ? tzs(svc.basePrice) : 'Free'}
                </span>
                {svc.estimatedDuration && <span className="text-slate-400">⏱ {svc.estimatedDuration}</span>}
              </div>
              <button onClick={() => toggleService(svc)}
                className={`mt-3 text-xs font-semibold hover:underline ${svc.isActive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {svc.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
