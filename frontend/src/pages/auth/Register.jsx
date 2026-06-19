import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import KiratechLogo from '../../components/KiratechLogo';
import ThemeToggle from '../../components/ThemeToggle';
import NetworkBackground from '../../components/NetworkBackground';

// ─── OTP digit boxes ────────────────────────────────────────────────────────
function OtpInput({ value, onChange, disabled }) {
  const inputs = useRef([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);
  const handleChange = (i, e) => {
    const v = e.target.value.replace(/\D/g,'').slice(-1);
    const next = [...digits]; next[i] = v;
    onChange(next.join(''));
    if (v && i < 5) inputs.current[i+1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key==='Backspace' && !digits[i] && i>0) inputs.current[i-1]?.focus();
    if (e.key==='ArrowLeft' && i>0) inputs.current[i-1]?.focus();
    if (e.key==='ArrowRight' && i<5) inputs.current[i+1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    onChange(p.padEnd(6,'').slice(0,6));
    inputs.current[Math.min(p.length,5)]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center">
      {digits.map((d,i) => (
        <input key={i} ref={el=>inputs.current[i]=el} type="text" inputMode="numeric" maxLength={1} value={d} disabled={disabled}
          onChange={e=>handleChange(i,e)} onKeyDown={e=>handleKeyDown(i,e)} onPaste={handlePaste}
          className={`w-12 h-13 text-center text-xl font-black rounded-xl border-2 transition-all
            bg-slate-700/70 text-white focus:outline-none
            ${d ? 'border-blue-500 shadow-cyber-sm' : 'border-slate-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}`} />
      ))}
    </div>
  );
}

// ─── Step 1: Details ─────────────────────────────────────────────────────────
function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [loading, setLoad] = useState(false);
  const { register } = useAuthStore();
  const inp = 'block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm';

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoad(true);
    const result = await register(form); setLoad(false);
    if (result.success) onSuccess(form.email, form.name);
    else toast.error(result.error);
  };
  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
          <input type="text" className={inp} placeholder="John Doe" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required minLength={2} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
          <input type="email" className={inp} placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Phone <span className="text-slate-500 normal-case">(optional)</span></label>
          <input type="tel" className={inp} placeholder="+255 7XX XXX XXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Password</label>
          <input type="password" className={inp} placeholder="Min 8 chars, uppercase + number" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={8} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-cyber-sm flex items-center justify-center gap-2">
          {loading ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating…</> : '🚀 Create Account & Send Code'}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        Already have an account?{' '}<Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">Sign in</Link>
      </p>
    </div>
  );
}

// ─── Step 2: OTP verify ───────────────────────────────────────────────────────
function OtpVerifyForm({ email, onVerified }) {
  const [otp, setOtp]       = useState('');
  const [verifying, setVer] = useState(false);
  const [resending, setRes] = useState(false);
  const [countdown, setCD]  = useState(60);
  const [canResend, setCan] = useState(false);

  useEffect(() => {
    if (countdown <= 0) { setCan(true); return; }
    const t = setTimeout(() => setCD(c=>c-1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { toast.error('Enter the complete 6-digit code'); return; }
    setVer(true);
    try { await api.post('/auth/verify-otp', { email, otp }); toast.success('Email verified!'); onVerified(); }
    catch (err) { toast.error(err.response?.data?.error || 'Verification failed'); }
    finally { setVer(false); }
  };
  const handleResend = async () => {
    setRes(true);
    try { await api.post('/auth/resend-otp', { email }); toast.success('New code sent!'); setOtp(''); setCD(60); setCan(false); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed to resend'); }
    finally { setRes(false); }
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg">
      <div className="flex justify-center mb-4">
        <div className="h-14 w-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
          <EnvelopeIcon className="h-7 w-7 text-blue-400" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-center text-white mb-1">Check your email</h2>
      <p className="text-sm text-center text-slate-400 mb-7">
        Code sent to <strong className="text-white">{email}</strong>
      </p>
      <form onSubmit={handleVerify} className="space-y-6">
        <OtpInput value={otp} onChange={setOtp} disabled={verifying} />
        <button type="submit" disabled={verifying || otp.length !== 6}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-cyber-sm flex items-center justify-center gap-2">
          {verifying ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Verifying…</> : '✓ Verify Email'}
        </button>
      </form>
      <div className="mt-5 text-center">
        {canResend
          ? <button onClick={handleResend} disabled={resending} className="text-sm text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50">{resending?'Sending…':'Resend code'}</button>
          : <p className="text-sm text-slate-500">Resend in <span className="font-bold text-slate-300 tabular-nums">{String(Math.floor(countdown/60)).padStart(2,'0')}:{String(countdown%60).padStart(2,'0')}</span></p>
        }
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────
function SuccessScreen({ name }) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg text-center">
      <div className="flex justify-center mb-4">
        <div className="h-16 w-16 rounded-full bg-green-900/40 border border-green-500/40 flex items-center justify-center">
          <CheckCircleIcon className="h-10 w-10 text-green-400" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">You're verified! 🎉</h2>
      <p className="text-slate-400 mb-7">Welcome to KIRATECH, <strong className="text-white">{name}</strong>. Your account is now active.</p>
      <Link to="/login" className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-cyber-sm block text-center">
        Sign In Now →
      </Link>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Register() {
  const [step, setStep]   = useState('register');
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 py-12 relative overflow-hidden">
      <NetworkBackground nodeCount={45} opacity={0.55} />
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="fixed top-4 right-4 z-10"><ThemeToggle variant="dark" /></div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link to="/" className="inline-flex justify-center"><KiratechLogo size={42} layout="col" /></Link>
          <div className="mt-4">
            {step === 'register' && <><h1 className="text-2xl font-bold text-white">Create an account</h1><p className="text-slate-400 text-sm mt-1">Start requesting IT support today</p></>}
            {step === 'verify'   && <><h1 className="text-2xl font-bold text-white">Verify your email</h1><p className="text-slate-400 text-sm mt-1">Step 2 of 2</p></>}
          </div>
        </div>

        {/* Step dots */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-3 mb-6">
            {['register','verify'].map((s,i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step===s ? 'bg-blue-600 text-white shadow-cyber-sm' :
                  (s==='register' && step==='verify') ? 'bg-green-500 text-white' :
                  'bg-slate-700 text-slate-500'
                }`}>{s==='register'&&step==='verify'?'✓':i+1}</div>
                <span className={`text-xs font-medium ${step===s?'text-white':'text-slate-500'}`}>{s==='register'?'Details':'Verify'}</span>
                {i===0 && <div className="w-6 h-0.5 bg-slate-700 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {step==='register' && <RegisterForm onSuccess={(e,n)=>{setEmail(e);setName(n);setStep('verify');}} />}
        {step==='verify'   && <OtpVerifyForm email={email} onVerified={()=>setStep('done')} />}
        {step==='done'     && <SuccessScreen name={name} />}
      </div>
    </div>
  );
}
