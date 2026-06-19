import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserCircleIcon, StarIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

export default function TechnicianProfile() {
  const { user }  = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ specialization:'', bio:'', experience:'', availability:'available' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get('/technician/profile').then(({ data }) => {
      setProfile(data.profile);
      setForm({
        specialization: data.profile.specialization || '',
        bio:            data.profile.bio            || '',
        experience:     data.profile.experience     || '',
        availability:   data.profile.availability   || 'available',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await api.put('/technician/profile', form);
      setProfile(data.profile);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  const availColor = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    busy:      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    offline:   'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  };

  return (
    <div className="max-w-xl space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      {/* Avatar + info */}
      <div className="card-cyber p-6">
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-blue-50 dark:border-slate-700/60">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-600 to-teal-600
                          flex items-center justify-center shadow-cyber flex-shrink-0">
            <span className="text-2xl font-black text-white">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{user?.name}</p>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{user?.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">Employee ID: <span className="font-mono text-blue-500">{profile?.employeeId}</span></p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center border border-amber-100 dark:border-amber-800/40">
            <StarIcon className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-black text-amber-600 dark:text-amber-400">{Number(profile?.rating||0).toFixed(1)}</p>
            <p className="text-xs text-slate-400">Rating</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center border border-blue-100 dark:border-blue-800/40">
            <BriefcaseIcon className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">{profile?.totalJobsDone||0}</p>
            <p className="text-xs text-slate-400">Jobs Done</p>
          </div>
          <div className={`rounded-xl p-3 text-center border ${availColor[form.availability]} border-current/20`}>
            <div className="h-2 w-2 rounded-full bg-current mx-auto mb-1 animate-pulse" />
            <p className="text-sm font-bold capitalize">{form.availability}</p>
            <p className="text-xs opacity-70">Status</p>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Specialization</label>
            <input type="text" className="input" placeholder="e.g. Networking, Hardware Repair…"
              value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} placeholder="Brief professional bio…"
              value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Years of Experience</label>
              <input type="number" className="input" min={0} max={50}
                value={form.experience} onChange={e => setForm({...form, experience: e.target.value})} />
            </div>
            <div>
              <label className="label">Availability</label>
              <select className="input" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})}>
                <option value="available">🟢 Available</option>
                <option value="busy">🟡 Busy</option>
                <option value="offline">⚫ Offline</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary gap-2" disabled={saving}>
            <UserCircleIcon className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
