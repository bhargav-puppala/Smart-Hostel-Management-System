import { useState, useEffect } from 'react';
import { statsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await statsApi.get();
        setStats(res.data.data);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    if (['admin', 'warden', 'accountant'].includes(user?.role)) {
      load();
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!['admin', 'warden', 'accountant'].includes(user?.role)) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-500">You don&apos;t have access to reports.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <p className="text-gray-500">Failed to load reports.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Hostels', value: stats.hostels, color: 'emerald', icon: '🏠' },
    { label: 'Total Rooms', value: stats.rooms, color: 'blue', icon: '🚪' },
    { label: 'Students', value: stats.students, color: 'violet', icon: '👥' },
    { label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, color: 'amber', icon: '📊' },
    { label: 'Active Allotments', value: stats.activeAllotments, color: 'teal', icon: '🛏️' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString() || 0}`, color: 'green', icon: '💰' },
    { label: 'Pending Fees', value: stats.pendingFees, color: 'orange', icon: '⏳' },
    { label: 'Overdue Fees', value: stats.overdueFees, color: 'red', icon: '⚠️' },
    { label: 'Open Complaints', value: stats.openComplaints, color: 'amber', icon: '📝' },
    { label: 'Resolved Complaints', value: stats.resolvedComplaints + stats.closedComplaints, color: 'emerald', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <p className="text-sm text-gray-500 font-medium">{c.label}</p>
                <p className="text-xl font-bold text-gray-900">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Fee Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-medium text-emerald-600">{stats.paidFees} fees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-amber-600">{stats.pendingFees} fees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Overdue</span>
              <span className="font-medium text-red-600">{stats.overdueFees} fees</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Complaint Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Open / In Progress</span>
              <span className="font-medium text-amber-600">{stats.openComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolved / Closed</span>
              <span className="font-medium text-emerald-600">{stats.resolvedComplaints + stats.closedComplaints}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
