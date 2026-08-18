import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, logout, token } = useAuth();
  const [stats, setStats] = useState({ totalBookings: 0, activeRepairs: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('https://serva-backend.onrender.com/api/v1/bookings', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const bookings = data.bookings || [];
          setStats({
            totalBookings: bookings.length,
            activeRepairs: bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled').length
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (token) fetchStats();
  }, [token]);

  if (!user) return <div className="p-8">Please log in.</div>;

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header Card */}
        <div className="bg-surface-raised border border-edge rounded-sharp overflow-hidden mb-8 relative">
          <div className="h-32 bg-gradient-to-r from-copper/20 to-teal/20"></div>
          <div className="px-8 pb-8 relative">
            <div className="absolute -top-16 left-8">
              <div className="h-32 w-32 rounded-full border-4 border-surface bg-surface-raised flex items-center justify-center text-5xl font-display font-bold text-copper uppercase">
                {user.firstName ? user.firstName[0] : 'U'}
              </div>
            </div>
            <div className="mt-20 flex justify-between items-end">
              <div>
                <h1 className="font-display text-3xl font-bold text-ink">{user.firstName} {user.lastName}</h1>
                <p className="text-ink-muted font-medium">{user.email}</p>
                <div className="mt-2">
                  <span className="badge badge-progress inline-flex">
                    Member
                  </span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="btn-ghost border-err/25 text-err hover:bg-err/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass rounded-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-ink-muted text-sm font-medium">Total Repairs</p>
              <p className="font-display text-3xl font-bold text-ink mt-1">{stats.totalBookings}</p>
            </div>
            <div className="bg-copper/10 rounded-full w-12 h-12 flex items-center justify-center text-copper">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
          </div>
          <div className="glass rounded-panel p-6 flex items-center justify-between">
            <div>
              <p className="text-ink-muted text-sm font-medium">Active Repairs</p>
              <p className="font-display text-3xl font-bold text-ink mt-1">{stats.activeRepairs}</p>
            </div>
            <div className="bg-copper/10 rounded-full w-12 h-12 flex items-center justify-center text-copper">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="card p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display text-xl font-bold text-ink">Personal Information</h2>
            <button disabled className="text-ink-faint text-sm font-medium cursor-not-allowed" title="Coming Soon">Edit Profile (Coming Soon)</button>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="block label-mono text-ink-faint mb-1">Full Name</label>
              <p className="text-ink font-medium">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <label className="block label-mono text-ink-faint mb-1">Email Address</label>
              <p className="text-ink font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block label-mono text-ink-faint mb-1">Phone Number</label>
              <p className="text-ink font-medium">{user.phone || 'No phone number added'}</p>
            </div>
            <div>
              <label className="block label-mono text-ink-faint mb-1">Member Since</label>
              <p className="text-ink font-medium">
                {new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
