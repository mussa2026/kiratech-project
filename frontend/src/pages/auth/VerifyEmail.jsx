import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';
import NetworkBackground from '../../components/NetworkBackground';
import KiratechLogo from '../../components/KiratechLogo';
import ThemeToggle from '../../components/ThemeToggle';

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="h-12 w-12 rounded-full border-2 border-blue-600/30 border-t-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm">Verifying your email…</p>
    </div>
  );
}

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { setStatus('error'); setMessage('No verification token found in the link.'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMessage(data.message); })
      .catch((err) => { setStatus('error'); setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.'); });
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070d1a] px-4 relative overflow-hidden">
      <NetworkBackground nodeCount={40} opacity={0.55} />
      <div className="absolute inset-0 bg-cyber-grid opacity-20" />
      <div className="fixed top-4 right-4 z-10"><ThemeToggle variant="dark" /></div>

      <div className="relative w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center"><KiratechLogo size={44} layout="col" /></Link>
        </div>

        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/60 shadow-glass-lg text-center">
          {status === 'loading' && <Spinner />}

          {status === 'success' && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-green-900/40 flex items-center justify-center">
                  <CheckCircleIcon className="h-10 w-10 text-green-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Email Verified! 🎉</h2>
              <p className="text-slate-400 text-sm">{message}</p>
              <Link to="/login"
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-cyber-sm block mt-4">
                Sign In Now →
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-900/40 flex items-center justify-center">
                  <XCircleIcon className="h-10 w-10 text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
              <p className="text-slate-400 text-sm">{message}</p>
              <div className="flex gap-3 justify-center mt-4">
                <Link to="/login" className="px-6 py-2.5 border border-slate-600 text-slate-300 rounded-xl hover:border-blue-500 hover:text-blue-400 transition-all text-sm font-semibold">Login</Link>
                <Link to="/register" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all active:scale-95 text-sm font-semibold">Register Again</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
