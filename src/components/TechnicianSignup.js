import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
const TechnicianSignup = () => {
  const navigate   = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    skills: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState('');

  const availableSkills = ['Smartphone', 'Laptop', 'Tablet', 'Gaming Console', 'Audio Gear'];

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.skills.length === 0) return setError('Please select at least one skill');
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await register({
        firstName: formData.firstName,
        lastName:  formData.lastName,
        email:     formData.email,
        phone:     formData.phone,
        password:  formData.password,
        role:      'technician',
        technicianProfile: { skills: formData.skills },
      });

      if (result.success) {
        navigate('/technician-dashboard', { replace: true });
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-ink mb-2">Join as Technician</h1>
          <p className="text-ink-muted">Start offering your repair services</p>
        </div>

        {error && <div className="error-banner p-4 mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="card bg-surface-raised border border-edge p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="field-group">
              <input
                type="text"
                placeholder="First Name"
                required
                className="input-field w-full"
                onChange={e => setFormData({...formData, firstName: e.target.value})}
              />
            </div>
            <div className="field-group">
              <input
                type="text"
                placeholder="Last Name"
                required
                className="input-field w-full"
                onChange={e => setFormData({...formData, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div className="field-group">
            <input
              type="email"
              placeholder="Email Address"
              required
              className="input-field w-full"
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          
          <div className="field-group">
            <input
              type="tel"
              placeholder="Phone Number"
              required
              className="input-field w-full"
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div className="field-group">
            <input
              type="password"
              placeholder="Password"
              required
              className="input-field w-full"
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-ink-muted mb-3">Your Skills</label>
            <div className="flex flex-col gap-2">
              {availableSkills.map(skill => {
                const isChecked = formData.skills.includes(skill);
                return (
                  <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${isChecked ? 'bg-copper border-copper' : 'bg-surface-input border-edge group-hover:border-copper/50'}`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      )}
                    </div>
                    <span className="text-ink select-none">{skill}</span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isChecked}
                      onChange={() => handleSkillToggle(skill)}
                    />
                  </label>
                );
              })}
            </div>
          </div>
          
          <button
            disabled={isLoading}
            className="w-full btn-copper py-4 transition-all"
          >
            {isLoading ? 'Processing...' : 'Apply as Technician'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianSignup;
