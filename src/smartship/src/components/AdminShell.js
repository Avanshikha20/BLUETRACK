import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminShell.css';

/**
 * AdminShell — the entire layout wrapper for the admin area.
 * Renders its own sidebar navbar; completely separate from the user app shell.
 */
const AdminShell = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`admin-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* ── SIDEBAR ── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="8" fill="#6366f1" />
              <path d="M8 15l7-7 7 7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20l7-7 7 7" stroke="rgba(255,255,255,0.45)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {sidebarOpen && <span className="admin-logo-text">SmartShip Admin</span>}
          </div>
          <button className="admin-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="admin-nav">
          <p className="admin-nav-label">{sidebarOpen && 'OVERVIEW'}</p>
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">📊</span>
            {sidebarOpen && <span>Dashboard</span>}
          </NavLink>

          <p className="admin-nav-label">{sidebarOpen && 'MANAGEMENT'}</p>
          <NavLink to="/admin/shipments" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">📦</span>
            {sidebarOpen && <span>All Shipments</span>}
          </NavLink>
          <NavLink to="/admin/exceptions" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">⚠️</span>
            {sidebarOpen && <span>Exceptions</span>}
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">👥</span>
            {sidebarOpen && <span>Users</span>}
          </NavLink>
          <NavLink to="/admin/hubs" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">🏢</span>
            {sidebarOpen && <span>Logistics Hubs</span>}
          </NavLink>
          <NavLink to="/admin/reports" className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
            <span className="admin-nav-icon">📈</span>
            {sidebarOpen && <span>Reports & Exports</span>}
          </NavLink>
        </nav>

        {/* User info + logout at bottom */}
        <div className="admin-sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-user-avatar">
              {user?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="admin-user-info">
                <span className="admin-user-email">{user?.email}</span>
                <span className="admin-user-role">Administrator</span>
              </div>
            )}
          </div>
          <button className="admin-logout-btn" onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="admin-content">
        <header className="admin-topbar">
          <div>
            <h1 className="admin-page-title">Admin Control Panel</h1>
            <p className="admin-page-sub">SmartShip · Administrator view</p>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-status-badge">🟢 System Online</div>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
