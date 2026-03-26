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

  // 🛡️ SAFETY FUNCTION: This prevents the crash.
  const renderTechnician = (tech) => {
    if (!tech) return "Pending Assignment";
    if (typeof tech === 'string') return `ID: ${tech.substring(0, 8)}...`;
    if (typeof tech === 'object' && tech.firstName) {
      return `${tech.firstName} ${tech.lastName}`;
    }
    return "Unknown";
  };

  // Delete booking function
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking history?')) return;
    try {
      const response = await fetch(`https://serva-backend.onrender.com/api/v1/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      if (response.ok) {
        // Remove from local state immediately
        setBookings(bookings.filter(b => b._id !== id));
      } else {
        alert('Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting:', error);
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Past Bookings</h1>
        <p className="text-gray-600">View your repair history and digital warranties</p>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <div key={booking._id || booking.bookingId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {booking.deviceType?.toLowerCase() === 'smartphone' ? '📱' : 
                     booking.deviceType?.toLowerCase() === 'laptop' ? '💻' : 
                     booking.deviceType?.toLowerCase() === 'tablet' ? '📱' : '🔧'}
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.bookingId || booking._id}</h3>
                    <p className="text-sm text-gray-600">
                      {booking.deviceType ? booking.deviceType.charAt(0).toUpperCase() + booking.deviceType.slice(1) : 'Unknown Device'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Invalid Date'}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">${booking.cost || 0}</div>
                  <button
                    onClick={() => handleDelete(booking._id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium mt-1"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  !booking.status ? 'bg-gray-100 text-gray-800' :
                  booking.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  booking.status.toLowerCase() === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  booking.status.toLowerCase() === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                  booking.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {!booking.status ? 'Pending' : 
                   booking.status.toLowerCase() === 'pending' ? 'Pending' :
                   booking.status.toLowerCase() === 'confirmed' ? 'Confirmed' :
                   booking.status.toLowerCase() === 'in-progress' ? 'In Progress' :
                   booking.status.toLowerCase() === 'completed' ? 'Completed' :
                   booking.status}
                </span>
              </div>

              {/* Issue */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Issue Fixed</div>
                <div className="text-gray-900">{booking.issue || 'No issue specified'}</div>
              </div>

              {/* Technician */}
              <div className="border-t pt-4 mt-4">
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Technician</p>
                {/* CALL THE SAFETY FUNCTION */}
                <span className="text-sm text-gray-700">
                  {renderTechnician(booking.technician)}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <Link to="/track" className="text-blue-600 text-sm hover:underline">Track Status</Link>
                {/* Use API_URL so this works in all environments (local dev + production) */}
                <a 
                  href={`${API_URL}/api/v1/bookings/${booking._id}/certificate`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-gray-500 text-sm hover:text-blue-600"
                >
                  View Certificate
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
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

export default BookingsDashboard;
