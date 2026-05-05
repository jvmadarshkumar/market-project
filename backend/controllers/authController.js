const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password.' });
    }

    // Check if the email belongs to the admin — admin cannot be re-registered
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.role === 'admin') {
        return res.status(403).json({ message: 'This email is reserved. Please use the Admin Login.' });
      }
      if (existingUser.isVerified) {
        return res.status(409).json({ message: 'An account with this email already exists and is verified.' });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = password;
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({ name, email, password, role: 'user', otp, otpExpires, isVerified: false });
    }
    
    // Send OTP via email
    const sendEmail = require('../utils/sendEmail');
    const message = `Your OTP for Market Databank registration is: ${otp}. It is valid for 10 minutes.`;
    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0f172a; margin: 0;">📊 Market Databank</h1>
        </div>
        <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">Verify Your Email Address</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Thank you for registering. To securely complete your account setup, please use the 6-digit verification code below:</p>
        <div style="text-align: center; margin: 35px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; background-color: #e0e7ff; padding: 15px 30px; border-radius: 10px; border: 2px dashed #a5b4fc;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">⏳ This secure code will expire in exactly <strong>10 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px;">If you did not request this email, you can safely ignore it.</p>
      </div>
    `;
    sendEmail({
      email: user.email,
      subject: 'Market Databank - Verify Your Account',
      message,
      htmlMessage
    }).catch(err => console.error('Email error:', err));

    res.status(201).json({
      message: 'Account created! An OTP has been sent to your email. Please verify to continue.',
      email: user.email
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error("Signup Error:", err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== 'admin' && !user.isVerified) {
      return res.status(403).json({ message: 'Your account is not verified. Please verify your email first.' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Account verified successfully.',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your email.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists, just say successful
      return res.status(200).json({ message: 'If an account exists with that email, an OTP has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const sendEmail = require('../utils/sendEmail');
    const message = `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`;
    const htmlMessage = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #0f172a; margin: 0;">📊 Market Databank</h1>
        </div>
        <h2 style="color: #1e293b; text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">Password Reset Request 🔒</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">We received a request to reset the password for your Market Databank account.</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.5;">Use the secure 6-digit code below to set a new password:</p>
        <div style="text-align: center; margin: 35px 0;">
          <span style="display: inline-block; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #dc2626; background-color: #fee2e2; padding: 15px 30px; border-radius: 10px; border: 2px dashed #fca5a5;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">⏳ This secure code will expire in exactly <strong>10 minutes</strong>.</p>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #f1f5f9; padding-top: 20px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
      </div>
    `;
    sendEmail({
      email: user.email,
      subject: 'Market Databank - Password Reset',
      message,
      htmlMessage
    }).catch(err => console.error('Email error:', err));

    res.status(200).json({ message: 'If an account exists with that email, an OTP has been sent.' });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ message: 'Server error during password reset request.' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Please provide email, OTP, and new password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = newPassword; // Will be hashed by pre('save') hook
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({ message: 'Password has been successfully reset. You can now log in.' });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

// PATCH /api/auth/change-password (Protected)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide both current and new passwords.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // Will be hashed by pre('save') hook
    await user.save();

    res.json({ message: 'Password has been successfully updated!' });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: 'Server error during password change.' });
  }
};

module.exports = { signup, login, verifyOTP, forgotPassword, resetPassword, changePassword };
