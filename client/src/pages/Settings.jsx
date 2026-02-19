import { useState, useEffect } from 'react';
import { authApi, uploadApi, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '', avatarUrl: '' });

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.name || '', avatarUrl: user.avatarUrl || '' }));
    }
  }, [user]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setForm((f) => ({ ...f, avatarUrl: res.data.data?.url || '' }));
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (form.password && form.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    setLoading(true);
    try {
      const payload = { name: form.name, avatarUrl: form.avatarUrl || undefined };
      if (form.password) payload.password = form.password;
      await authApi.updateProfile(payload);
      await refreshUser();
      setForm((f) => ({ ...f, password: '', confirmPassword: '' }));
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Profile Settings</h2>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Profile Photo</label>
            <div className="flex items-center gap-3">
              {form.avatarUrl ? (
                <div className="relative">
                  <img src={getImageUrl(form.avatarUrl)} alt="Avatar" className="w-20 h-20 rounded-full object-cover border" />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-sm"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-emerald-500 text-gray-500 dark:text-slate-400">
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
                  {uploading ? '...' : <span className="text-2xl text-gray-400 dark:text-slate-500">+</span>}
                </label>
              )}
              <span className="text-sm text-gray-500 dark:text-slate-400">JPEG, PNG, GIF. Max 5MB</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-slate-400 mb-1">Email</label>
            <input value={user?.email} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-200" disabled />
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Email cannot be changed</p>
          </div>

          <div className="border-t border-gray-100 dark:border-slate-700 pt-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">Change Password</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="New password (leave blank to keep current)"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
