import { Outlet, useLocation } from 'react-router-dom';
import WardenSidebar from './WardenSidebar';
import Header from './Header';

const titles = {
  '/warden': 'Dashboard',
  '/warden/announcements': 'Announcements',
  '/warden/hostels': 'Hostels',
  '/warden/rooms': 'Rooms',
  '/warden/allotments': 'Allotments',
  '/warden/fees': 'Fees',
  '/warden/complaints': 'Complaints',
  '/warden/leaves': 'Leaves',
  '/warden/visitors': 'Visitors',
  '/warden/settings': 'Settings',
};

export default function WardenLayout() {
  const { pathname } = useLocation();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] dark:bg-slate-900">
      <WardenSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          {!['/warden/complaints', '/warden/fees', '/warden/allotments', '/warden/settings', '/warden/announcements', '/warden/leaves', '/warden/visitors'].includes(pathname) && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{titles[pathname] || 'Dashboard'}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Today is {dateStr}</p>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
