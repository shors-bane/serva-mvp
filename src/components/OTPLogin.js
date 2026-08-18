import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OTPLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone', 'otp', 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^[+]?[\d\s-(]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    return `+${cleaned.slice(0, -10)} (${cleaned.slice(-10, -7)}) ${cleaned.slice(-7, -4)}-${cleaned.slice(-4)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError('');
  };

  const handleSendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      setResendTimer(60);
      // In real app, this would send OTP to the phone number
      console.log('OTP sent to:', phoneNumber);
    }, 1500);
  };

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus on the next empty input or the last one
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex].focus();
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true); // Start Spinner
    
    try {
      // Simulate API call - accept "123456" as valid OTP for demo
      if (otpValue === '123456') {
        console.log('OTP verified successfully');
        
        // For demo, create a demo email from phone number and login
        const demoEmail = `user${phoneNumber.replace(/\D/g, '')}@serva.demo`;
        
        // Attempt to login with demo credentials
        const result = await login(demoEmail, 'demo123'); // Your auth context call
        
        if (result.success) {
          // FORCE REDIRECT immediately on success
          navigate('/');
        } else {
          setError(result.message || 'Login failed');
        }
      } else {
        setError('Invalid OTP. Please try again or use 123456 for demo.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      // CRITICAL: Stop Spinner no matter what happens
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      setResendTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0].focus();
      console.log('OTP resent to:', phoneNumber);
    }, 1500);
  };

  const handleReset = () => {
    setStep('phone');
    setPhoneNumber('');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setResendTimer(0);
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="bg-surface-raised border border-edge rounded-sharp p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-surface-input rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink mb-2">Login Successful!</h2>
          <p className="text-ink-muted mb-6">You have been successfully authenticated.</p>
          <div className="space-y-3">
            <button
              onClick={handleReset}
              className="btn-copper w-full py-3 font-semibold"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-raised border border-edge rounded-sharp p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-surface-input rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-copper" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
              <line x1="12" y1="18" x2="12.01" y2="18"></line>
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-ink mb-2">
            {step === 'phone' ? 'Welcome Back' : 'Enter OTP'}
          </h2>
          <p className="text-ink-muted">
            {step === 'phone' 
              ? 'Enter your phone number to continue' 
              : `We've sent a 6-digit code to ${phoneNumber}`
            }
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 error-banner">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'phone' ? (
          /* Phone Input Step */
          <div className="space-y-6">
            <div className="field-group">
              <label className="block text-sm font-medium text-ink-muted mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="(123) 456-7890"
                className="input-field w-full text-lg"
              />
            </div>

            <button
              onClick={handleSendOTP}
              disabled={!phoneNumber || isLoading}
              className={`w-full py-3 font-semibold ${
                !phoneNumber || isLoading
                  ? 'bg-surface-input text-ink-faint cursor-not-allowed border border-edge rounded-sharp'
                  : 'btn-copper'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-current" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending OTP...
                </div>
              ) : (
                'Send OTP'
              )}
            </button>
          </div>
        ) : (
          /* OTP Input Step */
          <div className="space-y-6">
            <div className="field-group">
              <label className="block text-sm font-medium text-ink-muted mb-4">
                Enter 6-digit code
              </label>
              <div className="flex justify-between space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-xl font-semibold bg-surface-input border border-edge focus:border-copper rounded-sharp text-ink outline-none"
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleResendOTP}
                disabled={resendTimer > 0 || isLoading}
                className={`text-sm ${
                  resendTimer > 0 || isLoading
                    ? 'text-ink-faint cursor-not-allowed'
                    : 'text-copper hover:text-copper-light'
                }`}
              >
                {resendTimer > 0 
                  ? `Resend OTP in ${resendTimer}s` 
                  : 'Resend OTP'
                }
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleVerifyOTP}
                disabled={otp.join('').length !== 6 || isLoading}
                className={`w-full py-3 font-semibold ${
                  otp.join('').length !== 6 || isLoading
                    ? 'bg-surface-input text-ink-faint cursor-not-allowed border border-edge rounded-sharp'
                    : 'btn-copper'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2 text-current" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <button
                onClick={handleReset}
                className="btn-ghost w-full py-3 font-semibold"
              >
                Change Phone Number
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-ink-faint">
                Demo: Use OTP <span className="font-semibold text-ink-muted">123456</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPLogin;
