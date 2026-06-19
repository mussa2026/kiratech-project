const jwt      = require('jsonwebtoken');
const { User } = require('../models');

// ─── In-memory login attempt tracker (resets on restart; use Redis in prod) ───
const loginAttempts = new Map(); // key: email, value: { count, firstAttempt }
const MAX_ATTEMPTS  = 5;
const LOCKOUT_MS    = 15 * 60 * 1000; // 15 minutes

function checkLoginAttempts(email) {
  const now  = Date.now();
  const rec  = loginAttempts.get(email);
  if (!rec) return { blocked: false };

  // Reset window if lockout period has expired
  if (now - rec.firstAttempt > LOCKOUT_MS) {
    loginAttempts.delete(email);
    return { blocked: false };
  }

  if (rec.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((rec.firstAttempt + LOCKOUT_MS - now) / 1000);
    return { blocked: true, retryAfter };
  }
  return { blocked: false };
}

function recordFailedLogin(email) {
  const now = Date.now();
  const rec = loginAttempts.get(email);
  if (!rec) {
    loginAttempts.set(email, { count: 1, firstAttempt: now });
  } else {
    rec.count++;
    loginAttempts.set(email, rec);
  }
}

function clearLoginAttempts(email) {
  loginAttempts.delete(email);
}

// ─── JWT Authentication ───────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token length sanity (prevent DoS with huge tokens)
    if (token.length > 2048) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],  // explicitly restrict algorithm
    });

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires', 'verificationExpires'] },
    });

    if (!user)           return res.status(401).json({ error: 'User not found' });
    if (!user.isActive)  return res.status(401).json({ error: 'Account deactivated' });

    // Attach user and token metadata to request
    req.user      = user;
    req.tokenData = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')  return res.status(401).json({ error: 'Session expired. Please log in again.' });
    if (err.name === 'JsonWebTokenError')  return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'NotBeforeError')     return res.status(401).json({ error: 'Token not yet valid' });
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

// ─── Email verification check ─────────────────────────────────────────────────
const requireVerified = (req, res, next) => {
  if (!req.user?.isVerified) {
    return res.status(403).json({ error: 'Please verify your email address first' });
  }
  next();
};

// ─── Role-based access control ────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied: insufficient permissions' });
  }
  next();
};

module.exports = { authenticate, requireVerified, authorize, checkLoginAttempts, recordFailedLogin, clearLoginAttempts };
