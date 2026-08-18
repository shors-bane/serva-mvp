import React, { useEffect } from 'react';
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
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';

// ScrollToTop component ensures page scrolls to top on navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Navigation component
const Navigation = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  
  // Don't show navigation on auth pages AND technician signup (and homepage, which has its own transparent nav)
  if (['/login', '/signup', '/partner-signup', '/'].includes(location.pathname)) {
    return null;
  }

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="bg-void border-b border-edge sticky top-0 z-50 w-full backdrop-blur-md bg-void/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-display font-semibold text-copper tracking-tight">
              Serva
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated && user?.role === 'technician' ? (
              <>
                <Link to="/technician-dashboard" className="nav-link font-medium">Job Feed</Link>
                <Link to="/my-jobs" className="nav-link font-medium">My Accepted Jobs</Link>
              </>
            ) : (
              <>
                <Link to="/book" className="nav-link font-medium">Book Service</Link>
                <Link to="/bookings" className="nav-link font-medium">My Bookings</Link>
                <Link to="/track" className="nav-link font-medium">Track Repair</Link>
              </>
            )}
            
            {/* Profile Link */}
            {isAuthenticated ? (
              <Link to="/profile" className="ml-4 flex items-center justify-center w-9 h-9 rounded-full bg-copper/10 border border-copper/30 text-copper font-display font-bold hover:bg-copper/20 transition-colors">
                {user?.firstName?.charAt(0) || 'U'}
              </Link>
            ) : (
              <Link to="/login" className="ml-4 glass px-5 py-2 rounded-full text-sm font-medium text-ink hover:bg-white/10 transition-colors">
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="glass p-2 rounded-full text-ink focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-surface-raised border-b border-edge shadow-xl z-50">
          <div className="px-4 py-6 flex flex-col space-y-4">
            {isAuthenticated && user?.role === 'technician' ? (
              <>
                <Link to="/technician-dashboard" onClick={closeMenu} className="text-ink text-lg font-medium">Job Feed</Link>
                <Link to="/my-jobs" onClick={closeMenu} className="text-ink text-lg font-medium">My Accepted Jobs</Link>
              </>
            ) : (
              <>
                <Link to="/book" onClick={closeMenu} className="text-ink text-lg font-medium">Book Service</Link>
                <Link to="/bookings" onClick={closeMenu} className="text-ink text-lg font-medium">My Bookings</Link>
                <Link to="/track" onClick={closeMenu} className="text-ink text-lg font-medium">Track Repair</Link>
              </>
            )}
            
            <hr className="border-edge my-2" />
            
            {isAuthenticated ? (
              <Link to="/profile" onClick={closeMenu} className="text-copper font-medium flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-copper/10 border border-copper/30 text-copper font-display font-bold">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                My Profile
              </Link>
            ) : (
              <Link to="/login" onClick={closeMenu} className="text-copper font-medium">Sign in</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen bg-surface text-ink font-sans">
          <Navigation />
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/partner-signup" element={<TechnicianSignup />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/success" element={<SuccessPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            
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
