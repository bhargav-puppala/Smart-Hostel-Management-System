import { useState, useEffect } from 'react';
import { visitorsApi, usersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Visitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [checkedOutFilter, setCheckedOutFilter] = useState('');
  const [form, setForm] = useState({
    studentId: '',
    visitorName: '',
    visitorPhone: '',
    relation: '',
    purpose: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (checkedOutFilter === 'true') params.checkedOut = 'true';
      if (checkedOutFilter === 'false') params.checkedOut = 'false';
      const res = await visitorsApi.getAll(params);
      setVisitors(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch {
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await usersApi.getAll({ role: 'student', limit: 200 });
      setStudents(res.data.data || []);
    } catch {
      setStudents([]);
    }
  };

  useEffect(() => {
    load();
  }, [page, checkedOutFilter]);

  useEffect(() => {
    if (showModal && ['admin', 'warden'].includes(user?.role)) loadStudents();
  }, [showModal, user?.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (user?.role === 'student') payload.studentId = user._id;
      await visitorsApi.create(payload);
      setShowModal(false);
      setForm({ studentId: '', visitorName: '', visitorPhone: '', relation: '', purpose: '' });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleCheckOut = async (visitor) => {
    try {
      await visitorsApi.checkout(visitor._id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const canCheckOut = ['admin', 'warden'].includes(user?.role);
  const canCreate = ['admin', 'warden', 'student'].includes(user?.role);
  const isStudent = user?.role === 'student';

  const formatDateTime = (d) => (d ? new Date(d).toLocaleString() : '-');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Visitor Log</h2>
        <div className="flex items-center gap-2">
          {!isStudent && (
            <select
              value={checkedOutFilter}
              onChange={(e) => setCheckedOutFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 text-sm"
            >
              <option value="">All visitors</option>
              <option value="false">Currently inside</option>
              <option value="true">Checked out</option>
            </select>
          )}
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25"
            >
              + Log Visitor
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-xl border-2 border-emerald-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50/80 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-600">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visitor</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visiting</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-in</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Check-out</th>
                {canCheckOut && (
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {visitors.map((v) => (
                <tr key={v._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{v.visitorName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{v.visitorPhone || '-'}</p>
                    {v.relation && <p className="text-xs text-slate-500 dark:text-slate-400">Relation: {v.relation}</p>}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{v.studentId?.name || '-'}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{formatDateTime(v.checkInAt)}</td>
                  <td className="px-6 py-4">
                    {v.checkOutAt ? (
                      <span className="text-slate-600 dark:text-slate-300">{formatDateTime(v.checkOutAt)}</span>
                    ) : (
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">Inside</span>
                    )}
                  </td>
                  {canCheckOut && (
                    <td className="px-6 py-4 text-right">
                      {!v.checkOutAt && (
                        <button
                          onClick={() => handleCheckOut(v)}
                          className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-sm font-semibold"
                        >
                          Check out
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
          <div className="flex justify-center gap-2 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 font-semibold text-sm"
            >
              Prev
            </button>
            <span className="px-3 py-1 text-slate-600 dark:text-slate-300">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 font-semibold text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Log Visitor</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isStudent && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Visiting Student</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Visitor Name</label>
                <input
                  value={form.visitorName}
                  onChange={(e) => setForm((f) => ({ ...f, visitorName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone (optional)</label>
                <input
                  type="tel"
                  value={form.visitorPhone}
                  onChange={(e) => setForm((f) => ({ ...f, visitorPhone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Relation (optional)</label>
                <input
                  value={form.relation}
                  onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                  placeholder="e.g. Parent, Sibling"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Purpose (optional)</label>
                <input
                  value={form.purpose}
                  onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
                  placeholder="e.g. Meeting, Delivery"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/25">Log Visitor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
