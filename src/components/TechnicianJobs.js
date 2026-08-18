import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const TechnicianJobs = () => {
  const { token } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyJobs = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://serva-backend.onrender.com/api/v1/bookings/technician/my-jobs', {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setMyJobs(data.jobs || []);
        } else {
          setError(data.message || 'Failed to fetch jobs');
        }
      } catch (err) {
        console.error('Error fetching technician jobs:', err);
        setError('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchMyJobs();
    }
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-pending';
      case 'in-progress':
        return 'badge-progress';
      case 'completed':
        return 'badge-completed';
      default:
        return 'badge-pending';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 min-h-screen bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface p-6 md:p-8">
        <div className="max-w-4xl mx-auto error-banner p-4">
          <div className="font-medium">
            <strong>Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-display font-semibold text-2xl text-ink">My Jobs</h2>
          <div className="text-ink-muted text-sm">
            {myJobs.length} {myJobs.length === 1 ? 'job' : 'jobs'} assigned
          </div>
        </div>

        {myJobs.length === 0 ? (
          <div className="card p-8 text-center text-ink-faint">
            <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-ink">No jobs assigned</h3>
            <p className="mt-1 text-sm text-ink-muted">
              You haven't accepted any jobs yet. Check the available jobs to get started.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {myJobs.map((job) => (
              <div key={job._id} className="card p-6 hover:border-copper/25 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-lg text-ink mb-2">
                      Job ID: {job.bookingId || job._id}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-ink-muted">
                        <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {job.user?.firstName} {job.user?.lastName}
                      </div>
                      <div className="flex items-center text-sm text-ink-muted">
                        <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {job.deviceType} - {job.issue}
                      </div>
                      <div className="flex items-center text-sm text-ink-muted">
                        <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.address}
                      </div>
                      <div className="flex items-center text-sm text-ink-muted">
                        <svg className="w-4 h-4 mr-2 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Preferred: {job.preferredTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span className={`badge ${getStatusColor(job.status)}`}>
                      {job.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <div className="text-xs text-ink-faint font-data">
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                </div>

                {job.photo && (
                  <div className="mt-4">
                    <img 
                      src={`https://serva-backend.onrender.com${job.photo}`} 
                      alt="Device issue" 
                      className="w-32 h-32 object-cover rounded-sharp border border-edge"
                    />
                  </div>
                )}

                <div className="mt-4 flex justify-end space-x-3">
                  <button 
                    onClick={() => console.log('Update status for job:', job._id)}
                    className="btn-copper text-sm"
                  >
                    Update Status
                  </button>
                  <button 
                    onClick={() => console.log('View details for job:', job._id)}
                    className="btn-ghost text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianJobs;
