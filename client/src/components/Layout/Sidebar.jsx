import { NavLink } from 'react-router-dom';
import Logo from '../ui/Logo';

const icons = {
  dashboard: (
    <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
  ),
  inbox: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  hostels: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  rooms: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  allotments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  fees: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

export default function Sidebar() {
  return (
    <aside className="w-[240px] min-h-screen flex flex-col shrink-0 bg-[#1e2329]">
      <div className="p-5 flex items-center gap-2">
        <button className="p-1.5 rounded hover:bg-white/10 text-white/80">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo className="w-7 h-7 rounded shrink-0" />
        <span className="font-bold text-white text-lg">HOSTLR</span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <div className="mb-4">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-colors ${
                isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {icons.dashboard}
            <span className="font-medium">Dashboard</span>
          </NavLink>
          <NavLink
            to="/complaints"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-colors ${
                isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {icons.inbox}
            <span className="font-medium">Inbox</span>
          </NavLink>
          <NavLink
            to="/fees"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-colors ${
                isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            {icons.calendar}
            <span className="font-medium">Calendar & Todos</span>
          </NavLink>
        </div>

        <p className="px-3 py-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Hostel Management</p>
        <div className="mb-4">
          {[
            { to: '/hostels', icon: 'hostels', label: 'Hostels' },
            { to: '/rooms', icon: 'rooms', label: 'Rooms' },
            { to: '/allotments', icon: 'allotments', label: 'Allotments' },
            { to: '/fees', icon: 'fees', label: 'Fees' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-colors ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {icons[item.icon]}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <p className="px-3 py-1.5 text-[10px] font-semibold text-white/50 uppercase tracking-wider">Organization</p>
        <div>
          {[
            { to: '/users', icon: 'users', label: 'Employee' },
            { to: '/reports', icon: 'reports', label: 'Report' },
            { to: '/settings', icon: 'settings', label: 'Setting' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded mb-1 transition-colors ${
                  isActive ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {icons[item.icon]}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t border-white/10">
        <button className="w-full py-2.5 px-4 rounded-lg bg-[#2d3339] hover:bg-[#363d44] text-white font-medium text-sm transition-colors">
          Need Help?
        </button>
        <p className="text-white/40 text-[11px] mt-3 text-center">©2025 Hostlr</p>
      </div>
    </aside>
  );
}
