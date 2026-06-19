import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import KiratechLogo from '../../components/KiratechLogo';
import ThemeToggle from '../../components/ThemeToggle';
import NetworkBackground from '../../components/NetworkBackground';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [loading, setLoad] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoad(true);
    const result = await login(form.email, form.password);
    setLoad(false);
    if (result.success) {
      toast.success('Welcome back!');
      const redirects = { admin: '/admin', technician: '/technician', customer: '/dashboard' };
      navigate(redirects[result.user.role] || '/dashboard', { replace: true });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 relative overflow-hidden">
      <NetworkBackground nodeCount={45} opacity={0.6} />
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="fixed top-4 right-4 z-10"><ThemeToggle variant="dark" /></div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center"><KiratechLogo size={44} layout="col" /></Link>
          <h1 className="text-2xl font-bold text-white mt-4">Welcome Back</h1>
          <p className="text-slate-400 mt-1 text-sm">Sign in to your KIRATECH account</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">Email Address</label>
              <input type="email" className="block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</Link>
              </div>
              <input type="password" className="block w-full px-4 py-3 bg-slate-700/70 border border-slate-600 text-white rounded-xl placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 shadow-cyber-sm hover:shadow-cyber flex items-center justify-center gap-2">
              {loading ? <><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in…</> : 'Sign In →'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 font-semibold hover:text-blue-300">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-5">
          Admin?{' '}<a href="/admin/login" className="text-slate-500 hover:text-slate-400 underline">Admin Portal</a>
          {' '}· Technician?{' '}<a href="/technician/login" className="text-slate-500 hover:text-slate-400 underline">Tech Portal</a>
        </p>
      </div>
    </div>
  );
}
