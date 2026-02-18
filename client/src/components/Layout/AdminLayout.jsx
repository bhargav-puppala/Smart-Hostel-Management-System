import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Header from './Header';

const titles = {
  '/admin': 'Dashboard',
  '/admin/announcements': 'Announcements',
  '/admin/users': 'Users',
  '/admin/hostels': 'Hostels',
  '/admin/rooms': 'Rooms',
  '/admin/allotments': 'Allotments',
  '/admin/fees': 'Fees',
  '/admin/complaints': 'Complaints',
  '/admin/leaves': 'Leaves',
  '/admin/visitors': 'Visitors',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const { pathname } = useLocation();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] dark:bg-slate-900">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          {!['/admin/complaints', '/admin/fees', '/admin/users', '/admin/allotments', '/admin/reports', '/admin/settings', '/admin/announcements', '/admin/leaves', '/admin/visitors'].includes(pathname) && (
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
