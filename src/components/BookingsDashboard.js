import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

const BookingsDashboard = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'https://serva-backend.onrender.com';

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/bookings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setBookings(data.bookings || []);
        } else {
          setFetchError(data.message || 'Failed to load bookings');
        }
      } catch {
        setFetchError('Network error. Please refresh to try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchBookings();
  }, [token, API_URL]);

  const renderTechnician = (tech) => {
    if (!tech) return 'Pending Assignment';
    if (typeof tech === 'string') return `ID: ${tech.substring(0, 8)}...`;
    if (typeof tech === 'object' && tech.firstName) return `${tech.firstName} ${tech.lastName}`;
    return 'Unknown';
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking history?')) return;
    try {
      const response = await fetch(`${API_URL}/api/v1/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setBookings((prev) => prev.filter((b) => b._id !== id));
      } else {
        alert('Failed to delete booking');
      }
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display font-semibold text-xl text-ink mb-6">Past Bookings</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SkeletonLoader variant="booking-card" count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-surface p-6 md:p-8 flex items-center justify-center">
        <div className="error-banner">
          <strong>Error:</strong> {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-xl text-ink mb-2">Past Bookings</h1>
          <p className="text-ink-muted">View your repair history and digital warranties</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking._id || booking.bookingId}
              booking={booking}
              onDelete={handleDelete}
              renderTechnician={renderTechnician}
              token={token}
              apiUrl={API_URL}
            />
          ))}
        </div>

        {bookings.length === 0 && !loading && (
          <div className="border-2 border-dashed border-edge rounded-sharp py-20 text-center">
            <div className="flex justify-center mb-4 text-ink-faint">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-ink mb-2">No bookings found</h3>
            <p className="text-ink-muted">You haven't made any bookings yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onDelete, renderTechnician, token, apiUrl }) => {
  const [isModalOpen,         setIsModalOpen]         = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isFetching,          setIsFetching]          = useState(false);
  const [certError,           setCertError]           = useState(null);

  const [CertificateModal, setCertificateModal] = useState(null);
  useEffect(() => {
    import('./CertificateModal').then((m) => setCertificateModal(() => m.default));
  }, []);

  const handleViewCertificate = async () => {
    if (isFetching) return;
    setIsFetching(true);
    setCertError(null);

    try {
      const response = await fetch(
        `${apiUrl}/api/v1/bookings/${booking._id}/certificate`,
        { headers: { 'Authorization': `Bearer ${token}` } },
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setSelectedCertificate(data.certificate);
        setIsModalOpen(true);
      } else {
        setCertError(data.message || 'Could not load certificate.');
      }
    } catch {
      setCertError('Network error. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
  };

  const getDeviceSvg = (type) => {
    if (type === 'smartphone') {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      );
    }
    if (type === 'laptop') {
      return (
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <rect x="3" y="4" width="18" height="12" rx="2" ry="2" />
          <path d="M2 20h20" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  };

  const statusKey = booking.status?.toLowerCase() || 'pending';
  const getBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'badge badge-completed';
      case 'in-progress': return 'badge badge-progress';
      case 'confirmed': return 'badge badge-confirmed';
      default: return 'badge badge-pending';
    }
  };

  const STATUS_LABELS = {
    pending:       'Pending',
    confirmed:     'Confirmed',
    'in-progress': 'In Progress',
    completed:     'Completed',
  };
  
  const statusClass = getBadgeClass(statusKey);
  const statusText  = STATUS_LABELS[statusKey] || booking.status || 'Pending';

  return (
    <>
      <div className="card p-6 hover:border-copper/25 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-copper bg-copper/10 px-3 py-1 rounded-sharp flex items-center gap-2 label-mono">
              {getDeviceSvg(booking.deviceType?.toLowerCase())}
              {booking.deviceType ? booking.deviceType.toUpperCase() : 'UNKNOWN'}
            </span>
          </div>
          <div className="text-right">
            <button
              onClick={() => onDelete(booking._id)}
              className="text-err hover:text-err/80 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mb-2">
          <div className="font-data text-xs text-ink-faint mb-1">{booking.bookingId || booking._id}</div>
          <h3 className="font-sans font-medium text-lg text-ink">{booking.issue || 'No issue specified'}</h3>
        </div>

        <div className="mb-4">
          <span className={statusClass}>
            {statusText}
          </span>
        </div>

        <div className="space-y-1 mb-4">
          <div className="text-ink-muted text-sm flex justify-between">
            <span>Date:</span>
            <span>{booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}</span>
          </div>
          <div className="text-ink-muted text-sm flex justify-between">
            <span>Cost:</span>
            <span className="font-data text-copper">${booking.cost || 0}</span>
          </div>
          <div className="border-t border-edge pt-2 mt-2">
            <p className="text-xs text-ink-faint uppercase font-semibold mb-1">Technician</p>
            <span className="text-sm text-ink-muted">{renderTechnician(booking.technician)}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-edge flex justify-between items-center">
          <Link to={`/track?id=${booking.bookingId || booking._id}`} className="text-copper text-sm hover:underline">
            Track Status
          </Link>

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleViewCertificate}
              disabled={isFetching}
              className={`btn-ghost text-sm py-1.5 px-3 ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFetching ? 'Generating…' : 'View Certificate'}
            </button>
            {certError && (
              <p className="text-xs text-err max-w-[160px] text-right">{certError}</p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && CertificateModal && selectedCertificate && (
        <CertificateModal certificate={selectedCertificate} onClose={closeModal} />
      )}
    </>
  );
};

export default BookingsDashboard;
