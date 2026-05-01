import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — guards user routes (/dashboard, /wizard, /tracking).
 * - Unauthenticated → /login
 * - Admin users → /admin  (admins have no business on user pages)
 * - Regular users → render Outlet
 */
const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Redirect admins away from user-only routes to their own panel
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
