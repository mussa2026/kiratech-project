import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge';
import { CreditCardIcon, BanknotesIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// TZS formatter
const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

const payBadge = {
  unpaid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  paid:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  waived: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
};

export default function AdminRequestDetail() {
  const { id } = useParams();
  const [request, setRequest]     = useState(null);
  const [payment, setPayment]     = useState(null);
  const [technicians, setTechs]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedTech, setSelTech] = useState('');
  const [adminNotes, setNotes]    = useState('');
  const [assigning, setAssigning] = useState(false);
  const [costForm, setCost]       = useState({ finalCost: '', estimatedCost: '', waive: false });
  const [settingCost, setSetting] = useState(false);

  const fetchData = () => {
    Promise.all([
      api.get(`/admin/requests/${id}`),
      api.get('/admin/technicians?availability=available'),
      api.get(`/payments/request/${id}`).catch(() => ({ data: { payment: null } })),
    ]).then(([reqRes, techRes, payRes]) => {
      const req = reqRes.data.request;
      setRequest(req);
      setTechs(techRes.data.data);
      setPayment(payRes.data.payment);
      setCost({
        finalCost:     req.finalCost     ? String(parseFloat(req.finalCost))     : '',
        estimatedCost: req.estimatedCost ? String(parseFloat(req.estimatedCost)) : '',
        waive: req.paymentStatus === 'waived',
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAssign = async () => {
    if (!selectedTech) { toast.error('Please select a technician'); return; }
    setAssigning(true);
    try {
      await api.put(`/admin/requests/${id}/assign`, { technicianId: selectedTech, adminNotes });
      toast.success('Technician assigned!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to assign'); }
    finally { setAssigning(false); }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this request?')) return;
    try { await api.put(`/admin/requests/${id}/cancel`); toast.success('Request cancelled'); fetchData(); }
    catch { toast.error('Failed to cancel'); }
  };

  const handleSetCost = async (e) => {
    e.preventDefault();
    if (!costForm.finalCost && !costForm.waive) { toast.error('Enter a final cost or select Waive'); return; }
    setSetting(true);
    try {
      await api.put(`/payments/admin/set-cost/${id}`, {
        finalCost:     parseFloat(costForm.finalCost) || 0,
        estimatedCost: costForm.estimatedCost ? parseFloat(costForm.estimatedCost) : undefined,
        waive:         costForm.waive,
      });
      toast.success(costForm.waive ? 'Payment waived' : 'Cost set — customer can now pay');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to set cost'); }
    finally { setSetting(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!request) return <div className="text-center py-20 text-slate-500">Request not found.</div>;

  const isCompleted = request.status === 'completed';
  const canSetCost  = isCompleted && request.paymentStatus !== 'paid';

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in-up">
      <Link to="/admin/requests" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
        ← Service Requests
      </Link>

      {/* Request overview */}
      <div className="card-cyber p-6">
        <div className="flex justify-between items-start gap-3 mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h1>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-1">#{request.ticketNumber}</p>
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ['Service',   request.service?.name],
            ['Category',  <span className="capitalize">{request.service?.category}</span>],
            ['Submitted', new Date(request.createdAt).toLocaleString()],
            request.location && ['Location', request.location],
            request.estimatedCost && ['Est. Cost', tzs(request.estimatedCost)],
            request.finalCost    && ['Final Cost', <span className="font-bold text-green-600 dark:text-green-400">{tzs(request.finalCost)}</span>],
            ['Payment', <span className={`badge ${payBadge[request.paymentStatus]}`}>{request.paymentStatus}</span>],
            payment?.paidAt && ['Paid On', new Date(payment.paidAt).toLocaleString()],
          ].filter(Boolean).map(([label, val]) => (
            <div key={label}>
              <span className="font-medium text-slate-500 dark:text-slate-400">{label}: </span>
              <span className="text-gray-800 dark:text-gray-200">{val}</span>
            </div>
          ))}
        </div>

        {payment?.receiptUrl && (
          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-blue-600 dark:text-blue-400 hover:underline">
            View Receipt →
          </a>
        )}

        <div className="mt-4 text-sm border-t border-blue-50 dark:border-slate-700/60 pt-4">
          <span className="font-medium text-slate-500 dark:text-slate-400">Description:</span>
          <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">{request.description}</p>
        </div>
      </div>

      {/* Customer */}
      <div className="card-cyber p-5">
        <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-blue-500" /> Customer
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            ['Name',  request.customer?.name],
            ['Email', request.customer?.email],
            request.customer?.phone && ['Phone', request.customer.phone],
          ].filter(Boolean).map(([l, v]) => (
            <div key={l}>
              <span className="font-medium text-slate-500 dark:text-slate-400">{l}: </span>
              <span className="text-gray-800 dark:text-gray-200">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Technician */}
      {request.technician && (
        <div className="card-cyber p-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">Assigned Technician</h2>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-green-700 dark:text-green-300">{request.technician.user?.name?.[0]}</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{request.technician.user?.name}</p>
              <p className="text-sm text-slate-400">{request.technician.user?.phone}</p>
            </div>
          </div>
          {request.technicianNotes && (
            <div className="mt-3 bg-blue-50/50 dark:bg-slate-700/40 p-3 rounded-xl text-sm">
              <p className="font-medium text-slate-600 dark:text-slate-300 mb-1">Notes:</p>
              <p className="text-slate-600 dark:text-slate-400">{request.technicianNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* Set Final Cost — TZS */}
      {canSetCost && (
        <div className="card-cyber p-6 border-blue-300 dark:border-blue-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5 text-blue-500" /> Set Invoice Amount (TZS)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Enter amount in Tanzanian Shillings. Customer will be notified and can pay online.
          </p>
          <form onSubmit={handleSetCost} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Final Cost (TZS) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">TZS</span>
                  <input type="number" min="0" step="1000" className="input pl-10"
                    placeholder="e.g. 25000"
                    value={costForm.finalCost}
                    onChange={e => setCost({ ...costForm, finalCost: e.target.value })}
                    disabled={costForm.waive} required={!costForm.waive} />
                </div>
                {costForm.finalCost && !costForm.waive && (
                  <p className="text-xs text-blue-500 mt-1">= {tzs(costForm.finalCost)}</p>
                )}
              </div>
              <div>
                <label className="label">Estimated Cost (TZS) <span className="text-slate-400 font-normal">optional</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">TZS</span>
                  <input type="number" min="0" step="1000" className="input pl-10"
                    placeholder="e.g. 20000"
                    value={costForm.estimatedCost}
                    onChange={e => setCost({ ...costForm, estimatedCost: e.target.value })}
                    disabled={costForm.waive} />
                </div>
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={costForm.waive}
                onChange={e => setCost({ ...costForm, waive: e.target.checked, finalCost: e.target.checked ? '0' : costForm.finalCost })} />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Waive payment — customer pays nothing for this request
              </span>
            </label>
            <button type="submit" className="btn-primary gap-2" disabled={settingCost}>
              <CreditCardIcon className="h-4 w-4" />
              {settingCost ? 'Saving…' : costForm.waive ? 'Waive Payment' : 'Set Cost & Notify Customer'}
            </button>
          </form>
        </div>
      )}

      {/* Paid confirmation */}
      {isCompleted && request.paymentStatus === 'paid' && (
        <div className="card-cyber p-5 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10 flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center flex-shrink-0">
            <CreditCardIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-bold text-green-700 dark:text-green-400">✅ Payment Received</p>
            <p className="text-sm text-green-600 dark:text-green-500">
              {tzs(request.finalCost)} received
              {payment?.paidAt ? ` · ${new Date(payment.paidAt).toLocaleString()}` : ''}
            </p>
          </div>
        </div>
      )}

      {/* Assign technician */}
      {['pending', 'rejected'].includes(request.status) && (
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Assign Technician</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Select Technician</label>
              <select className="input" value={selectedTech} onChange={e => setSelTech(e.target.value)}>
                <option value="">— Choose a technician —</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.user?.name} — {t.specialization || 'General'} ({t.availability})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Admin Notes <span className="text-slate-400 font-normal">(optional)</span></label>
              <textarea className="input" rows={2} value={adminNotes} onChange={e => setNotes(e.target.value)} />
            </div>
            <button onClick={handleAssign} className="btn-primary" disabled={assigning}>
              {assigning ? 'Assigning…' : 'Assign Technician'}
            </button>
          </div>
        </div>
      )}

      {/* Cancel */}
      {!['completed', 'cancelled'].includes(request.status) && (
        <div>
          <button onClick={handleCancel} className="btn-danger text-sm">Cancel Request</button>
        </div>
      )}
    </div>
  );
}
