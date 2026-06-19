import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import KiratechLogo from '../../components/KiratechLogo';
import NetworkBackground from '../../components/NetworkBackground';
import ThemeToggle from '../../components/ThemeToggle';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [form, setForm]   = useState({ password: '', confirm: '' });
  const [loading, setLoad] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoad(true);
    try {
      await api.post('/auth/reset-password', { token: searchParams.get('token'), password: form.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    } finally { setLoad(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 relative overflow-hidden">
      <NetworkBackground nodeCount={40} opacity={0.55} />
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="fixed top-4 right-4 z-10"><ThemeToggle variant="dark" /></div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center"><KiratechLogo size={44} layout="col" /></Link>
          <h1 className="text-2xl font-bold text-white mt-4">Reset Password</h1>
          <p className="text-slate-400 mt-1 text-sm">Enter a new secure password below.</p>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">New Password</label>
              <input type="password"
                className="block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="Min 8 chars, uppercase + number"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Confirm Password</label>
              <input type="password"
                className="block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="Repeat new password"
                value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-cyber-sm flex items-center justify-center gap-2">
              {loading ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Resetting…</> : '🔑 Reset Password'}
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link to="/login" className="text-blue-400 hover:text-blue-300">← Back to login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
