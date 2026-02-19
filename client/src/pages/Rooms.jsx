import { useState, useEffect } from 'react';
import { roomsApi, hostelsApi } from '../services/api';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ hostelId: '', roomNumber: '', capacity: '' });
  const [editing, setEditing] = useState(null);
  const [filterHostel, setFilterHostel] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filterHostel) params.hostelId = filterHostel;
      const res = await roomsApi.getAll(params);
      setRooms(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hostelsApi.getAll({ limit: 100 }).then((r) => setHostels(r.data.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [page, filterHostel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await roomsApi.update(editing._id, form);
      } else {
        await roomsApi.create(form);
      }
      setShowModal(false);
      setForm({ hostelId: '', roomNumber: '', capacity: '' });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleEdit = (r) => {
    setEditing(r);
    setForm({
      hostelId: r.hostelId?._id || r.hostelId,
      roomNumber: r.roomNumber,
      capacity: r.capacity,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this room?')) return;
    try {
      await roomsApi.delete(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex gap-2 items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Rooms</h2>
          <select
            value={filterHostel}
            onChange={(e) => setFilterHostel(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium bg-white dark:bg-slate-700 dark:text-slate-200"
          >
            <option value="">All Hostels</option>
            {hostels.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ hostelId: hostels[0]?._id || '', roomNumber: '', capacity: '' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Room
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50/80 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room #</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hostel</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {rooms.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">{r.roomNumber}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.hostelId?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{r.capacity}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        r.status === 'available'
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.status === 'full'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(r)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 text-sm font-semibold mr-4">Edit</button>
                    <button onClick={() => handleDelete(r._id)} className="text-red-600 hover:text-red-700 text-sm font-semibold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50/50">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm">Prev</button>
            <span className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400">{page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm">Next</button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">{editing ? 'Edit Room' : 'Add Room'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hostel</label>
                <select value={form.hostelId} onChange={(e) => setForm((f) => ({ ...f, hostelId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500" required>
                  <option value="">Select hostel</option>
                  {hostels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Room Number</label>
                <input value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Capacity</label>
                <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500" required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-semibold text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
