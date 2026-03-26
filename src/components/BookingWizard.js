import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BookingWizard = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();    // token from context only – no localStorage fallback
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading]     = useState(false);
  const [submitError, setSubmitError] = useState(null); // inline error state instead of alert()
  const [diagnosis, setDiagnosis]     = useState(null); // AI analysis result from step 3
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
    { id: 'smartphone', name: 'Smartphone', icon: '📱' },
    { id: 'laptop', name: 'Laptop', icon: '💻' },
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
        // Show loading, but define a "Safety Valve" to ensure we always proceed
        setIsLoading(true);
        
        try {
          const formData = new FormData();
          formData.append('photo', bookingData.photo);
          formData.append('deviceType', bookingData.deviceType);

          // Attempt AI, but catch any specific network errors here
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
          // CRITICAL: This ensures the user ALWAYS moves to Step 4, even if AI crashed
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

        // Reset wizard state
        setCurrentStep(1);
        setBookingData({ deviceType: '', issue: '', customIssueDescription: '', photo: null, preferredTime: '', address: '' });

        navigate(trackingId ? `/track?id=${trackingId}` : '/bookings');

      } else if (response.status === 401 || response.status === 403) {
        // Token expired / revoked – log out cleanly via AuthContext
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
            <h2 className="text-2xl font-semibold text-gray-900">Select Device Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deviceTypes.map((device) => (
                <button
                  key={device.id}
                  onClick={() => handleDeviceTypeSelect(device.id)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    bookingData.deviceType === device.id
                      ? 'border-brand bg-brand bg-opacity-10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-4xl mb-3">{device.icon}</div>
                  <div className="font-medium text-gray-900">{device.name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Select Issue</h2>
            <div className="space-y-3">
              {issues[bookingData.deviceType]?.map((issue) => (
                <button
                  key={issue.id}
                  onClick={() => handleIssueSelect(issue.id)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                    bookingData.issue === issue.id
                      ? 'border-brand bg-brand bg-opacity-10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{issue.name}</div>
                </button>
              ))}
            </div>
            {bookingData.issue === 'other' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe your issue
                </label>
                <textarea
                  value={bookingData.customIssueDescription}
                  onChange={(e) => handleCustomIssueDescriptionChange(e.target.value)}
                  placeholder="Describe the problem with your device in detail..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Upload Photo of Issue</h2>
            {bookingData.photo ? (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={URL.createObjectURL(bookingData.photo)}
                    alt="Issue preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    onClick={handlePhotoRemove}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
                <button
                  onClick={() => document.getElementById('photo-upload').click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div
                onClick={() => document.getElementById('photo-upload').click()}
                className="w-full p-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer text-center"
              >
                <div className="text-4xl mb-4">📷</div>
                <div className="text-gray-600">Click to upload photo</div>
                <div className="text-sm text-gray-400 mt-2">JPG, PNG up to 10MB</div>
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
            <h2 className="text-2xl font-semibold text-gray-900">Schedule & Address</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Time
              </label>
              <select
                value={bookingData.preferredTime}
                onChange={(e) => setBookingData({ ...bookingData, preferredTime: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select a time slot</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Address
              </label>
              <textarea
                value={bookingData.address}
                onChange={(e) => setBookingData({ ...bookingData, address: e.target.value })}
                placeholder="Enter your complete address"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Booking Summary</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <span className="font-medium text-gray-700">Device Type:</span>
                <span className="ml-2 text-gray-900">
                  {deviceTypes.find(d => d.id === bookingData.deviceType)?.name}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Issue:</span>
                <span className="ml-2 text-gray-900">
                  {bookingData.issue === 'other' 
                    ? `Other: ${bookingData.customIssueDescription || 'Not specified'}`
                    : issues[bookingData.deviceType]?.find(i => i.id === bookingData.issue)?.name
                  }
                </span>
              </div>
              {bookingData.photo && (
                <div>
                  <span className="font-medium text-gray-700">Photo:</span>
                  <span className="ml-2 text-gray-900">Uploaded</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Preferred Time:</span>
                <span className="ml-2 text-gray-900">{bookingData.preferredTime}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-900">{bookingData.address}</span>
              </div>
            </div>
            
            {/* Inline error display – replaces alert() calls */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                <strong>Error:</strong> {submitError}
              </div>
            )}
            
            {isLoading && (
              <div className="flex flex-col items-center justify-center p-8 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-blue-800 font-medium animate-pulse">🤖 Serva AI is analyzing your device...</p>
                <p className="text-blue-600 text-sm mt-1">Identifying damage and estimating severity</p>
              </div>
            )}
            
            {diagnosis && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <h3 className="font-bold text-blue-800 uppercase text-xs tracking-widest">Serva AI Diagnosis</h3>
                </div>
                <p className="text-blue-900 font-semibold">{diagnosis.issue}</p>
                <p className="text-blue-700 text-sm mt-1 italic">"{diagnosis.advice}"</p>
                <div className="mt-2 inline-block bg-blue-200 text-blue-800 px-2 py-1 rounded text-[10px] font-black uppercase">
                  Severity: {diagnosis.severity}
                </div>
              </div>
            )}
            
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-brand text-white py-4 rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        return false; // Photo is optional
      case 4:
        return !bookingData.preferredTime || !bookingData.address;
      case 5:
        return true; // No next button on summary
      default:
        return true;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="bg-gray-50 px-6 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id
                    ? 'bg-brand text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id}
              </div>
              <span className={`ml-2 text-sm ${
                currentStep >= step.id ? 'text-brand font-medium' : 'text-gray-500'
              } hidden sm:inline`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-brand' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="p-6 sm:p-8">
        {renderStepContent()}
      </div>

      {/* Navigation – also disable Next while AI analysis is in flight on step 3 */}
      {currentStep < 5 && (
        <div className="px-6 pb-6 flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              currentStep === 1 || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={isNextDisabled() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isNextDisabled() || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-brand text-white hover:bg-opacity-90'
            }`}
          >
            {isLoading ? 'Analyzing…' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingWizard;
