import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

export default function AdminReports() {
  const [report, setReport]     = useState(null);
  const [payments, setPayments] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/reports/summary'),
      api.get('/payments/admin/history?limit=1000').catch(() => ({ data: { data: [] } })),
    ]).then(([repRes, payRes]) => {
      setReport(repRes.data);
      const pData = payRes.data.data || [];
      const ok    = pData.filter(p => p.status === 'succeeded');
      const mobile = ['mpesa','airtel_money','tigo_pesa','mtn_momo'];
      setPayments({
        total:      pData.length,
        succeeded:  ok.length,
        revTzs:     ok.filter(p => mobile.includes(p.paymentMethod)).reduce((s, p) => s + p.amount, 0),
        revUsd:     ok.filter(p => !mobile.includes(p.paymentMethod)).reduce((s, p) => s + p.amount, 0),
        pending:    pData.filter(p => p.status === 'pending' || p.status === 'awaiting_confirmation').length,
        failed:     pData.filter(p => p.status === 'failed').length,
      });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading reports..." />;

  const statusColors = {
    pending: 'bg-yellow-400', assigned: 'bg-blue-400', accepted: 'bg-indigo-400',
    in_progress: 'bg-purple-400', completed: 'bg-green-400', cancelled: 'bg-gray-400',
  };
  const totalRequests = report.byStatus.reduce((s, r) => s + parseInt(r.dataValues?.count || r.count || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChartBarIcon className="h-7 w-7 text-blue-500" /> Reports
        </h1>
        <p className="text-slate-500 dark:text-slate-400">System performance and analytics overview.</p>
      </div>

      {/* ── Revenue Overview ─────────────────────────────────── */}
      {payments && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            💳 Revenue Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'TZS Revenue',   value: tzs(payments.revTzs),         color: 'text-green-600 dark:text-green-400',  border: 'border-green-200 dark:border-green-800' },
              { label: 'USD/USDT Rev',  value: `$${payments.revUsd.toFixed(2)}`, color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
              { label: 'Confirmed',     value: payments.succeeded,            color: 'text-green-600 dark:text-green-400',  border: '' },
              { label: 'Total Trans.',  value: payments.total,                color: 'text-gray-900 dark:text-white',       border: '' },
              { label: 'Pending',       value: payments.pending,              color: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-200 dark:border-amber-800' },
              { label: 'Failed',        value: payments.failed,               color: 'text-red-600 dark:text-red-400',      border: 'border-red-200 dark:border-red-800' },
            ].map(({ label, value, color, border }) => (
              <div key={label} className={`card-cyber p-4 ${border}`}>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 leading-tight">{label}</p>
                <p className={`text-lg font-black mt-1.5 ${color} leading-tight`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="text-right mt-2">
            <Link to="/admin/payments" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              View all transactions →
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* By Status */}
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Requests by Status</h2>
          <div className="space-y-3">
            {report.byStatus.map(s => {
              const count = parseInt(s.dataValues?.count || s.count || 0);
              const pct   = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{s.status?.replace('_', ' ')}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-blue-50 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${statusColors[s.status] || 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* By Priority */}
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Requests by Priority</h2>
          <div className="space-y-3">
            {report.byPriority.map(p => {
              const count = parseInt(p.dataValues?.count || p.count || 0);
              const pct   = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0;
              const colors = { low:'bg-gray-400', medium:'bg-blue-400', high:'bg-orange-400', urgent:'bg-red-500' };
              return (
                <div key={p.priority}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="capitalize font-medium text-slate-600 dark:text-slate-400">{p.priority}</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{count}</span>
                  </div>
                  <div className="h-2 bg-blue-50 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[p.priority] || 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Services */}
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">🔧 Top Requested Services</h2>
          {report.byService.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {report.byService.map((s, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-blue-50 dark:border-slate-700/40 last:border-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{s.service?.name}</span>
                  <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {s.dataValues?.count || s.count} requests
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Technicians */}
        <div className="card-cyber p-6">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">👷 Top Technicians</h2>
          {report.topTechs.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {report.topTechs.map((t, i) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-blue-50 dark:border-slate-700/40 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-black text-blue-700 dark:text-blue-300 flex-shrink-0">
                      #{i + 1}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.user?.name}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">{Number(t.rating).toFixed(1)} ⭐</span>
                    <span className="text-slate-400">{t.totalJobsDone} jobs</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
