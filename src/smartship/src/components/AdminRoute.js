import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * AdminRoute — guards /admin/* routes.
 * Redirects unauthenticated users to /login.
 * Redirects non-admin users back to /dashboard.
 * Renders the Outlet (AdminShell + sub-pages) for Admins.
 */
const AdminRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

export default AdminRoute;
