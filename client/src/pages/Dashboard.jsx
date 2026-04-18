import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { hostelsApi, roomsApi, statsApi } from '../services/api';

const pillColors = [
  'bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300',
  'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300',
];

export default function Dashboard() {
  const { pathname } = useLocation();
  const base = pathname.startsWith('/admin') ? '/admin' : pathname.startsWith('/warden') ? '/warden' : '/';
  const [rooms, setRooms] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [roomStats, setRoomStats] = useState({ available: 0, full: 0, maintenance: 0, total: 0 });
  const [bookingStats, setBookingStats] = useState({ pendingBookings: 0, approvedBookings: 0, occupiedBookings: 0, pendingPayments: 0, paidPayments: 0 });
  const [occupancyStats, setOccupancyStats] = useState({ totalBeds: 0, occupiedBeds: 0, vacantBeds: 0, occupancyRate: 0, highOccupancy: false });
  const [loading, setLoading] = useState(true);
  const [hostelFilter, setHostelFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [hRes, rRes, sRes] = await Promise.all([
          hostelsApi.getAll({ limit: 100 }),
          roomsApi.getAll({ limit: 50 }),
          statsApi.get(),
        ]);
        const hostelsData = hRes.data.data || [];
        const roomsData = rRes.data.data || [];
        const statsData = sRes.data.data || {};
        setHostels(hostelsData);
        setRooms(roomsData);
        setBookingStats({
          pendingBookings: statsData.pendingBookings || 0,
          approvedBookings: statsData.approvedBookings || 0,
          occupiedBookings: statsData.occupiedBookings || 0,
          pendingPayments: statsData.pendingPayments || 0,
          paidPayments: statsData.paidPayments || 0,
        });
        setOccupancyStats({
          totalBeds: statsData.totalBeds || 0,
          occupiedBeds: statsData.occupiedBeds || 0,
          vacantBeds: statsData.vacantBeds || 0,
          occupancyRate: statsData.occupancyRate || 0,
          highOccupancy: Boolean(statsData.highOccupancy),
        });

        const available = roomsData.filter((x) => x.status === 'available').length;
        const full = roomsData.filter((x) => x.status === 'full').length;
        const maintenance = roomsData.filter((x) => x.status === 'maintenance').length;
        setRoomStats({ available, full, maintenance, total: roomsData.length });
      } catch {
        setRooms([]);
        setHostels([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredRooms = hostelFilter
    ? rooms.filter((r) => (r.hostelId?._id || r.hostelId) === hostelFilter)
    : rooms;

  const tasks = [
    { time: '09:00 - 10:00 AM', desc: 'Review pending fee payments', done: false },
    { time: '11:00 - 12:00 PM', desc: 'Interview with students for room allotment', done: false },
    { time: '02:00 - 03:00 PM', desc: 'Resolve complaint #12 - Water issue', done: false },
  ];

  const chartData = [
    { label: 'Available', value: roomStats.available, color: '#34d399' },
    { label: 'Full', value: roomStats.full, color: '#fbbf24' },
    { label: 'Maintenance', value: roomStats.maintenance, color: '#f472b6' },
    { label: 'Occupied', value: Math.max(0, roomStats.total - roomStats.available - roomStats.full - roomStats.maintenance), color: '#a78bfa' },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total Beds</p>
          <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{occupancyStats.totalBeds}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400">Occupied Beds</p>
          <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{occupancyStats.occupiedBeds}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <p className="text-sm text-gray-500 dark:text-slate-400">Vacant Beds</p>
          <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{occupancyStats.vacantBeds}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm text-gray-500 dark:text-slate-400">Occupancy</p>
            {occupancyStats.highOccupancy && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                High
              </span>
            )}
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{occupancyStats.occupancyRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rooms - like Hiring */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Rooms</h2>
            <div className="flex items-center gap-2">
              <select
                value={hostelFilter}
                onChange={(e) => setHostelFilter(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-200"
              >
                <option value="">All Hostels</option>
                {hostels.map((h) => (
                  <option key={h._id} value={h._id}>{h.name}</option>
                ))}
              </select>
              <select className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-200">
                <option>All</option>
              </select>
              <Link to={`${base}/rooms`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                VIEW ALL &gt;
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Rooms</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Available</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Occupied</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Maintenance</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase">Full</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.slice(0, 6).map((room, i) => (
                  <tr key={room._id} className="border-b border-gray-50 dark:border-slate-700">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-slate-100">{room.roomNumber}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{room.hostelId?.name || 'Hostel'} · Capacity {room.capacity}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${pillColors[i % pillColors.length]}`}>
                        {room.status === 'available' ? '1' : '0'} Room
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300">
                        {room.occupants?.length || 0} Beds
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${room.status === 'maintenance' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
                        {room.status === 'maintenance' ? '1' : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${room.status === 'full' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'}`}>
                        {room.status === 'full' ? '1' : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rooms Summary - Donut Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Rooms Summary</h2>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: chartData.length > 0
                    ? `conic-gradient(${chartData.map((d, i) => {
                        const pct = (d.value / roomStats.total) * 360;
                        const start = chartData.slice(0, i).reduce((s, x) => s + (x.value / roomStats.total) * 360, 0);
                        return `${d.color} ${start}deg ${start + pct}deg`;
                      }).join(', ')})`
                    : '#e5e7eb',
                }}
              />
              <div className="absolute inset-[15%] rounded-full bg-white dark:bg-slate-800 flex items-center justify-center ring-2 ring-white dark:ring-slate-800 ring-inset">
                <div className="text-center">
                  <span className="text-xl font-bold text-gray-900 dark:text-slate-100">{roomStats.total}</span>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">TOTAL ROOMS</p>
                </div>
              </div>
            </div>
            <div className="mt-4 w-full space-y-2">
              {[
                { label: 'Available', value: roomStats.available, color: 'bg-emerald-400' },
                { label: 'Full', value: roomStats.full, color: 'bg-amber-400' },
                { label: 'Maintenance', value: roomStats.maintenance, color: 'bg-pink-400' },
                { label: 'Occupied', value: Math.max(0, roomStats.total - roomStats.available - roomStats.full - roomStats.maintenance), color: 'bg-purple-400' },
              ].filter((d) => d.value > 0).map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.color}`} />
                    <span className="text-gray-600 dark:text-slate-400">{d.value} {d.label.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">Pending Bookings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{bookingStats.pendingBookings}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">Approved Bookings</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{bookingStats.approvedBookings}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">Occupied Beds</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{bookingStats.occupiedBookings}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">Pending Payments</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{bookingStats.pendingPayments}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
            <p className="text-sm text-gray-500 dark:text-slate-400">Paid Payments</p>
            <p className="text-xl font-bold text-gray-900 dark:text-slate-100 mt-1">{bookingStats.paidPayments}</p>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Task */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">My Task</h2>
            <div className="flex items-center gap-2">
              <select className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm bg-white dark:bg-slate-700 dark:text-slate-200">
                <option>Today</option>
              </select>
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-700 dark:text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Feb 18 - Nov 18
              </button>
              <button className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                ADD TASK
              </button>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
            {tasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                <svg className="w-4 h-4 text-gray-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-slate-400">{task.time}</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">{task.desc}</p>
                </div>
                <button className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-slate-600 hover:border-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Employee / Hostels */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Hostels</h2>
            <Link to={`${base}/hostels`} className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
              VIEW ALL &gt;
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
            {hostels.slice(0, 4).map((hostel) => (
              <div key={hostel._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                <div>
                  <p className="font-medium text-gray-900 dark:text-slate-100">{hostel.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">TOTAL ROOMS {hostel.totalRooms || 0}</p>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-slate-300">
                      {i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-slate-300">
                    +{Math.max(0, (hostel.totalRooms || 0) - 3)}
                  </div>
                </div>
              </div>
            ))}
            {hostels.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">No hostels yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
