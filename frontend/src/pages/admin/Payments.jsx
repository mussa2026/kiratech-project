import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CreditCardIcon, Cog6ToothIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// TZS formatter
const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

const statusConfig = {
  succeeded:             { label: 'Paid',     cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  awaiting_confirmation: { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending:               { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  failed:                { label: 'Failed',   cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  cancelled:             { label: 'Cancelled',cls: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  refunded:              { label: 'Refunded', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
};
const methodIcon  = { stripe:'💳', mpesa:'📱', airtel_money:'📱', tigo_pesa:'📱', mtn_momo:'📱', binance:'🟡', manual:'🔧' };
const methodLabel = { stripe:'Card', mpesa:'M-Pesa', airtel_money:'Airtel Money', tigo_pesa:'Tigo Pesa', mtn_momo:'MTN MoMo', binance:'Binance/USDT', manual:'Manual' };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [totals, setTotals]     = useState({ tzs: 0, usd: 0, count: 0 });
  const [loading, setLoading]   = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = () => {
    setLoading(true);
    const params = statusFilter ? `?status=${statusFilter}&limit=100` : '?limit=100';
    api.get(`/payments/admin/history${params}`)
      .then(({ data }) => {
        setPayments(data.data);
        const ok = data.data.filter(p => p.status === 'succeeded');
        const tzsTotal = ok.filter(p => ['mpesa','airtel_money','tigo_pesa','mtn_momo'].includes(p.paymentMethod))
                           .reduce((s, p) => s + p.amount, 0);
        const usdTotal = ok.filter(p => !['mpesa','airtel_money','tigo_pesa','mtn_momo'].includes(p.paymentMethod))
                           .reduce((s, p) => s + p.amount, 0);
        setTotals({ tzs: tzsTotal, usd: usdTotal, count: ok.length });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const confirmPayment = async (id) => {
    try {
      await api.put(`/payments/admin/confirm/${id}`);
      toast.success('Payment confirmed!');
      fetchPayments();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to confirm'); }
  };

  const statuses = ['', 'succeeded', 'awaiting_confirmation', 'pending', 'failed', 'cancelled'];
  const pendingCount = payments.filter(p => p.status === 'awaiting_confirmation').length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCardIcon className="h-7 w-7 text-blue-500" /> Payments
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            All transactions — M-Pesa, Airtel, Tigo, MTN MoMo, Binance, Card.
          </p>
        </div>
        <Link to="/admin/payment-setup" className="btn-secondary text-sm gap-2">
          <Cog6ToothIcon className="h-4 w-4" /> Setup Guide
        </Link>
      </div>

      {/* Stripe warning */}
      {(!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_your')) && (
        <div className="card-cyber border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 flex items-center gap-4 p-4">
          <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">Card payments (Stripe) not configured</p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              M-Pesa, Airtel, Tigo, MTN & Binance always available.{' '}
              <Link to="/admin/payment-setup" className="underline font-semibold">Configure Stripe →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="card-cyber border-yellow-300 dark:border-yellow-700 bg-yellow-50/50 dark:bg-yellow-900/10 flex items-center gap-4 p-4">
          <span className="text-2xl flex-shrink-0">📋</span>
          <div>
            <p className="font-semibold text-yellow-700 dark:text-yellow-400">
              {pendingCount} payment{pendingCount > 1 ? 's' : ''} awaiting confirmation
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-500">
              Verify in your M-Pesa / mobile money / crypto account, then click Confirm.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-cyber p-5 border-green-200 dark:border-green-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">TZS Revenue</p>
          <p className="text-xl font-black text-green-600 dark:text-green-400 mt-2">
            {tzs(totals.tzs)}
          </p>
        </div>
        <div className="card-cyber p-5 border-blue-200 dark:border-blue-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">USD / USDT Revenue</p>
          <p className="text-xl font-black text-blue-600 dark:text-blue-400 mt-2">
            ${totals.usd.toFixed(2)}
          </p>
        </div>
        <div className="card-cyber p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Confirmed</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{totals.count}</p>
        </div>
        <div className="card-cyber p-5 border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Awaiting</p>
          <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 mt-2">{pendingCount}</p>
        </div>
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
            {s === '' ? 'All' : s === 'awaiting_confirmation' ? 'Awaiting' : s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <LoadingSpinner /> : payments.length === 0 ? (
        <div className="card-cyber p-12 text-center text-slate-500 dark:text-slate-400">No payments found.</div>
      ) : (
        <div className="card-cyber p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-header">
                <tr>
                  {['Ticket','Customer','Method','Amount','Status','Ref / TX','Date','Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const sc = statusConfig[p.status] || { label: p.status, cls: 'bg-gray-100 text-gray-600' };
                  const isMobile = ['mpesa','airtel_money','tigo_pesa','mtn_momo'].includes(p.paymentMethod);
                  return (
                    <tr key={p.id} className="table-row">
                      <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400 text-xs">
                        {p.ticketNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">{p.customer}</p>
                        <p className="text-xs text-slate-400">{p.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap text-xs">
                        {methodIcon[p.paymentMethod] || '💰'} {methodLabel[p.paymentMethod] || p.paymentMethod}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs">
                        {isMobile
                          ? tzs(p.amount)
                          : `$${p.amount.toFixed(2)} ${p.currency.toUpperCase()}`
                        }
                      </td>
                      <td className="px-4 py-3"><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[120px] truncate">
                        {p.providerRef || p.cryptoNetwork || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(p.paidAt || p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {p.status === 'awaiting_confirmation' && (
                          <button onClick={() => confirmPayment(p.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 hover:underline">
                            <CheckCircleIcon className="h-4 w-4" /> Confirm
                          </button>
                        )}
                        {p.receiptUrl && (
                          <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            Receipt
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
