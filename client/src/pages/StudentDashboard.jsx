import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feesApi, complaintsApi, allotmentsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fees, setFees] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [allotment, setAllotment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [fRes, cRes, aRes] = await Promise.all([
          feesApi.getAll({ limit: 5 }),
          complaintsApi.getAll({ limit: 5 }),
          allotmentsApi.getAll({ limit: 1 }),
        ]);
        setFees(fRes.data.data || []);
        setComplaints(cRes.data.data || []);
        const allotments = aRes.data.data || [];
        setAllotment(allotments[0] || null);
      } catch {
        setFees([]);
        setComplaints([]);
        setAllotment(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const pendingFees = fees.filter((f) => f.status === 'pending' || f.status === 'overdue').length;
  const openComplaints = complaints.filter((c) => c.status !== 'resolved' && c.status !== 'closed').length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">My Room</p>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {allotment ? `${allotment.roomId?.roomNumber || 'N/A'} · ${allotment.roomId?.hostelId?.name || 'Hostel'}` : 'Not allotted'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Pending Fees</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{pendingFees}</p>
          <Link to="/student/fees" className="text-sm text-emerald-600 hover:text-emerald-700 mt-1 inline-block">
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-sm text-gray-500">Open Complaints</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{openComplaints}</p>
          <Link to="/student/complaints" className="text-sm text-emerald-600 hover:text-emerald-700 mt-1 inline-block">
            View all →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Fees</h2>
            <Link to="/student/fees" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {fees.slice(0, 5).map((f) => (
              <div key={f._id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium text-gray-900">{f.description || 'Fee'}</p>
                  <p className="text-xs text-gray-500">₹{f.amount} · {f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                  f.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {f.status}
                </span>
              </div>
            ))}
            {fees.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">No fees</div>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">My Complaints</h2>
            <Link to="/student/complaints" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {complaints.slice(0, 5).map((c) => (
              <div key={c._id} className="flex items-center justify-between px-5 py-3">
                <p className="font-medium text-gray-900 truncate flex-1">{c.title || c.description || 'Complaint'}</p>
                <span className={`px-2 py-1 rounded text-xs font-medium shrink-0 ml-2 ${
                  c.status === 'resolved' || c.status === 'closed' ? 'bg-emerald-100 text-emerald-700' :
                  c.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
            {complaints.length === 0 && <div className="px-5 py-8 text-center text-gray-500 text-sm">No complaints</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
