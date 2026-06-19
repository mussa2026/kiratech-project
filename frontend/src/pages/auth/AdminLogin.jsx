import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../store/authStore';
import KiratechLogo from '../../components/KiratechLogo';
import ThemeToggle from '../../components/ThemeToggle';
import NetworkBackground from '../../components/NetworkBackground';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [form, setForm]    = useState({ email: '', password: '' });
  const [loading, setLoad] = useState(false);
  const { login }          = useAuthStore();
  const navigate           = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoad(true);
    const result = await login(form.email, form.password);
    setLoad(false);

    if (!result.success) { toast.error(result.error); return; }
    if (result.user.role !== 'admin') {
      useAuthStore.getState().logout();
      toast.error('Access denied. This portal is for administrators only.');
      return;
    }
    toast.success('Welcome, Administrator!');
    navigate('/admin', { replace: true });
  };

  const inp = 'block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 relative overflow-hidden">
      <NetworkBackground nodeCount={50} opacity={0.65} />
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="fixed top-4 right-4 z-10"><ThemeToggle variant="dark" /></div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl
                          bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 mb-4 overflow-hidden
                          shadow-glass">
            <KiratechLogo size={44} showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-white">KIRATECH</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-semibold tracking-widest uppercase">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg">
          <h2 className="text-lg font-bold text-white mb-1">Administrator Sign In</h2>
          <p className="text-sm text-slate-400 mb-6">Restricted access — authorised personnel only.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Admin Email
              </label>
              <input id="email" type="email" className={inp} placeholder="robertcharles088@gmail.com"
                value={form.email} onChange={e => setForm({...form, email:e.target.value})}
                autoComplete="email" required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Password
              </label>
              <input id="password" type="password" className={inp} placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password:e.target.value})}
                autoComplete="current-password" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700
                         hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-bold rounded-xl transition-all active:scale-95
                         shadow-cyber-sm hover:shadow-cyber
                         flex items-center justify-center gap-2">
              {loading
                ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Authenticating…</>
                : <><ShieldCheckIcon className="h-4 w-4" />Sign In to Admin Portal</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Not an admin?{' '}
          <a href="/login" className="text-slate-500 hover:text-blue-400 underline transition-colors">
            Customer Login
          </a>
        </p>
      </div>
    </div>
  );
}
