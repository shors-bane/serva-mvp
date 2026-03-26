import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const TechnicianDashboard = () => {
  const { token } = useAuth();
  const [availableJobs, setAvailableJobs] = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  // Track which job IDs are currently being accepted to prevent double-submission.
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
    // Guard: do not fire a second request if this job is already being accepted.
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
        fetchJobs(); // Refresh the list
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Available Jobs Near You</h2>

        {/* Inline error for accept failures */}
        {acceptError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-3">
            {acceptError}
          </div>
        )}
        
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading new requests...</div>
        ) : availableJobs.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed rounded-2xl py-20 text-center">
            <p className="text-gray-500">No pending jobs in your area. Sit tight!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {availableJobs.map(job => {
              const isAccepting = acceptingIds.has(job._id);
              return (
                <div key={job._id} className="bg-white rounded-xl shadow-sm border p-6 flex justify-between items-center hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-md text-xs font-bold uppercase">{job.deviceType}</span>
                      <span className="text-xs text-gray-400 font-medium">#{job.bookingId}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">{job.issue}</h3>
                    <div className="text-sm text-gray-500">
                      📍 {job.address} • ⏰ {job.preferredTime}
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <p className="text-xl font-black text-gray-900">₹1,500 <span className="text-xs font-normal text-gray-400">est. profit</span></p>
                    <button 
                      onClick={() => acceptJob(job._id)}
                      disabled={isAccepting}
                      className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                        isAccepting
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
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
