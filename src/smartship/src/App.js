import './App.css';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminShell from './components/AdminShell';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ShipmentWizardPage from './pages/ShipmentWizardPage';
import TrackingPage from './pages/TrackingPage';
import LandingPage from './pages/LandingPage';
import ShipmentDetailsPage from './pages/ShipmentDetailsPage';
import ProfilePage from './pages/ProfilePage';

// Admin sub-pages (live inside AdminShell)
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminShipmentsPage from './pages/admin/AdminShipmentsPage';
import AdminExceptionsPage from './pages/admin/AdminExceptionsPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminHubsPage from './pages/admin/AdminHubsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// ── User NavBar (hidden on landing + all /admin/* routes) ────────────────────
const NavBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  // Hide on landing page and the entire admin area
  if (location.pathname === '/' || location.pathname.startsWith('/admin')) return null;

  return (
    <header className="topbar">
      <Link className="brand" to={isAuthenticated ? '/dashboard' : '/'}>SmartShip</Link>
      <nav className="row gap">
        {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        {isAuthenticated && <Link to="/wizard">New Shipment</Link>}
        {isAuthenticated && <Link to="/tracking">Tracking</Link>}
        {isAuthenticated && <Link to="/profile">Profile</Link>}
        {!isAuthenticated && <Link to="/login">Login</Link>}
        {!isAuthenticated && <Link to="/register">Register</Link>}
        {isAuthenticated && <button className="button tiny" onClick={logout}>Logout</button>}
      </nav>
    </header>
  );
};

// ── App shell — resolves layout per route ────────────────────────────────────
const AppShell = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAdmin   = location.pathname.startsWith('/admin');

  return (
    <div className={isAdmin ? '' : 'app-shell'}>
      <NavBar />
      <main className={isLanding || isAdmin ? '' : 'main'}>
        <Routes>
          {/* Public */}
          <Route path="/"         element={<LandingPage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User-only protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wizard"    element={<ShipmentWizardPage />} />
            <Route path="/tracking"  element={<TrackingPage />} />
            <Route path="/shipments/:id" element={<ShipmentDetailsPage />} />
            <Route path="/profile"       element={<ProfilePage />} />
          </Route>

          {/* Admin-only routes — wrapped in AdminShell sidebar layout */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminShell />}>
              <Route path="/admin"            element={<AdminDashboard />} />
              <Route path="/admin/shipments"  element={<AdminShipmentsPage />} />
              <Route path="/admin/exceptions" element={<AdminExceptionsPage />} />
              <Route path="/admin/users"      element={<AdminUsersPage />} />
              <Route path="/admin/hubs"       element={<AdminHubsPage />} />
              <Route path="/admin/reports"    element={<AdminReportsPage />} />
            </Route>
          </Route>

          {/* Catch-all → landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
