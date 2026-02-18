import { useState, useEffect } from 'react';
import { announcementsApi, hostelsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', hostelId: '', isPinned: false });
  const [editing, setEditing] = useState(null);

  const canManage = ['admin', 'warden'].includes(user?.role);

  const load = async () => {
    setLoading(true);
    try {
      const res = await announcementsApi.getAll({ limit: 50 });
      setAnnouncements(res.data.data || []);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (canManage) hostelsApi.getAll({ limit: 100 }).then((r) => setHostels(r.data.data || []));
  }, [canManage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.hostelId) delete payload.hostelId;
      if (editing) {
        await announcementsApi.update(editing._id, payload);
      } else {
        await announcementsApi.create(payload);
      }
      setShowModal(false);
      setForm({ title: '', content: '', hostelId: '', isPinned: false });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      content: a.content,
      hostelId: a.hostelId?._id || a.hostelId || '',
      isPinned: a.isPinned || false,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try {
      await announcementsApi.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Announcements & Notices</h2>
        {canManage && (
          <button
            onClick={() => {
              setEditing(null);
              setForm({ title: '', content: '', hostelId: '', isPinned: false });
              setShowModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
          >
            + Add Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
            No announcements yet.
          </div>
        ) : (
          announcements.map((a) => (
            <div
              key={a._id}
              className={`bg-white rounded-xl border shadow-sm p-5 ${a.isPinned ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    {a.isPinned && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">Pinned</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {a.createdBy?.name || 'Unknown'} · {a.hostelId?.name || 'All hostels'} · {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {canManage && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleEdit(a)} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(a._id)} className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && canManage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editing ? 'Edit Announcement' : 'Add Announcement'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hostel (optional)</label>
                <select
                  value={form.hostelId}
                  onChange={(e) => setForm((f) => ({ ...f, hostelId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                >
                  <option value="">All hostels</option>
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={form.isPinned}
                  onChange={(e) => setForm((f) => ({ ...f, isPinned: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-slate-700">Pin to top</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
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
