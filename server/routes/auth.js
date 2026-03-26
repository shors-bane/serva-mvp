const express = require('express');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { userUtils } = require('../utils/dataManager');
const { generateToken, rateLimit, authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Validation middleware for registration
const validateRegistrationInput = (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;
  const errors = [];

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // Password validation
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  // Password strength validation (only for registration)
  if (password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }

  // Name validation
  if (!firstName || firstName.trim().length < 2) {
    errors.push('First name must be at least 2 characters long');
  }

  if (!lastName || lastName.trim().length < 2) {
    errors.push('Last name must be at least 2 characters long');
  }

  // Phone validation (optional)
  if (phone && !/^\+?[\d\s\-()]+$/.test(phone)) {
    errors.push('Phone number is invalid');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Validation middleware for login (simpler validation)
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Email validation
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }

  // Password validation (just check it's not empty for login)
  if (!password || password.trim().length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// POST /api/auth/register - User registration
router.post('/register', rateLimit(5, 15 * 60 * 1000), validateRegistrationInput, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, technicianProfile } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user with explicit Role and Profile
    user = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: role || 'customer', // Allow frontend to set role
      technicianProfile: technicianProfile || {} // Allow skills to be saved
    });
    
    await user.save();
    
    // Generate Token
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) { 
    console.error("Registration Error:", error); 
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    }); 
  }
});

// POST /api/auth/login - User login
router.post('/login', rateLimit(10, 15 * 60 * 1000), validateLoginInput, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Find user by email
    const user = await userUtils.findUserByEmail(email);
    console.log('User found:', !!user, 'Email searched:', email);
    
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('User found:', user._id, 'Active:', user.isActive);

    // Check if user is active
    if (!user.isActive) {
      console.log('User account deactivated:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', user._id);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    console.log('Login successful for user:', user._id);

    // Generate Token
    const token = generateToken(user);

    // Update last login
    userUtils.updateUser(user._id, { lastLoginAt: new Date().toISOString() });

    // Return success response
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: user._id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        role: user.role, // <--- CRITICAL: This must be sent
        technicianProfile: user.technicianProfile 
      } 
    });

  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// POST /api/auth/logout - User logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user info
// IMPORTANT: must include `role` so AuthContext.hydrateFromToken() can
// correctly populate user.role in React state on page refresh.
router.get('/me', authenticateToken, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id:        req.user.id,
        email:     req.user.email,
        firstName: req.user.firstName,
        lastName:  req.user.lastName,
        phone:     req.user.phone,
        role:      req.user.role,      // ← required by AuthContext hydration
        isActive:  req.user.isActive,
        isAdmin:   req.user.isAdmin,
      },
    },
  });
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const userId = req.user.id;

    const errors = [];

    if (firstName && firstName.trim().length < 2) {
      errors.push('First name must be at least 2 characters long');
    }

    if (lastName && lastName.trim().length < 2) {
      errors.push('Last name must be at least 2 characters long');
    }

    if (phone && !validator.isMobilePhone(phone)) {
      errors.push('Valid phone number is required');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (phone) updateData.phone = phone.trim();

    const result = userUtils.updateUser(userId, updateData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message || 'Failed to update profile'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: result.user
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
});

// POST /api/auth/change-password - Change password
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const errors = [];

    if (!currentPassword) {
      errors.push('Current password is required');
    }

    if (!newPassword || newPassword.length < 6) {
      errors.push('New password must be at least 6 characters long');
    }

    if (newPassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      errors.push('New password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Get current user
    const user = userUtils.findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = userUtils.updateUser(userId, { password: hashedNewPassword });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update password'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
});

// 👨‍🔧 DEDICATED TECHNICIAN REGISTRATION
router.post('/register-technician', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, skills } = req.body;
    
    // 1. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // 2. FORCE Role to 'technician' (Hardcoded)
    user = new User({
      firstName,
      lastName,
      email,
      password, // Mongoose pre-save hook handles hashing usually, or hash here if needed
      phone,
      role: 'technician', // <--- FORCED
      technicianProfile: { 
        skills: skills || [] 
      }
    });
    
    // Manual Hash check (just in case your model doesn't auto-hash)
    if (!user.password.startsWith('$2b$')) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
    }
    
    await user.save();
    
    // 3. Generate Token with correct role
    const token = generateToken(user);
    
    res.status(201).json({
      success: true,
      message: 'Technician registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        email: user.email,
        role: 'technician' // Explicit return
      }
    });
  } catch (error) { 
    console.error("Tech Registration Error:", error); 
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    }); 
  }
});

module.exports = router;
