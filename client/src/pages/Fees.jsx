import { useState, useEffect } from 'react';
import { feesApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Fees() {
  const { user } = useAuth();
  const canCreate = ['admin', 'warden', 'accountant'].includes(user?.role);
  const canMarkPaid = ['admin', 'accountant'].includes(user?.role);
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentId: '', amount: '', dueDate: '', description: 'Hostel fee' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await feesApi.getAll({ page, limit: 10 });
      setFees(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    usersApi.getAll({ limit: 100, role: 'student' }).then((r) => setStudents(r.data.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await feesApi.create({
        ...form,
        amount: Number(form.amount),
        dueDate: form.dueDate || new Date().toISOString().split('T')[0],
      });
      setShowModal(false);
      setForm({ studentId: '', amount: '', dueDate: '', description: 'Hostel fee' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handlePay = async (id) => {
    try {
      await feesApi.pay(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">{user?.role === 'student' ? 'My Fees' : 'Fees'}</h2>
        {canCreate && (
          <button
            onClick={() => {
              setForm({ studentId: students[0]?._id || '', amount: '', dueDate: '', description: 'Hostel fee' });
              setShowModal(true);
            }}
            className="px-4 py-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
          >
            + Add Fee
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
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {fees.map((f) => (
                <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-slate-900">{f.studentId?.name || '-'}</td>
                  <td className="px-6 py-4 font-medium">₹{f.amount}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {f.status !== 'paid' && canMarkPaid && (
                      <button
                        onClick={() => handlePay(f._id)}
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      >
                        Mark Paid
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
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
            >
              Prev
            </button>
            <span className="px-3 py-1">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 disabled:opacity-50 font-medium text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Add Fee</h3>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
