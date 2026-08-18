import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

const TrackPage = () => {
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [bookingId, setBookingId] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const handleTrack = useCallback(async (idToTrack) => {
    const targetId = idToTrack || bookingId;
    if (!targetId) return;

    setIsLoading(true);
    setError(null);
    setTrackingResult(null);

    try {
      const response = await fetch(`https://serva-backend.onrender.com/api/v1/bookings/${targetId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setTrackingResult(data.booking);
      } else {
        setError(data.message || 'Booking not found. Please check the ID.');
      }
    } catch (err) {
      console.error('Tracking Error:', err);
      setError('Failed to connect to server. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    const urlId = searchParams.get('id');
    if (urlId) {
      setBookingId(urlId);
      handleTrack(urlId);
    }
  }, [searchParams, handleTrack]);

  return (
    <div className="min-h-screen bg-surface px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-center text-ink mb-8 mt-16">Track Your Repair</h1>

      {/* Search Bar */}
      <div className="flex gap-4 mb-8 max-w-md mx-auto">
        <input
          type="text"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          placeholder="Enter Booking ID (e.g., BK-789...)"
          className="input-field flex-1"
        />
        <button
          onClick={() => handleTrack(bookingId)}
          disabled={isLoading}
          className="btn-copper disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Track Repair'}
        </button>
      </div>

      {error && (
        <div className="error-banner max-w-md mx-auto mb-8 text-center">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="max-w-2xl mx-auto">
          <SkeletonLoader variant="booking-card" count={1} />
        </div>
      )}

      {trackingResult && !isLoading && (
        <div className="card max-w-2xl mx-auto p-8">
          <div className="mb-6 flex justify-between items-center border-b border-edge pb-4">
            <span className="font-semibold text-ink">
              Booking ID: <span className="font-data text-copper">{trackingResult.bookingId || trackingResult._id}</span>
            </span>
            <span className={`badge ${
              trackingResult.status === 'completed' ? 'badge-completed' :
              trackingResult.status === 'in-progress' ? 'badge-progress' :
              trackingResult.status === 'confirmed' ? 'badge-confirmed' : 'badge-pending'
            }`}>
              {trackingResult.status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 text-ink">Device Details</h3>
              <div className="space-y-3 text-ink-muted">
                <p><span className="font-medium text-ink">Device:</span> {trackingResult.deviceType}</p>
                <p><span className="font-medium text-ink">Issue:</span> {trackingResult.issue}</p>
                <p><span className="font-medium text-ink">Received:</span> {formatDate(trackingResult.createdAt)}</p>
              </div>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold mb-4 text-ink">Status Update</h3>
              <div className="space-y-4">
                {/* Timeline Stepper */}
                {[
                  { label: 'Booking Received', active: true },
                  { label: 'Technician Working', active: trackingResult.status === 'in-progress' || trackingResult.status === 'completed' },
                  { label: 'Repair Completed', active: trackingResult.status === 'completed' }
                ].map((step, index, arr) => {
                  const isCompleted = step.active && (index === arr.length - 1 || arr[index + 1].active);
                  const isCurrent = step.active && (index === arr.length - 1 || !arr[index + 1].active);
                  const isFuture = !step.active;

                  return (
                    <div key={index} className="flex relative">
                      {/* Left side dot and line */}
                      <div className="flex flex-col items-center mr-4">
                        <div className={`w-4 h-4 rounded-full z-10 flex-shrink-0 ${
                          isCompleted ? 'bg-copper' :
                          isCurrent ? 'bg-copper animate-pulse-ring' :
                          'bg-surface border border-edge'
                        }`} />
                        {index < arr.length - 1 && (
                          <div className={`w-0.5 h-full absolute top-4 ${
                            isCompleted ? 'bg-copper' : 'bg-edge'
                          }`} />
                        )}
                      </div>
                      {/* Right side content */}
                      <div className="pb-6 pt-0">
                        <p className={`text-sm font-medium ${isFuture ? 'text-ink-muted' : 'text-ink'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackPage;