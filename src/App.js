import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import BookingWizard from './components/BookingWizard';
import TechnicianDashboard from './components/TechnicianDashboard';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import BookingsDashboard from './components/BookingsDashboard';
import HomePage from './components/HomePage';
import TrackPage from './components/TrackPage';
import SuccessPage from './components/SuccessPage';
import ProfilePage from './components/ProfilePage';
import TechnicianSignup from './components/TechnicianSignup';
import TechnicianJobs from './components/TechnicianJobs';

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Serva Digital Repair Services - v2.1.3
  // Last Updated: 2026-02-03 20:15
  // Don't show navigation on auth pages AND technician signup
  if (location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/partner-signup') {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-brand hover:text-opacity-80 transition-colors">
              Serva
            </Link>
          </div>
          <div className="hidden md:flex space-x-8">
            {/* Role is sourced exclusively from AuthContext – no localStorage fallback */}
            {isAuthenticated && user?.role === 'technician' ? (
              <>
                {/* Technicians: Job Feed is the primary anchor; no redundant Home link */}
                <Link to="/technician-dashboard" className="text-blue-600 font-bold hover:text-blue-800">Job Feed</Link>
                <Link to="/my-jobs" className="text-gray-600 hover:text-blue-600 font-medium">My Accepted Jobs</Link>
              </>
            ) : (
              <>
                <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Home</Link>
                <Link to="/book" className="text-gray-600 hover:text-blue-600 font-medium">Book Service</Link>
                <Link to="/bookings" className="text-gray-600 hover:text-blue-600 font-medium">My Bookings</Link>
                <Link to="/track" className="text-gray-600 hover:text-blue-600 font-medium">Track Repair</Link>
              </>
            )}
            
            {/* Profile Link (Always Visible) */}
            <Link to="/profile">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/partner-signup" element={<TechnicianSignup />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/success" element={<SuccessPage />} />
            
            {/* Protected routes */}
            <Route path="/book" element={
              <ProtectedRoute>
                <BookingWizard />
              </ProtectedRoute>
            } />
            <Route path="/bookings" element={
              <ProtectedRoute>
                <BookingsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            {/* Technician-only routes – customers are redirected to '/' */}
            <Route path="/technician" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/technician-dashboard" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            } />
            <Route path="/my-jobs" element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianJobs />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
