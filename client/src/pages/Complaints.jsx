import { useState, useEffect } from 'react';
import { complaintsApi, uploadApi, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', imageUrls: [] });
  const [resolveModal, setResolveModal] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await complaintsApi.getAll({ page, limit: 10 });
      setComplaints(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [page]);

  const handleImageAdd = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || form.imageUrls.length >= 3) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      const url = res.data.data?.url;
      if (url) setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await complaintsApi.create(form);
      setShowModal(false);
      setForm({ title: '', description: '', imageUrls: [] });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!resolveModal) return;
    try {
      await complaintsApi.resolve(resolveModal._id, { resolutionNotes });
      setResolveModal(null);
      setResolutionNotes('');
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const canResolve = ['admin', 'warden'].includes(user?.role);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Complaints</h2>
        {user?.role === 'student' && (
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
          >
            + Add Complaint
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                {canResolve && (
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {complaints.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {c.imageUrls?.[0] && (
                        <img src={getImageUrl(c.imageUrls[0])} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{c.title}</p>
                        <p className="text-sm text-slate-500 line-clamp-1">{c.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{c.studentId?.name || '-'}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  {canResolve && (
                    <td className="px-6 py-4 text-right">
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => setResolveModal(c)}
                          className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-3 border-t border-slate-100 bg-slate-50/50">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-semibold text-sm"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-semibold text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Complaint</h3>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Photos (optional, max 3)</label>
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={getImageUrl(url)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                      <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs">×</button>
                    </div>
                  ))}
                  {form.imageUrls.length < 3 && (
                    <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-emerald-500">
                      <input type="file" accept="image/*" onChange={handleImageAdd} className="hidden" disabled={uploading} />
                      {uploading ? '...' : '+'}
                    </label>
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resolveModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Resolve: {resolveModal.title}</h3>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Resolution Notes</label>
                <textarea value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500" rows={3} placeholder="Describe how the complaint was resolved..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setResolveModal(null); setResolutionNotes(''); }} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Resolve</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
