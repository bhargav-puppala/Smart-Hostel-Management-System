import { useState, useEffect } from 'react';
import { statsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Icon = ({ children, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {children}
  </svg>
);

const reportIcons = {
  hostels: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  rooms: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  students: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  allotments: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />,
  revenue: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  pending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  overdue: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
  complaints: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  resolved: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

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
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <p className="text-gray-500 dark:text-slate-400">You don&apos;t have access to reports.</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-8">
        <p className="text-gray-500 dark:text-slate-400">Failed to load reports.</p>
      </div>
    );
  }

  const cards = [
    { label: 'Hostels', value: stats.hostels, color: 'emerald', iconKey: 'hostels' },
    { label: 'Total Rooms', value: stats.rooms, color: 'blue', iconKey: 'rooms' },
    { label: 'Students', value: stats.students, color: 'violet', iconKey: 'students' },
    { label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, color: 'amber', iconKey: 'chart' },
    { label: 'Active Allotments', value: stats.activeAllotments, color: 'teal', iconKey: 'allotments' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue?.toLocaleString() || 0}`, color: 'green', iconKey: 'revenue' },
    { label: 'Pending Fees', value: stats.pendingFees, color: 'orange', iconKey: 'pending' },
    { label: 'Overdue Fees', value: stats.overdueFees, color: 'red', iconKey: 'overdue' },
    { label: 'Open Complaints', value: stats.openComplaints, color: 'amber', iconKey: 'complaints' },
    { label: 'Resolved Complaints', value: stats.resolvedComplaints + stats.closedComplaints, color: 'emerald', iconKey: 'resolved' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-slate-400 shrink-0">
                <Icon>{reportIcons[c.iconKey]}</Icon>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{c.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{c.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Fee Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Paid</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.paidFees} fees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Pending</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{stats.pendingFees} fees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Overdue</span>
              <span className="font-medium text-red-600 dark:text-red-400">{stats.overdueFees} fees</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Complaint Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Open / In Progress</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{stats.openComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-slate-400">Resolved / Closed</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{stats.resolvedComplaints + stats.closedComplaints}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
