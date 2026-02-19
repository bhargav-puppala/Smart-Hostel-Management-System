import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import AdminLayout from './components/Layout/AdminLayout';
import WardenLayout from './components/Layout/WardenLayout';
import StudentLayout from './components/Layout/StudentLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import PendingWardenDashboard from './pages/PendingWardenDashboard';
import Dashboard from './pages/Dashboard';
import StudentDashboard from './pages/StudentDashboard';
import Hostels from './pages/Hostels';
import Rooms from './pages/Rooms';
import Users from './pages/Users';
import Fees from './pages/Fees';
import Complaints from './pages/Complaints';
import Allotments from './pages/Allotments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Announcements from './pages/Announcements';
import Leaves from './pages/Leaves';
import Visitors from './pages/Visitors';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) {
    const redirect = user.role === 'admin' ? '/admin' : user.role === 'warden' || user.role === 'accountant' ? '/warden' : '/student';
    return <Navigate to={redirect} replace />;
  }
  return children;
}

function WardenOrPending() {
  const { user } = useAuth();
  const isPendingWarden = user?.role === 'warden' && user?.approvalStatus === 'pending';
  if (isPendingWarden) return <PendingWardenDashboard />;
  return <WardenLayout />;
}

function getDefaultPath(role) {
  if (role === 'admin') return '/admin';
  if (role === 'warden' || role === 'accountant') return '/warden';
  if (role === 'student') return '/student';
  return '/admin';
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']} fallbackPath="/warden">
              <AdminLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="users" element={<Users />} />
        <Route path="hostels" element={<Hostels />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="allotments" element={<Allotments />} />
        <Route path="fees" element={<Fees />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Warden panel: pending wardens see sample dashboard, approved see full panel */}
      <Route
        path="/warden"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['warden', 'accountant']}>
              <WardenOrPending />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="hostels" element={<Hostels />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="allotments" element={<Allotments />} />
        <Route path="fees" element={<Fees />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Student panel */}
      <Route
        path="/student"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['student']} fallbackPath="/admin">
              <StudentLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="fees" element={<Fees />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Root: Landing for guests, redirect to dashboard for logged-in users */}
      <Route path="/" element={<RootRoute />} />
      <Route path="*" element={<NavigateToRole />} />
    </Routes>
  );
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }
  if (user) return <Navigate to={getDefaultPath(user.role)} replace />;
  return <Landing />;
}

function NavigateToRole() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={getDefaultPath(user.role)} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
