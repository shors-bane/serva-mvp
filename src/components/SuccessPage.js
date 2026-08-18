import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const bookingData = location.state?.bookingData;

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-ink mb-4">Booking Not Found</h1>
          <p className="text-ink-muted mb-6">Please try booking again.</p>
          <Link
            to="/book"
            className="btn-copper px-6 py-3"
          >
            Book Again
          </Link>
        </div>
      </div>
    );
  }

  const { bookingId, deviceType, issue, preferredTime } = bookingData;
  
  const trackingId = bookingId?.bookingId || bookingId?._id || bookingId?.id || bookingId;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="bg-surface-raised border border-edge rounded-sharp p-8 max-w-md w-full text-center">
        
        <div className="mx-auto w-[60px] h-[60px] bg-teal/10 rounded-full flex items-center justify-center mb-6 relative">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" stroke="var(--color-teal-light, #40b0a6)" strokeWidth="2" fill="none" />
            <path 
              className="animate-draw-check"
              stroke="var(--color-teal-light, #40b0a6)" 
              strokeWidth="3" 
              fill="none" 
              d="M30 50 l15 15 l25 -30" 
              style={{ strokeDasharray: 100, strokeDashoffset: 0 }} 
            />
          </svg>
        </div>

        <h1 className="font-display font-bold text-2xl text-ink mb-2">Booking Confirmed!</h1>
        <p className="text-ink-muted mb-8">
          Your device repair booking has been successfully submitted. We'll contact you soon.
        </p>

        <div className="bg-surface-elevated rounded-sharp p-6 mb-8 text-left">
          <h2 className="font-display text-lg font-semibold text-ink mb-4">Booking Details</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-ink-muted">Booking ID:</span>
              <span className="font-data text-copper">{trackingId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ink-muted">Device:</span>
              <span className="font-medium text-ink capitalize">{deviceType}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ink-muted">Issue:</span>
              <span className="font-medium text-ink capitalize">
                {issue === 'other' ? 'Other' : issue.replace('-', ' ')}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-ink-muted">Preferred Time:</span>
              <span className="font-medium text-ink">{preferredTime}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            to={`/track?id=${trackingId}`}
            className="w-full block btn-copper py-3 text-center"
          >
            Track Repair
          </Link>
          
          <Link
            to="/bookings"
            className="w-full block btn-ghost py-3 text-center"
          >
            View My Bookings
          </Link>
          
          <Link
            to="/"
            className="w-full block text-ink-muted hover:text-ink transition-colors font-medium py-3 text-center"
          >
            Back to Home
          </Link>
        </div>

        <div className="mt-6 text-sm text-ink-faint">
          <p>Save your booking ID for future reference.</p>
          <p className="mt-1">You'll receive a confirmation email shortly.</p>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
