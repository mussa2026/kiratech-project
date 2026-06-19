const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { generateToken } = require('../utils/helpers');
const { sendOtpEmail, sendPasswordResetEmail } = require('../utils/email');
const { authenticate } = require('../middleware/auth');
const { checkLoginAttempts, recordFailedLogin, clearLoginAttempts } = require('../middleware/auth');

const router = express.Router();

/** Generate a random 6-digit OTP */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new customer account — sends 6-digit OTP to email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: John Doe }
 *               email:    { type: string, format: email, example: john@example.com }
 *               password: { type: string, minLength: 8, example: 'Password1' }
 *               phone:    { type: string, example: '+255714759884' }
 *     responses:
 *       201:
 *         description: OTP sent to email
 *       409:
 *         description: Email already registered
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be 8+ chars with uppercase, lowercase, and number'),
    body('phone').optional({ values: 'falsy' }).isMobilePhone().withMessage('Valid phone number required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { name, email, password, phone } = req.body;
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const otp = generateOtp();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

      const user = await User.create({
        name, email, password, phone: phone || null,
        verificationToken: otp,
        verificationExpires,
        role: 'customer',
      });

      await sendOtpEmail(user, otp);

      res.status(201).json({
        message: 'Registration successful. A 6-digit code has been sent to your email.',
        userId: user.id,
        email: user.email,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// ─── Verify OTP ───────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify email with 6-digit OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email: { type: string, format: email }
 *               otp:   { type: string, minLength: 6, maxLength: 6, example: '482931' }
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be exactly 6 digits'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { email, otp } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user)             return res.status(404).json({ error: 'User not found' });
      if (user.isVerified)   return res.status(400).json({ error: 'Email is already verified' });
      if (!user.verificationToken) return res.status(400).json({ error: 'No code found. Please request a new one.' });
      if (user.verificationExpires < new Date()) {
        return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
      }
      if (user.verificationToken !== otp.trim()) {
        return res.status(400).json({ error: 'Incorrect code. Please check and try again.' });
      }
      await user.update({ isVerified: true, verificationToken: null, verificationExpires: null });
      res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
      console.error('OTP verify error:', err);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// ─── Resend OTP ───────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/resend-otp:
 *   post:
 *     summary: Resend a new 6-digit OTP to the customer's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: New OTP sent
 *       400:
 *         description: Email already verified
 *       404:
 *         description: User not found
 *       429:
 *         description: Too many requests — wait before retrying
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.isVerified) return res.status(400).json({ error: 'Email already verified' });

    // Throttle: if OTP was issued less than 60 seconds ago, reject
    if (user.verificationExpires) {
      const secondsLeft = (new Date(user.verificationExpires).getTime() - Date.now()) / 1000;
      if (secondsLeft > 14 * 60) { // More than 14 min left on a 15-min OTP
        return res.status(429).json({
          error: 'Please wait 60 seconds before requesting a new code.',
          retryAfter: 60,
        });
      }
    }

    const otp = generateOtp();
    await user.update({
      verificationToken: otp,
      verificationExpires: new Date(Date.now() + 15 * 60 * 1000),
    });
    await sendOtpEmail(user, otp);
    res.json({ message: 'A new 6-digit code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// ─── Legacy verify-email link (still works for old links) ─────────────────────
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Verification token required' });
    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ error: 'Invalid verification token' });
    if (user.verificationExpires < new Date()) {
      return res.status(400).json({ error: 'Token has expired. Please request a new code.' });
    }
    await user.update({ isVerified: true, verificationToken: null, verificationExpires: null });
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: admin@kiratech.com }
 *               password: { type: string, example: Admin@123456 }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:   { type: string }
 *                 user:    { $ref: '#/components/schemas/User' }
 *                 message: { type: string }
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { email, password } = req.body;

      // Check per-user lockout
      const lockout = checkLoginAttempts(email);
      if (lockout.blocked) {
        return res.status(429).json({
          error: `Too many failed login attempts. Try again in ${Math.ceil(lockout.retryAfter / 60)} minutes.`,
          retryAfter: lockout.retryAfter,
        });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        recordFailedLogin(email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      if (!user.isActive) return res.status(403).json({ error: 'Account has been deactivated' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        recordFailedLogin(email);
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Successful login — clear failed attempts
      clearLoginAttempts(email);
      await user.update({ lastLogin: new Date() });

      const token = jwt.sign(
        { id: user.id, role: user.role, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
      );
      res.json({ token, user: user.toSafeObject(), message: 'Login successful' });
    } catch (err) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// ─── Forgot Password ──────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset link
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Reset link sent (always 200 to prevent enumeration)
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });
    const resetToken = generateToken();
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    await sendPasswordResetEmail(user, resetToken);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:    { type: string }
 *               password: { type: string, minLength: 8, example: 'NewPassword1' }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { token, password } = req.body;
      const user = await User.findOne({ where: { resetPasswordToken: token } });
      if (!user || user.resetPasswordExpires < new Date()) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      await user.update({ password, resetPasswordToken: null, resetPasswordExpires: null });
      res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

// ─── Get Current User ─────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
