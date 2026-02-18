import { Outlet, useLocation } from 'react-router-dom';
import StudentSidebar from './StudentSidebar';
import Header from './Header';

const titles = {
  '/student': 'Dashboard',
  '/student/announcements': 'Notices',
  '/student/fees': 'My Fees',
  '/student/complaints': 'My Complaints',
  '/student/leaves': 'Leave / Outpass',
  '/student/visitors': 'My Visitors',
  '/student/settings': 'Settings',
};

export default function StudentLayout() {
  const { pathname } = useLocation();
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-[#f5f6f8] dark:bg-slate-900">
      <StudentSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          {!['/student/fees', '/student/complaints', '/student/settings', '/student/announcements', '/student/leaves', '/student/visitors'].includes(pathname) && (
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
