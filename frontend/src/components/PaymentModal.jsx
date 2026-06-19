import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { XMarkIcon, LockClosedIcon, CreditCardIcon, CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import api from '../lib/api';
import toast from 'react-hot-toast';

let stripePromise = null;
function getStripePromise() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key || key.startsWith('pk_test_your')) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

// ─── Payment method definitions ───────────────────────────────────────────────
const METHODS = [
  { id: 'card',         label: 'Card',         icon: '💳', desc: 'Visa / Mastercard / Amex',        group: 'International' },
  { id: 'mpesa',        label: 'M-Pesa',        icon: '📱', desc: 'Vodacom TZ / Safaricom KE',       group: 'East Africa' },
  { id: 'airtel_money', label: 'Airtel Money',  icon: '📱', desc: 'Airtel Tanzania',                 group: 'East Africa' },
  { id: 'tigo_pesa',    label: 'Tigo Pesa',     icon: '📱', desc: 'MIC Tanzania',                    group: 'East Africa' },
  { id: 'mtn_momo',     label: 'MTN MoMo',      icon: '📱', desc: 'Uganda / Rwanda / Ghana',         group: 'East Africa' },
  { id: 'binance',      label: 'Binance / USDT', icon: '🟡', desc: 'BEP20 · TRC20 · ERC20',          group: 'Crypto' },
];

// ─── Amount summary bar ───────────────────────────────────────────────────────
function AmountBar({ request, currency }) {
  const amount = parseFloat(request.finalCost || 0);
  return (
    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-xl px-4 py-3 mb-5 border border-blue-100 dark:border-blue-800/40">
      <div>
        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wide">Amount Due</p>
        <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
          ${amount.toFixed(2)} <span className="text-sm font-normal uppercase">{currency}</span>
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-400">Ticket</p>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">#{request.ticketNumber}</p>
        <p className="text-xs text-slate-400 truncate max-w-[130px]">{request.service?.name}</p>
      </div>
    </div>
  );
}

// ─── Copy to clipboard helper ─────────────────────────────────────────────────
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-slate-600/50">
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">{value}</p>
      </div>
      <button onClick={copy} className="ml-2 flex-shrink-0 p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        {copied ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <ClipboardDocumentIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Stripe card form ─────────────────────────────────────────────────────────
function CardForm({ request, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardError, setCardError]   = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const isDark = document.documentElement.classList.contains('dark');
  const style = { style: { base: { fontSize: '15px', color: isDark ? '#f1f5f9' : '#1e293b', fontFamily: 'Inter,system-ui,sans-serif', '::placeholder': { color: isDark ? '#64748b' : '#94a3b8' } }, invalid: { color: '#ef4444' } } };

  useEffect(() => {
    api.post('/payments/create-intent', { requestId: request.id })
      .then(({ data }) => setClientSecret(data.clientSecret))
      .catch((err) => { toast.error(err.response?.data?.error || 'Failed to initialise payment'); onClose(); });
  }, [request.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setProcessing(true); setCardError('');
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardNumberElement) },
    });
    if (error) { setCardError(error.message); setProcessing(false); }
    else if (paymentIntent.status === 'succeeded') onSuccess(paymentIntent);
    else { setCardError('Payment did not complete. Please try again.'); setProcessing(false); }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">Card Number</label><div className={inputCls}><CardNumberElement options={style} /></div></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label">Expiry</label><div className={inputCls}><CardExpiryElement options={style} /></div></div>
        <div><label className="label">CVC</label><div className={inputCls}><CardCvcElement options={style} /></div></div>
      </div>
      {import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_test_') && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
          <strong>Test mode:</strong> Use <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">4242 4242 4242 4242</code>, any future date, any CVC.
        </div>
      )}
      {cardError && <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">⚠️ {cardError}</p>}
      <button type="submit" disabled={!stripe || processing || !clientSecret}
        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-cyber-sm">
        {processing ? <><span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing…</> : <><LockClosedIcon className="h-4 w-4" />Pay ${parseFloat(request.finalCost || 0).toFixed(2)}</>}
      </button>
      <p className="text-xs text-center text-slate-400 flex items-center justify-center gap-1"><LockClosedIcon className="h-3 w-3" />Secured by Stripe · Card info never touches our servers</p>
    </form>
  );
}

