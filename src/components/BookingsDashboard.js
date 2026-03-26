import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
      // silent – delete errors are non-critical
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800 text-sm">
          <strong>Error:</strong> {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Past Bookings</h1>
        <p className="text-gray-600">View your repair history and digital warranties</p>
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
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
          <p className="text-gray-600">You haven't made any bookings yet.</p>
        </div>
      )}
    </div>
  );
};

// ─── BookingCard ──────────────────────────────────────────────────────────────
// Each card owns its certificate fetch state so only the clicked card shows
// a spinner and sibling cards are never forced to re-render.

const BookingCard = ({ booking, onDelete, renderTechnician, token, apiUrl }) => {
  const [isModalOpen,         setIsModalOpen]         = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isFetching,          setIsFetching]          = useState(false);
  const [certError,           setCertError]           = useState(null);

  // Lazy-load the modal component so its bundle is only parsed on first use.
  const [CertificateModal, setCertificateModal] = useState(null);
  useEffect(() => {
    import('./CertificateModal').then((m) => setCertificateModal(() => m.default));
  }, []);

  const handleViewCertificate = async () => {
    if (isFetching) return; // Guard against double-click

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

  const deviceIcon =
    booking.deviceType?.toLowerCase() === 'smartphone' ? '📱'
    : booking.deviceType?.toLowerCase() === 'laptop'   ? '💻'
    : booking.deviceType?.toLowerCase() === 'tablet'   ? '📱'
    : '🔧';

  const STATUS_STYLES = {
    pending:       'bg-yellow-100 text-yellow-800',
    confirmed:     'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    completed:     'bg-green-100 text-green-800',
  };
  const STATUS_LABELS = {
    pending:       'Pending',
    confirmed:     'Confirmed',
    'in-progress': 'In Progress',
    completed:     'Completed',
  };
  const statusKey   = booking.status?.toLowerCase();
  const statusClass = STATUS_STYLES[statusKey] || 'bg-gray-100 text-gray-800';
  const statusText  = STATUS_LABELS[statusKey] || booking.status || 'Pending';

  return (
    <>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="p-6">

          {/* ── Card header ─────────────────────────────────────────── */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{deviceIcon}</span>
              <div>
                <h3 className="font-semibold text-gray-900">{booking.bookingId || booking._id}</h3>
                <p className="text-sm text-gray-600">
                  {booking.deviceType
                    ? booking.deviceType.charAt(0).toUpperCase() + booking.deviceType.slice(1)
                    : 'Unknown Device'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '—'}
              </div>
              <div className="text-lg font-semibold text-gray-900">${booking.cost || 0}</div>
              <button
                onClick={() => onDelete(booking._id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
              >
                Delete
              </button>
            </div>
          </div>

          {/* ── Status badge ─────────────────────────────────────────── */}
          <div className="mb-4">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
              {statusText}
            </span>
          </div>

          {/* ── Issue ────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Issue</div>
            <div className="text-gray-900">{booking.issue || 'No issue specified'}</div>
          </div>

          {/* ── Technician ───────────────────────────────────────────── */}
          <div className="border-t pt-4 mt-4">
            <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Technician</p>
            <span className="text-sm text-gray-700">{renderTechnician(booking.technician)}</span>
          </div>

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <Link to="/track" className="text-blue-600 text-sm hover:underline">
              Track Status
            </Link>

            <div className="flex flex-col items-end gap-1">
              {/*
                Certificate button – replaces the raw <a href> that dumped JSON
                in a new tab. Fetches the JSON payload, then opens the modal.
              */}
              <button
                onClick={handleViewCertificate}
                disabled={isFetching}
                className={`text-sm font-medium transition-colors ${
                  isFetching
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-500 hover:text-blue-600'
                }`}
              >
                {isFetching ? (
                  <span className="flex items-center gap-1">
                    <svg
                      className="animate-spin h-3.5 w-3.5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating…
                  </span>
                ) : (
                  '🏅 View Certificate'
                )}
              </button>

              {/* Inline API error — scoped to this card only */}
              {certError && (
                <p className="text-xs text-red-500 max-w-[160px] text-right">{certError}</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modal — rendered next to the card, isolated per-card */}
      {isModalOpen && CertificateModal && selectedCertificate && (
        <CertificateModal certificate={selectedCertificate} onClose={closeModal} />
      )}
    </>
  );
};

export default BookingsDashboard;
