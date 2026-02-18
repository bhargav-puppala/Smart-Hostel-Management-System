import { useState, useEffect } from 'react';
import { hostelsApi, uploadApi, getImageUrl } from '../services/api';

export default function Hostels() {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', totalRooms: '', imageUrl: '' });
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await hostelsApi.getAll({ page, limit: 10 });
      setHostels(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setHostels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, totalRooms: parseInt(form.totalRooms, 10) || 0 };
      if (!payload.imageUrl) delete payload.imageUrl;
      if (editing) {
        await hostelsApi.update(editing._id, payload);
      } else {
        await hostelsApi.create(payload);
      }
      setShowModal(false);
      setForm({ name: '', address: '', totalRooms: '', imageUrl: '' });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (h) => {
    setEditing(h);
    setForm({ name: h.name, address: h.address, totalRooms: h.totalRooms, imageUrl: h.imageUrl || '' });
    setShowModal(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      setForm((f) => ({ ...f, imageUrl: res.data.data?.url || '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this hostel?')) return;
    try {
      await hostelsApi.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Hostels</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', address: '', totalRooms: '', imageUrl: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Hostel
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rooms</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {hostels.map((h) => (
                <tr key={h._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {h.imageUrl ? (
                        <img src={getImageUrl(h.imageUrl)} alt={h.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500 text-sm">—</div>
                      )}
                      <span className="font-semibold text-slate-900">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{h.address}</td>
                  <td className="px-6 py-4 text-slate-600">{h.totalRooms}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEdit(h)}
                      className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(h._id)}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-slate-100 bg-slate-50/50">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm">Prev</button>
            <span className="px-4 py-2 text-sm font-medium text-slate-600">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm">Next</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">{editing ? 'Edit Hostel' : 'Add Hostel'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Image</label>
                <div className="flex items-center gap-3">
                  {form.imageUrl ? (
                    <div className="relative">
                      <img src={getImageUrl(form.imageUrl)} alt="Hostel" className="w-20 h-20 rounded-lg object-cover border border-slate-200" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
                    </div>
                  ) : (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" disabled={uploading} />
                      {uploading ? <span className="text-xs text-slate-500">...</span> : <span className="text-2xl text-slate-400">+</span>}
                    </label>
                  )}
                  <span className="text-xs text-slate-500">JPEG, PNG, GIF, WebP. Max 5MB</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Total Rooms</label>
                <input
                  type="number"
                  min="1"
                  value={form.totalRooms}
                  onChange={(e) => setForm((f) => ({ ...f, totalRooms: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25"
                >
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
