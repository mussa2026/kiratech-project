import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CheckCircleIcon, ExclamationTriangleIcon, CreditCardIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const tzs = (v) => `TZS ${Number(v).toLocaleString('en-TZ')}`;

export default function PaymentSetup() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  const stripeConfigured =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY &&
    !import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_your');

  useEffect(() => {
    api.get('/payments/admin/history?limit=5')
      .then(({ data }) => {
        const ok = data.data.filter(p => p.status === 'succeeded');
        setStats({ total: data.pagination.total, revenue: ok.reduce((s,p)=>s+p.amount,0) });
      })
      .finally(() => setLoading(false));
  }, []);

  const steps = [
    { num:'1', title:'Create a Stripe account',    desc:'Go to stripe.com and create a free merchant account.',               link:'https://stripe.com',                     linkText:'stripe.com →',          done:false },
    { num:'2', title:'Get your API keys',           desc:'Dashboard → Developers → API Keys. Copy Publishable & Secret keys.', link:'https://dashboard.stripe.com/apikeys',   linkText:'Open Stripe Keys →',    done:false },
    { num:'3', title:'Add Secret Key to backend',   desc:'Open backend/.env and set:',  code:'STRIPE_SECRET_KEY=sk_test_xxxx\nSTRIPE_CURRENCY=usd',                           done:false },
    { num:'4', title:'Add Publishable Key to frontend', desc:'Open frontend/.env and set:', code:'VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxxx',                                  done:stripeConfigured },
    { num:'5', title:'Restart both servers',        desc:'Run node server.js and npm run dev again to load the new keys.',                                                      done:false },
    { num:'6', title:'(Optional) Set up webhooks',  desc:'Register webhook in Stripe Dashboard for production use. URL: https://yourdomain.com/api/payments/webhook', link:'https://dashboard.stripe.com/webhooks', linkText:'Open Webhooks →', done:false },
  ];

  const testCards = [
    { card:'4242 4242 4242 4242', desc:'Visa — succeeds' },
    { card:'4000 0000 0000 0002', desc:'Visa — declined' },
    { card:'4000 0025 0000 3155', desc:'3D Secure required' },
  ];

  const flow = [
    'Technician completes the job → updates status to Completed',
    'Admin opens the request → sets the Final Cost (TZS)',
    'Customer receives notification: "Invoice Ready"',
    'Customer clicks "Pay Now" → selects M-Pesa / Card / Binance',
    'Payment processed and confirmed',
    'Receipt emailed to customer automatically',
  ];

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CreditCardIcon className="h-7 w-7 text-blue-500" /> Payment Setup
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure payment methods. M-Pesa, Airtel, Tigo, MTN &amp; Binance work without setup. Stripe (card) needs keys.
        </p>
      </div>

      {/* Status banner */}
      <div className={`card-cyber p-5 flex items-center gap-4 ${
        stripeConfigured ? 'border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10'
                         : 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
      }`}>
        {stripeConfigured
          ? <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
          : <ExclamationTriangleIcon className="h-8 w-8 text-amber-500 flex-shrink-0" />}
        <div>
          <p className={`font-bold ${stripeConfigured ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
            {stripeConfigured ? '✅ Stripe card payments configured' : '⚠️ Stripe not configured (card payments unavailable)'}
          </p>
          <p className={`text-sm mt-0.5 ${stripeConfigured ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500'}`}>
            {stripeConfigured
              ? 'Publishable key is set. Ensure backend STRIPE_SECRET_KEY is also set.'
              : 'Mobile money (M-Pesa, Airtel, Tigo, MTN) and Binance/USDT are always available.'}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      {!loading && stats && stats.total > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card-cyber p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total Transactions</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white mt-2">{stats.total}</p>
          </div>
          <div className="card-cyber p-5 border-green-200 dark:border-green-800">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Revenue Collected</p>
            <p className="text-xl font-black text-green-600 dark:text-green-400 mt-2">{tzs(stats.revenue)}</p>
          </div>
        </div>
      )}

      {/* Stripe setup steps */}
      <div className="card-cyber p-6 space-y-5">
        <h2 className="font-bold text-gray-900 dark:text-white text-lg">Stripe Setup Guide</h2>
        {steps.map(s => (
          <div key={s.num} className="flex gap-4">
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-black ${
              s.done ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400'
                     : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            }`}>
              {s.done ? '✓' : s.num}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm ${s.done ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {s.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</p>
              {s.code && (
                <pre className="mt-2 text-xs bg-slate-900 dark:bg-slate-950 text-green-400 rounded-xl px-4 py-3 overflow-x-auto font-mono border border-slate-700">
                  {s.code}
                </pre>
              )}
              {s.link && (
                <a href={s.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1.5">
                  {s.linkText} <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Test cards */}
      <div className="card-cyber p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">🧪 Stripe Test Cards</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Use any future expiry and any 3-digit CVC with these test card numbers:
        </p>
        <div className="space-y-2">
          {testCards.map(({ card, desc }) => (
            <div key={card} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5 border border-slate-200 dark:border-slate-600/50">
              <code className="text-blue-700 dark:text-blue-300 text-xs font-mono tracking-wider">{card}</code>
              <span className="text-slate-500 dark:text-slate-400 text-xs ml-4">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment flow */}
      <div className="card-cyber p-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-4">💡 Payment Flow</h2>
        <div className="space-y-2.5">
          {flow.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-black text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">
                {i+1}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-right">
        <Link to="/admin/payments" className="btn-primary gap-2">
          <CreditCardIcon className="h-4 w-4" /> View Transactions →
        </Link>
      </div>
    </div>
  );
}
