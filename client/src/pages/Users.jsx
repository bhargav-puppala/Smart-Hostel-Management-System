import { useState, useEffect } from 'react';
import { usersApi, hostelsApi, uploadApi, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingWardens, setPendingWardens] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', hostelId: '', avatarUrl: '' });
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [res, pendingRes] = await Promise.all([
        usersApi.getAll({ page, limit: 10 }),
        currentUser?.role === 'admin' ? usersApi.getAll({ role: 'warden', approvalStatus: 'pending', limit: 50 }) : Promise.resolve({ data: { data: [] } }),
      ]);
      setUsers(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setPendingWardens(pendingRes?.data?.data || []);
    } catch {
      setUsers([]);
      setPendingWardens([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hostelsApi.getAll({ limit: 100 }).then((r) => setHostels(r.data.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [page, currentUser?.role]);

  const handleApprove = async (id) => {
    try {
      await usersApi.approveWarden(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this warden registration?')) return;
    try {
      await usersApi.rejectWarden(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;
      if (!payload.hostelId) delete payload.hostelId;
      if (payload.hostelId === '') delete payload.hostelId;
      if (!payload.avatarUrl) delete payload.avatarUrl;
      if (editing) {
        await usersApi.update(editing._id, payload);
      } else {
        await usersApi.create(payload);
      }
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'student', hostelId: '', avatarUrl: '' });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      hostelId: u.hostelId?._id || u.hostelId || '',
      avatarUrl: u.avatarUrl || '',
    });
    setShowModal(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setForm((f) => ({ ...f, avatarUrl: res.data.data?.url || '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const roles = ['admin', 'warden', 'accountant', 'student'];

  return (
    <div className="space-y-6">
      {pendingWardens.length > 0 && currentUser?.role === 'admin' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-3">Pending Warden Approvals ({pendingWardens.length})</h3>
          <div className="space-y-2">
            {pendingWardens.map((u) => (
              <div key={u._id} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-100 dark:border-amber-800/50">
                <div>
                  <span className="font-medium text-gray-900 dark:text-slate-100">{u.name}</span>
                  <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">({u.email})</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(u._id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(u._id)}
                    className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 hover:bg-red-200 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-sm font-medium"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Users</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', email: '', password: '', role: 'student', hostelId: '', avatarUrl: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
        >
          + Add User
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hostel</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {u.avatarUrl ? (
                        <img src={getImageUrl(u.avatarUrl)} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                          {u.name?.charAt(0) || '?'}
                        </div>
                      )}
                      {u.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {u.role}
                    </span>
                    {u.role === 'warden' && u.approvalStatus === 'pending' && (
                      <span className="ml-1 px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{u.hostelId?.name || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(u)}
                      className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 font-medium text-sm text-slate-800 dark:text-slate-200"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-slate-700 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 font-medium text-sm text-slate-800 dark:text-slate-200"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editing ? 'Edit User' : 'Add User'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Avatar</label>
                <div className="flex items-center gap-3">
                  {form.avatarUrl ? (
                    <div className="relative">
                      <img src={getImageUrl(form.avatarUrl)} alt="Avatar" className="w-14 h-14 rounded-full object-cover border" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
                    </div>
                  ) : (
                    <label className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-500 dark:text-slate-400">
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
                      {uploading ? '...' : '+'}
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                  required
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Password {editing && '(leave blank to keep)'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                  required={!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hostel (optional)</label>
                <select
                  value={form.hostelId}
                  onChange={(e) => setForm((f) => ({ ...f, hostelId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                >
                  <option value="">None</option>
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
