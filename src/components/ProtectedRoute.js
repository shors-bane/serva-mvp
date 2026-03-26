import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute
 *
 * Props:
 *  - children       → The page component to render when access is granted.
 *  - allowedRoles   → Optional array of role strings (e.g. ['technician']).
 *                     If omitted, any authenticated user is allowed.
 *  - redirectTo     → Where to send unauthenticated visitors (default: /login).
 *
 * Architecture:
 *  1. While hydration is in flight (isLoading === true) we show a spinner so
 *     the router never makes an auth decision on stale/empty state.
 *  2. Unauthenticated users are redirected to /login WITH a `from` state so
 *     the login page can send them back after success.
 *  3. Authenticated users lacking the required role are sent to / with a clear
 *     `unauthorized` flag so the home page can show a toast if desired.
 */
const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ── 1. Hydration in progress ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  // ── 2. Not authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    // Preserve current location so the login page can redirect back after sign-in.
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // ── 3. Authenticated but wrong role ─────────────────────────────────────────
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" state={{ unauthorized: true }} replace />;
  }

  // ── 4. All checks passed ─────────────────────────────────────────────────────
  return children;
};

export default ProtectedRoute;
