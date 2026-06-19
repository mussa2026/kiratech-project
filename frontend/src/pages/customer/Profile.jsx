import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { UserCircleIcon, KeyIcon, CheckBadgeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function CustomerProfile() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm]   = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw]           = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/user/profile', form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('New passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.put('/user/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="max-w-xl space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h1>

      {/* Profile info */}
      <div className="card-cyber p-7">
        {/* Avatar + info */}
        <div className="flex items-center gap-4 mb-7 pb-6 border-b border-blue-50 dark:border-slate-700/60">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600
                          flex items-center justify-center shadow-cyber flex-shrink-0">
            <span className="text-2xl font-black text-white">
              {user?.name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{user?.name}</p>
            <p className="text-slate-400 text-sm mt-0.5 truncate">{user?.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                  <CheckBadgeIcon className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                  <ExclamationTriangleIcon className="h-3 w-3" /> Not Verified
                </span>
              )}
              <span className="text-xs text-slate-400 capitalize">{user?.subscriptionType} plan</span>
            </div>
          </div>
        </div>

        {/* Edit form */}
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" className="input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input type="tel" className="input" placeholder="+255 7XX XXX XXX"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} placeholder="Your address..."
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary gap-2" disabled={savingProfile}>
            <UserCircleIcon className="h-4 w-4" />
            {savingProfile ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="card-cyber p-7">
        <h2 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <KeyIcon className="h-5 w-5 text-blue-500" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" value={pwForm.currentPassword}
              onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" value={pwForm.newPassword}
              onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} />
            <p className="text-xs text-slate-400 mt-1">Min 8 characters with uppercase, lowercase, and number</p>
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={pwForm.confirm}
              onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary gap-2" disabled={savingPw}>
            <KeyIcon className="h-4 w-4" />
            {savingPw ? 'Changing…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
