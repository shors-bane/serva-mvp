import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';

const TechnicianDashboard = () => {
  const { token } = useAuth();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [acceptingIds, setAcceptingIds]   = useState(new Set());
  const [acceptError, setAcceptError]     = useState(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('https://serva-backend.onrender.com/api/v1/technician/available-jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setAvailableJobs(data.jobs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const acceptJob = async (jobId) => {
    if (acceptingIds.has(jobId)) return;
    setAcceptingIds(prev => new Set(prev).add(jobId));
    setAcceptError(null);

    try {
      const res = await fetch(`https://serva-backend.onrender.com/api/v1/bookings/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchJobs(); 
      } else {
        setAcceptError(data.message || 'Failed to accept job.');
      }
    } catch {
      setAcceptError('Network error. Please try again.');
    } finally {
      setAcceptingIds(prev => { const next = new Set(prev); next.delete(jobId); return next; });
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        <h2 className="font-display font-semibold text-xl text-ink mb-6">Available Jobs Near You</h2>

        {acceptError && (
          <div className="mb-4 error-banner p-3">
            {acceptError}
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonLoader variant="booking-card" />
            <SkeletonLoader variant="booking-card" />
            <SkeletonLoader variant="booking-card" />
          </div>
        ) : availableJobs.length === 0 ? (
          <div className="border-2 border-dashed border-edge rounded-sharp py-20 text-center">
            <p className="text-ink-muted">No pending jobs in your area. Sit tight!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {availableJobs.map(job => {
              const isAccepting = acceptingIds.has(job._id);
              return (
                <div key={job._id} className="card p-6 flex justify-between items-center hover:border-copper/25 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="label-mono text-copper bg-copper/10 px-3 py-1 rounded-sharp uppercase">{job.deviceType}</span>
                      <span className="font-data text-xs text-ink-faint">#{job.bookingId}</span>
                    </div>
                    <h3 className="font-sans font-medium text-lg text-ink">{job.issue}</h3>
                    <div className="text-ink-muted text-sm flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {job.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        {job.preferredTime}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <p className="font-display font-bold text-xl text-ink">₹1,500 <span className="text-ink-faint text-xs font-normal">est. profit</span></p>
                    <button 
                      onClick={() => acceptJob(job._id)}
                      disabled={isAccepting}
                      className={`btn-copper w-full ${isAccepting ? 'opacity-50 cursor-not-allowed bg-surface-elevated text-ink-faint' : ''}`}
                    >
                      {isAccepting ? 'Accepting…' : 'Accept Job'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianDashboard;
