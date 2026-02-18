import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const titles = {
  '/': 'Dashboard',
  '/hostels': 'Hostels',
  '/rooms': 'Rooms',
  '/allotments': 'Allotments',
  '/users': 'Users',
  '/fees': 'Fees',
  '/complaints': 'Inbox',
  '/reports': 'Report',
  '/settings': 'Setting',
};

export default function MainLayout() {
  const { pathname } = useLocation();
  const today = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateStr = today.toLocaleDateString('en-US', options);

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header />
        <div className="flex-1 p-6 overflow-auto">
          {!['/complaints', '/fees', '/users', '/allotments', '/reports', '/settings'].includes(pathname) && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">{titles[pathname] || 'Dashboard'}</h1>
              <p className="text-sm text-gray-500 mt-0.5">Today is {dateStr}</p>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
