import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BookingWizard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [diagnosis, setDiagnosis]     = useState(null);
  const [bookingData, setBookingData] = useState({
    deviceType: '',
    issue: '',
    customIssueDescription: '',
    photo: null,
    preferredTime: '',
    address: '',
  });

  const steps = [
    { id: 1, title: 'Device Type' },
    { id: 2, title: 'Issue' },
    { id: 3, title: 'Photo' },
    { id: 4, title: 'Schedule' },
    { id: 5, title: 'Summary' },
  ];

  const deviceTypes = [
    {
      id: 'smartphone', name: 'Smartphone', icon: (
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" className="mx-auto">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <path d="M12 18h.01" />
        </svg>
      )
    },
    {
      id: 'laptop', name: 'Laptop', icon: (
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" strokeWidth="1.5" fill="none" className="mx-auto">
          <rect x="3" y="4" width="18" height="12" rx="2" ry="2" />
          <path d="M2 20h20" />
        </svg>
      )
    },
  ];

  const issues = {
    smartphone: [
      { id: 'broken-screen', name: 'Broken Screen' },
      { id: 'battery', name: 'Battery Issues' },
      { id: 'software', name: 'Software Problems' },
      { id: 'charging-port', name: 'Charging Port' },
      { id: 'camera', name: 'Camera Issues' },
      { id: 'other', name: 'Other' },
    ],
    laptop: [
      { id: 'broken-screen', name: 'Broken Screen' },
      { id: 'battery', name: 'Battery Issues' },
      { id: 'software', name: 'Software Problems' },
      { id: 'keyboard', name: 'Keyboard Issues' },
      { id: 'overheating', name: 'Overheating' },
      { id: 'other', name: 'Other' },
    ],
  };

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const handleNext = async () => {
    if (currentStep < steps.length) {
      if (currentStep === 3 && bookingData.photo) {
        setIsLoading(true);
        try {
          const formData = new FormData();
          formData.append('photo', bookingData.photo);
          formData.append('deviceType', bookingData.deviceType);

          const apiUrl = process.env.REACT_APP_API_URL || 'https://serva-backend.onrender.com';
          const response = await fetch(`${apiUrl}/api/v1/analyze-issue`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          if (response.ok) {
            const result = await response.json();
            if (result.success) setDiagnosis(result.diagnosis);
          } else {
            console.warn("AI Service Skipped (Status: " + response.status + ")");
          }
        } catch (error) { 
          console.error("AI Service Error (Ignored):", error); 
        } finally { 
          setIsLoading(false); 
          setCurrentStep(currentStep + 1); 
        }
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!token) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    setSubmitError(null);
    
    try {
      const formData = new FormData();
      formData.append('deviceType',    bookingData.deviceType);
      formData.append('issue',         bookingData.issue);
      formData.append('preferredTime', bookingData.preferredTime);
      formData.append('address',       bookingData.address);
      
      if (bookingData.issue === 'other' && bookingData.customIssueDescription) {
        formData.append('customIssueDescription', bookingData.customIssueDescription);
      }
      if (bookingData.photo) {
        formData.append('photo', bookingData.photo);
      }

      const apiUrl = process.env.REACT_APP_API_URL || 'https://serva-backend.onrender.com';
      const response = await fetch(`${apiUrl}/api/v1/bookings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const created    = result.booking || {};
        const trackingId = created.bookingId || created._id;

        localStorage.removeItem('bookingStep');
        localStorage.removeItem('bookingData');

        setCurrentStep(1);
        setBookingData({ deviceType: '', issue: '', customIssueDescription: '', photo: null, preferredTime: '', address: '' });

        navigate(trackingId ? `/success` : '/bookings', { state: { bookingData: { bookingId: trackingId, deviceType: bookingData.deviceType, issue: bookingData.issue, preferredTime: bookingData.preferredTime } } });

      } else if (response.status === 401 || response.status === 403) {
        await logout();
        navigate('/login', { replace: true });
      } else {
        setSubmitError(result.message || 'Booking failed. Please try again.');
      }
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceTypeSelect = (type) => {
    setBookingData({ ...bookingData, deviceType: type, issue: '', customIssueDescription: '' });
  };

  const handleIssueSelect = (issue) => {
    setBookingData({ ...bookingData, issue, customIssueDescription: issue === 'other' ? '' : bookingData.customIssueDescription });
  };

  const handleCustomIssueDescriptionChange = (description) => {
    setBookingData({ ...bookingData, customIssueDescription: description });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBookingData({ ...bookingData, photo: file });
    }
  };

  const handlePhotoRemove = () => {
    setBookingData({ ...bookingData, photo: null });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Select Device Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deviceTypes.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceTypeSelect(device.id)}
                  className={`card p-6 text-center transition-all ${
                    bookingData.deviceType === device.id
                      ? 'border-copper bg-copper/10'
                      : 'border-edge hover:border-copper/50'
                  }`}
                >
                  <div className="mb-3 text-ink">{device.icon}</div>
                  <div className="font-sans font-medium text-ink">{device.name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Select Issue</h2>
            <div className="space-y-3">
              {issues[bookingData.deviceType]?.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  className={`card w-full p-4 text-left transition-all ${
                    bookingData.issue === issue.id
                      ? 'border-copper bg-copper/10'
                      : 'border-edge hover:border-copper/50'
                  }`}
                >
                  <div className="font-sans font-medium text-ink">{issue.name}</div>
                </button>
              ))}
            </div>
            {bookingData.issue === 'other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-ink-muted mb-2">
                  Please describe your issue
                </label>
                <textarea
                  value={bookingData.customIssueDescription}
                  onChange={(e) => handleCustomIssueDescriptionChange(e.target.value)}
                  placeholder="Describe the problem with your device in detail..."
                  rows={4}
                  className="input-field w-full"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Upload Photo of Issue</h2>
            {bookingData.photo ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(bookingData.photo)}
                    alt="Issue preview"
                    className="w-full h-64 object-cover rounded-sharp"
                  />
                  <button
                    onClick={handlePhotoRemove}
                    className="absolute top-2 right-2 bg-err text-white p-2 rounded-full hover:bg-err/90"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => document.getElementById('photo-upload').click()}
                  className="w-full p-4 border-2 border-dashed border-edge rounded-sharp hover:border-copper/50 text-ink"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('photo-upload').click()}
                className="w-full p-12 border-2 border-dashed border-edge rounded-sharp hover:border-copper/50 cursor-pointer text-center"
              >
                <div className="mb-4 flex justify-center text-ink-faint">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <div className="text-ink-muted">Click to upload photo</div>
                <div className="text-sm text-ink-faint mt-2">JPG, PNG up to 10MB</div>
              </div>
            )}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Schedule & Address</h2>
            <div className="field-group">
              <label className="block text-sm font-medium text-ink-muted mb-2">
                Preferred Time
              </label>
              <select
                value={bookingData.preferredTime}
                onChange={(e) => setBookingData({ ...bookingData, preferredTime: e.target.value })}
                className="input-field w-full"
              >
                <option value="" className="bg-surface-elevated text-ink">Select a time slot</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time} className="bg-surface-elevated text-ink">
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="block text-sm font-medium text-ink-muted mb-2">
                Service Address
              </label>
              <textarea
                value={bookingData.address}
                onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                placeholder="Enter your complete address"
                rows={3}
                className="input-field w-full"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="font-display text-2xl font-semibold text-ink">Booking Summary</h2>
            <div className="bg-surface-elevated rounded-sharp p-6 space-y-4">
              <div>
                <span className="text-ink-muted text-sm">Device Type:</span>
                <span className="ml-2 text-ink font-medium">
                  {deviceTypes.find(d => d.id === bookingData.deviceType)?.name}
                </span>
              </div>
              <div>
                <span className="text-ink-muted text-sm">Issue:</span>
                <span className="ml-2 text-ink font-medium">
                  {bookingData.issue === 'other' 
                    ? `Other: ${bookingData.customIssueDescription || 'Not specified'}`
                    : issues[bookingData.deviceType]?.find(i => i.id === bookingData.issue)?.name
                  }
                </span>
              </div>
              {bookingData.photo && (
                <div>
                  <span className="text-ink-muted text-sm">Photo:</span>
                  <span className="ml-2 text-ink font-medium">Uploaded</span>
                </div>
              )}
              <div>
                <span className="text-ink-muted text-sm">Preferred Time:</span>
                <span className="ml-2 text-ink font-medium">{bookingData.preferredTime}</span>
              </div>
              <div>
                <span className="text-ink-muted text-sm">Address:</span>
                <span className="ml-2 text-ink font-medium">{bookingData.address}</span>
              </div>
            </div>
            
            {submitError && (
              <div className="error-banner">
                <strong>Error:</strong> {submitError}
              </div>
            )}
            
            {isLoading && (
              <div className="skeleton skeleton-card p-8 flex flex-col items-center justify-center mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-copper mb-4"></div>
                <p className="text-copper font-medium animate-pulse">Analyzing your device...</p>
              </div>
            )}
            
            {diagnosis && (
              <div className="glass rounded-panel p-4 mt-4">
                <div className="flex items-center gap-2 mb-2 text-copper">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                    <rect x="4" y="8" width="16" height="12" rx="2" ry="2" />
                  </svg>
                  <h3 className="font-bold uppercase text-xs tracking-widest">Serva AI Diagnosis</h3>
                </div>
                <p className="text-ink font-semibold">{diagnosis.issue}</p>
                <p className="text-ink-muted text-sm mt-1 italic">"{diagnosis.advice}"</p>
                <div className="mt-2 inline-block bg-copper/10 text-copper px-2 py-1 rounded-sharp text-[10px] font-black uppercase">
                  Severity: {diagnosis.severity}
                </div>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="btn-copper w-full py-4 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Confirm Booking'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 1:
        return !bookingData.deviceType;
      case 2:
        return !bookingData.issue || (bookingData.issue === 'other' && !bookingData.customIssueDescription.trim());
      case 3:
        return false;
      case 4:
        return !bookingData.preferredTime || !bookingData.address;
      case 5:
        return true;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-surface p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-surface-raised border border-edge rounded-sharp p-6 mb-8">
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-8 px-4">
            {steps.map((step, index) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-copper text-white'
                          : isCurrent
                          ? 'bg-copper/20 border-2 border-copper animate-pulse-ring text-copper'
                          : 'bg-surface-elevated border border-edge text-ink-muted'
                      }`}
                    >
                      {isCompleted ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <span className={`text-xs mt-2 font-sans ${isCurrent ? 'text-ink' : 'text-ink-muted'} hidden sm:block`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-[2px] mx-2 ${
                      isCompleted ? 'bg-copper' : 'bg-edge'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="py-2">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          {currentStep < 5 && (
            <div className="mt-8 pt-6 border-t border-edge flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
                className={`btn-ghost ${currentStep === 1 || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={isNextDisabled() || isLoading}
                className={`btn-copper ${isNextDisabled() || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Analyzing…' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
