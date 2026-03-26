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
      // Use AuthContext.register() which handles token persistence and state update.
      // We pass role: 'technician' so the backend's /register route assigns it correctly.
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
        // AuthContext has already updated state + localStorage token.
        // navigate() triggers a React Router transition; no page reload needed.
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as Technician</h1>
          <p className="text-gray-600">Start offering your repair services</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              required
              className="p-3 border rounded-lg w-full"
              onChange={e => setFormData({...formData, firstName: e.target.value})}
            />
            <input
              type="text"
              placeholder="Last Name"
              required
              className="p-3 border rounded-lg w-full"
              onChange={e => setFormData({...formData, lastName: e.target.value})}
            />
          </div>
          
          <input
            type="email"
            placeholder="Email Address"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
          
          <input
            type="tel"
            placeholder="Phone Number"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, phone: e.target.value})}
          />
          
          <input
            type="password"
            placeholder="Password"
            required
            className="p-3 border rounded-lg w-full"
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Your Skills</label>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-4 py-2 rounded-full border transition-all ${
                    formData.skills.includes(skill)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          
          <button
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            {isLoading ? 'Processing...' : 'Apply as Technician'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TechnicianSignup;
