import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const { register, error, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      clearError();
    }
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!formData.lastName.trim()) {
      errors.push('Last name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Email is invalid');
    }

    if (!formData.password) {
      errors.push('Password is required');
    } else if (formData.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (formData.phone && !/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      errors.push('Phone number is invalid');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Strip confirmPassword – backend doesn't need it.
      const { confirmPassword, ...userData } = formData;

      // AuthContext.register() calls fetch internally and returns
      // { success: true, user } on 2xx or { success: false, error: string } on failure.
      const result = await register(userData);

      if (result.success) {
        // AuthContext already persisted the token and updated auth state.
        // Navigate to the customer home/dashboard.
        navigate('/', { replace: true });
        return; // early return is safe; finally still runs
      }

      // ── Failure path ──────────────────────────────────────────────────────
      // The backend's Zod middleware returns { errors: string[] } on 400.
      // AuthContext.register() surfaces this in result.error as a joined string,
      // but we also check for an errors array in case the caller passes it through.
      const backendErrors = result.errors;          // array from Zod (if forwarded)
      const backendMessage = result.error           // string from AuthContext wrapper
                          || result.message         // fallback label
                          || 'Registration failed. Please try again.';

      if (Array.isArray(backendErrors) && backendErrors.length > 0) {
        // Display each Zod field error in the existing validation banner.
        setValidationErrors(backendErrors);
      } else {
        // Display the single error string in the same banner.
        setValidationErrors([backendMessage]);
      }
      // Do NOT call clearError() here – that would wipe the context error
      // before it could be read, causing the silent-failure / infinite spinner.

    } catch (err) {
      // Unexpected JS / network error (not a structured API response).
      setValidationErrors([
        err?.message || 'An unexpected error occurred. Please try again.',
      ]);
    } finally {
      // ALWAYS runs – this is the only place that resets the spinner.
      // Placing setIsSubmitting(false) here (and nowhere else) prevents
      // any code path from leaving the button stuck in "Creating account…"
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-copper">Serva</h1>
          <p className="mt-2 text-ink-muted">Create your account</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-raised py-8 px-4 border border-edge rounded-sharp sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Messages */}
            {(error || validationErrors.length > 0) && (
              <div className="error-banner">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    {error && <p className="text-sm text-red-800">{error}</p>}
                    {validationErrors.map((validationError, index) => (
                      <p key={index} className="text-sm text-red-800">{validationError}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="field-group">
                <label htmlFor="firstName" className="block text-sm font-medium text-ink-muted">
                  First Name
                </label>
                <div className="mt-1">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="First name"
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="lastName" className="block text-sm font-medium text-ink-muted">
                  Last Name
                </label>
                <div className="mt-1">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field w-full"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div className="field-group">
              <label htmlFor="email" className="block text-sm font-medium text-ink-muted">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="field-group">
              <label htmlFor="phone" className="block text-sm font-medium text-ink-muted">
                Phone Number (Optional)
              </label>
              <div className="mt-1">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Password Fields */}
            <div className="field-group">
              <label htmlFor="password" className="block text-sm font-medium text-ink-muted">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Create a password"
                />
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Must be at least 6 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-muted">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field w-full"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-2 px-4 text-sm font-medium focus:outline-none ${
                  isSubmitting
                    ? 'bg-surface-input text-ink-faint cursor-not-allowed border border-edge rounded-sharp'
                    : 'btn-copper w-full'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </div>
                ) : (
                  'Create account'
                )}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-edge" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-raised text-ink-faint">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="btn-ghost w-full flex justify-center py-2 px-4 text-sm font-medium"
              >
                Sign in instead
              </Link>
            </div>

            <div className="mt-6 text-center border-t border-edge pt-4">
              <p className="text-sm text-ink-muted mb-2">Are you a repair expert?</p>
              <Link
                to="/partner-signup"
                className="text-copper hover:text-copper-light font-bold text-sm transition-colors"
              >
                Apply to Join as a Technician
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