// ─── Mobile Money form ────────────────────────────────────────────────────────
function MobileMoneyForm({ method, request, methods, onSuccess, onClose }) {
  const [phone, setPhone]       = useState('');
  const [ref, setRef]           = useState('');
  const [submitting, setSub]    = useState(false);
  const info = methods?.[method] || {};
  const amount = parseFloat(request.finalCost || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      const { data } = await api.post('/payments/mobile-money', {
        requestId: request.id, method, phone, providerRef: ref || undefined,
      });
      toast.success('Payment submitted! Admin will confirm shortly.');
      onSuccess({ method, instructions: data.instructions, paymentId: data.paymentId });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSub(false); }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/40 text-sm space-y-2">
        <p className="font-bold text-blue-800 dark:text-blue-300">📋 How to pay via {info.label}:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-400">
          <li>Open your {info.label} app / dial USSD</li>
          <li>Send <strong>${amount.toFixed(2)} ({info.currency})</strong> to the number below</li>
          <li>Use reference: <strong>KIRATECH-{request.ticketNumber}</strong></li>
          <li>Enter the transaction reference below and submit</li>
        </ol>
      </div>

      {/* Business number */}
      {info.businessNumber && (
        <CopyField label={`${info.label} Business Number`} value={info.businessNumber} />
      )}
      <CopyField label="Payment Reference" value={`KIRATECH-${request.ticketNumber}`} />

      <form onSubmit={handleSubmit} className="space-y-3 pt-1">
        <div>
          <label className="label">Your {info.label} Phone Number *</label>
          <input type="tel" className="input" placeholder="e.g. +255714759884"
            value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className="label">Transaction Reference (optional but recommended)</label>
          <input type="text" className="input" placeholder="e.g. ABC123456789"
            value={ref} onChange={e => setRef(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">Found in your SMS confirmation after payment</p>
        </div>
        <button type="submit" disabled={submitting || !phone}
          className="w-full py-3 btn-primary rounded-xl font-bold">
          {submitting ? 'Submitting…' : `Confirm ${info.label} Payment`}
        </button>
      </form>
      <p className="text-xs text-center text-slate-400">Admin will verify and confirm your payment within a few minutes.</p>
    </div>
  );
}

// ─── Crypto / Binance form ────────────────────────────────────────────────────
function CryptoForm({ request, methods, onSuccess }) {
  const [network, setNetwork] = useState('BEP20');
  const [txHash, setTxHash]   = useState('');
  const [submitting, setSub]  = useState(false);
  const info = methods?.binance || {};
  const addresses = info.addresses || {};
  const amount = parseFloat(request.finalCost || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSub(true);
    try {
      const { data } = await api.post('/payments/crypto', { requestId: request.id, network, txHash });
      toast.success('Transaction submitted! Admin is verifying on-chain.');
      onSuccess({ method: 'binance', network, txHash, verifyUrl: data.verifyUrl });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setSub(false); }
  };

  const addr = addresses[network]?.address;

  return (
    <div className="space-y-4">
      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
        ⚠️ <strong>USDT only.</strong> Sending other tokens to this address may result in permanent loss.
      </div>

      {/* Network selector */}
      <div>
        <label className="label">Select Network</label>
        <div className="grid grid-cols-3 gap-2">
          {['BEP20', 'TRC20', 'ERC20'].map(n => (
            <button key={n} type="button" onClick={() => setNetwork(n)}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                network === n ? 'bg-yellow-400 text-yellow-900 border-yellow-400 shadow' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-yellow-400'
              }`}>{n}</button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">{addresses[network]?.network}</p>
      </div>

      {/* Wallet address */}
      {addr && <CopyField label={`USDT ${network} Wallet Address`} value={addr} />}

      <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3 text-sm text-center">
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-1">Send exactly</p>
        <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">${amount.toFixed(2)} USDT</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Transaction Hash / TxID *</label>
          <input type="text" className="input font-mono text-xs" placeholder="0xabc123... or txhash..."
            value={txHash} onChange={e => setTxHash(e.target.value)} required />
          <p className="text-xs text-slate-400 mt-1">Copy from your wallet or Binance withdrawal history</p>
        </div>
        <button type="submit" disabled={submitting || !txHash}
          className="w-full py-3 font-bold rounded-xl text-white bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-yellow-900 disabled:opacity-50 active:scale-95 transition-all">
          {submitting ? 'Submitting…' : '🟡 Submit Crypto Payment'}
        </button>
      </form>
      <p className="text-xs text-center text-slate-400">Admin will verify on-chain and confirm within 15–30 minutes.</p>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ result, request, onClose }) {
  const isCard   = !result.method || result.method === 'stripe';
  const isCrypto = result.method === 'binance';
  return (
    <div className="text-center py-4 space-y-4">
      <div className="flex justify-center">
        <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
          isCard ? 'bg-green-100 dark:bg-green-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
        }`}>
          {isCard
            ? <CheckSolid className="h-12 w-12 text-green-500" />
            : <span className="text-4xl">{isCrypto ? '🟡' : '📱'}</span>}
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {isCard ? 'Payment Successful!' : 'Payment Submitted!'}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          {isCard
            ? `Your card payment for ticket #${request.ticketNumber} has been confirmed.`
            : `Your payment for ticket #${request.ticketNumber} has been submitted and is awaiting admin confirmation.`}
        </p>
      </div>
      {result.instructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-left space-y-1 border border-blue-100 dark:border-blue-800/40">
          <p className="font-semibold text-blue-700 dark:text-blue-300">Payment Instructions</p>
          <p className="text-blue-600 dark:text-blue-400">{result.instructions.note}</p>
        </div>
      )}
      {result.verifyUrl && (
        <a href={result.verifyUrl} target="_blank" rel="noopener noreferrer"
          className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Verify transaction on-chain →
        </a>
      )}
      <button onClick={onClose} className="btn-primary px-10 py-3 w-full">Done</button>
    </div>
  );
}

// ─── Main PaymentModal ────────────────────────────────────────────────────────
export default function PaymentModal({ request, onClose, onPaid }) {
  const [activeMethod, setActiveMethod] = useState('mpesa');
  const [done, setDone]                 = useState(false);
  const [result, setResult]             = useState(null);
  const [methods, setMethods]           = useState(null);
  const stripePromise                   = getStripePromise();

  useEffect(() => {
    api.get('/payments/methods').then(({ data }) => setMethods(data.methods)).catch(() => {});
  }, []);

  const handleSuccess = (res) => {
    setResult(res);
    setDone(true);
    if (onPaid) onPaid();
  };

  const groups = ['International', 'East Africa', 'Crypto'];
  const byGroup = (g) => METHODS.filter(m => m.group === g);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-glass-lg w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <CreditCardIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {done ? 'Payment Complete' : 'Choose Payment Method'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {done ? (
            <SuccessScreen result={result} request={request} onClose={onClose} />
          ) : (
            <div className="space-y-5">
              <AmountBar request={request} currency="USD" />

              {/* Method selector */}
              <div className="space-y-3">
                {groups.map(group => (
                  <div key={group}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">{group}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {byGroup(group).map(m => (
                        <button key={m.id} onClick={() => setActiveMethod(m.id)}
                          className={`flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-xs font-semibold transition-all ${
                            activeMethod === m.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-cyber-sm'
                              : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-300'
                          }`}>
                          <span className="text-xl">{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                {activeMethod === 'card' && (
                  stripePromise
                    ? <Elements stripe={stripePromise}><CardForm request={request} onSuccess={handleSuccess} onClose={onClose} /></Elements>
                    : <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
                        <CreditCardIcon className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                        Card payments not configured. Set <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code> in frontend/.env
                      </div>
                )}
                {['mpesa','airtel_money','tigo_pesa','mtn_momo'].includes(activeMethod) && (
                  <MobileMoneyForm method={activeMethod} request={request} methods={methods} onSuccess={handleSuccess} onClose={onClose} />
                )}
                {activeMethod === 'binance' && (
                  <CryptoForm request={request} methods={methods} onSuccess={handleSuccess} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
