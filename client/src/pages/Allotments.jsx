import { useState, useEffect } from 'react';
import { allotmentsApi, roomsApi, usersApi } from '../services/api';

export default function Allotments() {
  const [allotments, setAllotments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', roomId: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await allotmentsApi.getAll({ page, limit: 10 });
      setAllotments(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setAllotments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      roomsApi.getAll({ limit: 100 }).then((r) => r.data.data || []),
      usersApi.getAll({ limit: 100, role: 'student' }).then((r) => r.data.data || []),
    ]).then(([r, s]) => {
      setRooms(r);
      setStudents(s);
    });
  }, []);

  useEffect(() => {
    load();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await allotmentsApi.create(form);
      setShowModal(false);
      setForm({ studentId: '', roomId: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleEnd = async (id) => {
    if (!confirm('End this allotment?')) return;
    try {
      await allotmentsApi.end(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">Allotments</h2>
        <button
          onClick={() => {
            setForm({ studentId: students[0]?._id || '', roomId: rooms[0]?._id || '' });
            setShowModal(true);
          }}
          className="px-4 py-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
        >
          + Add Allotment
        </button>
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Room</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Start Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">End Date</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allotments.map((a) => (
                <tr key={a._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-900">{a.studentId?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {a.roomId?.roomNumber || '-'} ({a.roomId?.hostelId?.name || 'Hostel'})
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {a.startDate ? new Date(a.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Active'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!a.endDate && (
                      <button
                        onClick={() => handleEnd(a._id)}
                        className="text-amber-600 hover:text-amber-700 text-sm font-semibold"
                      >
                        End Allotment
                      </button>
                    )}
                  </td>
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
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Allotment</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  required
                >
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Room</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  required
                >
                  <option value="">Select room</option>
                  {rooms.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.roomNumber} - {r.hostelId?.name} (Capacity: {r.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
