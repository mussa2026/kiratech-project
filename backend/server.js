require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const hpp       = require('hpp');
const rateLimit = require('express-rate-limit');
const path      = require('path');
const crypto    = require('crypto');
const validator = require('validator');
const swaggerUi  = require('swagger-ui-express');
// Load Swagger spec safely — don't crash if docs folder is missing
let swaggerSpec = null;
try {
  swaggerSpec = require('./docs/swagger');
} catch (e) {
  console.warn('⚠️  Swagger docs not available:', e.message);
}

const { sequelize } = require('./models');
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/user');
const technicianRoutes   = require('./routes/technician');
const adminRoutes        = require('./routes/admin');
const serviceRoutes      = require('./routes/service');
const requestRoutes      = require('./routes/request');
const notificationRoutes = require('./routes/notification');
const paymentRoutes      = require('./routes/payment');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ─── 1. Trust proxy (needed for rate limiting behind nginx/load balancer) ─────
app.set('trust proxy', 1);

// ─── 2. Security headers — Helmet with proper CSP ────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],  // Swagger UI needs this
      styleSrc:       ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
      imgSrc:         ["'self'", 'data:', 'https:'],
      connectSrc:     ["'self'"],
      fontSrc:        ["'self'", 'data:'],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,   // Allow Swagger UI iframes
  hsts: {
    maxAge:            31536000,       // 1 year
    includeSubDomains: true,
    preload:           true,
  },
  referrerPolicy:           { policy: 'strict-origin-when-cross-origin' },
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
}));

// ─── 3. Hide server fingerprint ───────────────────────────────────────────────
app.disable('x-powered-by');

// ─── 4. CORS — explicit allowlist ─────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
];

// Add CLIENT_URL(s) from env — supports comma-separated list for multiple origins
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach(u => {
    const trimmed = u.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

// Auto-allow any *.onrender.com origin so Render previews always work
const onrenderPattern = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/;

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, mobile apps, same-origin)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any Render.com subdomain (covers frontend1, frontend2, etc.)
    if (onrenderPattern.test(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// ─── 5. HTTP Parameter Pollution protection ───────────────────────────────────
app.use(hpp());

// ─── 6. Rate limiting — tiered ────────────────────────────────────────────────
// General API: 150 req / 15 min
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path.startsWith('/api/docs'), // Don't limit docs
}));

// Auth endpoints: 20 req / 15 min (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many authentication attempts. Please wait 15 minutes.' },
});

// OTP endpoints: 5 req / 15 min (very strict)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many OTP requests. Please wait 15 minutes.' },
});

// Contact form: 5 req / hour
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many messages sent. Please wait an hour.' },
});

// ─── 7. Stripe webhook — raw body BEFORE express.json() ──────────────────────
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/paymentWebhook')
);

// ─── 8. Body parsers — reduced limits to prevent DoS ─────────────────────────
app.use(express.json({ limit: '1mb' }));          // reduced from 10mb
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── 9. Request ID for audit logging ─────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ─── 10. Security audit logger ────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    // Log suspicious activity
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`🔒 [${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.path} | IP:${req.ip} | ID:${req.requestId} | ${ms}ms`);
    }
    if (res.statusCode >= 500) {
      console.error(`❌ [${new Date().toISOString()}] ${res.statusCode} ${req.method} ${req.path} | ${ms}ms`);
    }
  });
  next();
});

// ─── 11. Uploads — restricted static serving ─────────────────────────────────
app.use('/uploads', (req, res, next) => {
  // Only allow image and document extensions
  const allowed = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/i;
  if (!allowed.test(req.path)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── 12. Swagger API Docs — only if spec loaded and not production ────────────
if (!isProd && swaggerSpec) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'KIRATECH API Docs',
    customCss: '.swagger-ui .topbar { background-color: #1d4ed8; } .swagger-ui .topbar .download-url-wrapper { display: none; }',
    swaggerOptions: { persistAuthorization: true, docExpansion: 'none', filter: true },
  }));
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
} else {
  // Production: protect docs with basic auth
  app.use('/api/docs', (req, res) => res.status(404).json({ error: 'Not found' }));
}

// ─── 13. Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth/resend-otp',  otpLimiter);
app.use('/api/auth/verify-otp',  otpLimiter);
app.use('/api/auth',             authLimiter, authRoutes);
app.use('/api/user',             userRoutes);
app.use('/api/technician/chat',  require('./routes/technicianChat'));
app.use('/api/technician',       technicianRoutes);
app.use('/api/admin',            adminRoutes);
app.use('/api/services',         serviceRoutes);
app.use('/api/requests',         requestRoutes);
app.use('/api/notifications',    notificationRoutes);
app.use('/api/payments',         paymentRoutes);

// ─── 14. Health check + debug endpoint ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Debug endpoint — shows DB status and env var presence (no secrets exposed)
app.get('/api/debug', async (req, res) => {
  const { sequelize: sq } = require('./models');
  let dbStatus = 'unknown';
  let dbError  = null;
  try {
    await sq.authenticate();
    dbStatus = 'connected';
  } catch (e) {
    dbStatus = 'FAILED';
    dbError  = e.message;
  }
  res.json({
    nodeEnv:    process.env.NODE_ENV,
    dbHost:     process.env.DB_HOST     || 'NOT SET',
    dbPort:     process.env.DB_PORT     || 'NOT SET',
    dbName:     process.env.DB_NAME     || 'NOT SET',
    dbUser:     process.env.DB_USER     || 'NOT SET',
    dbPassword: process.env.DB_PASSWORD ? '***SET***' : 'NOT SET',
    dbSsl:      process.env.DB_SSL      || 'NOT SET',
    dbStatus,
    dbError,
    jwtSecret:  process.env.JWT_SECRET  ? '***SET***' : 'NOT SET',
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
  });
});

// ─── 15. Contact form — with sanitization ────────────────────────────────────
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    let { name, email, subject, message } = req.body;

    // Validate
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (name.length > 100 || subject.length > 200 || message.length > 2000) {
      return res.status(400).json({ error: 'Input too long' });
    }

    // Sanitize — strip HTML tags to prevent XSS in email body
    name    = validator.escape(name.trim());
    subject = validator.escape(subject.trim());
    message = validator.escape(message.trim());

    const { sendEmail } = require('./utils/email');
    const adminEmail = process.env.ADMIN_EMAIL || 'robertcharles088@gmail.com';

    await sendEmail({
      to: adminEmail,
      subject: `Contact Form: ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;background:#fff">
          <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:20px 24px;border-radius:8px 8px 0 0">
            <h2 style="color:#fff;margin:0">📬 New Contact Form Message</h2>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
              <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600;width:30%">Name</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${name}</td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Email</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${email}</td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Subject</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${subject}</td></tr>
            </table>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px">
              <p style="margin:0;white-space:pre-wrap;color:#334155">${message}</p>
            </div>
            <p style="margin-top:16px;color:#94a3b8;font-size:12px">Sent from KIRATECH contact form · ${new Date().toLocaleString()}</p>
          </div>
        </div>`,
    });

    await sendEmail({
      to: email,
      subject: 'We received your message — KIRATECH IT Support',
      text: `Hi ${name}, we received your message and will get back to you within 24 hours.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
        <div style="background:linear-gradient(135deg,#1d4ed8,#1e40af);padding:20px 24px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0">🔧 KIRATECH IT Support</h2></div>
        <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
          <h3 style="color:#1e40af">Hi ${name}, we received your message!</h3>
          <p>Thank you for reaching out. We will get back to you within 24 hours.</p>
          <p style="color:#94a3b8;font-size:12px;margin-top:16px">KIRATECH IT Support · Njiro Road, Arusha, Tanzania</p>
        </div></div>`,
    });

    res.json({ message: 'Message sent successfully!' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ─── 16. 404 handler ─────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── 17. Global error handler — shows message to help diagnose production issues ──
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}]`, err);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'CORS policy violation' });
  }
  // Show real error message (remove isProd guard temporarily for debugging)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const { verifyEmailConnection } = require('./utils/email');

sequelize.authenticate()
  .then(() => { console.log('✅ Database connected'); return sequelize.sync({ alter: isProd ? false : true }); })
  .then(async () => {
    console.log('✅ Database synced');

    // ── Auto-seed in production (idempotent — safe to run every startup) ──────
    if (isProd) {
      try {
        const { Service, User } = require('./models');

        const services = [
          { name: 'Computer Maintenance & Troubleshooting', description: 'Full computer diagnosis, cleaning, performance optimization and repair.', category: 'standard', icon: 'computer', basePrice: 25000, estimatedDuration: '1-3 hours', sortOrder: 1 },
          { name: 'Printer Repair & Services', description: 'Printer repair, installation, driver setup, cartridge replacement, paper jam fix.', category: 'standard', icon: 'printer', basePrice: 20000, estimatedDuration: '1-2 hours', sortOrder: 2 },
          { name: 'Mobile Phone Repair', description: 'Screen replacement, battery swap, charging port repair, software flashing, virus removal.', category: 'standard', icon: 'phone', basePrice: 15000, estimatedDuration: '1-4 hours', sortOrder: 3 },
          { name: 'Network Installation & WiFi Setup', description: 'Home and office network setup, router config, WiFi extenders, LAN cabling.', category: 'standard', icon: 'wifi', basePrice: 40000, estimatedDuration: '2-4 hours', sortOrder: 4 },
          { name: 'Data Recovery & Cloud Services', description: 'Recovery of lost, deleted or corrupted files from HDD, SSD, USB drives, SD cards.', category: 'standard', icon: 'cloud', basePrice: 50000, estimatedDuration: '2-8 hours', sortOrder: 5 },
          { name: 'Software Installation & Updates', description: 'Windows 10/11, Microsoft Office, Adobe Suite, antivirus, driver updates.', category: 'standard', icon: 'download', basePrice: 18000, estimatedDuration: '1-2 hours', sortOrder: 6 },
          { name: 'Hardware Upgrade Services', description: 'RAM upgrade, HDD to SSD migration, GPU installation, CPU upgrade, PSU replacement.', category: 'standard', icon: 'cpu', basePrice: 30000, estimatedDuration: '1-3 hours', sortOrder: 7 },
          { name: 'Remote Desktop Support', description: 'Remote support via AnyDesk, TeamViewer, RustDesk for Windows, Mac, Linux.', category: 'premium', icon: 'monitor', basePrice: 12000, estimatedDuration: '30 min - 2 hours', sortOrder: 8 },
          { name: 'On-Call Priority Support', description: 'Dedicated on-call technician on standby for urgent IT emergencies.', category: 'premium', icon: 'headphones', basePrice: 75000, estimatedDuration: 'As needed', sortOrder: 9 },
          { name: 'Live Service Tracking', description: 'Real-time live tracking of your service progress.', category: 'premium', icon: 'map', basePrice: 0, estimatedDuration: 'During service', sortOrder: 10 },
          { name: 'Cloud Backup & Synchronization', description: 'Automated backup setup for Google Drive, OneDrive, AWS S3, Dropbox.', category: 'premium', icon: 'sync', basePrice: 60000, estimatedDuration: '2-6 hours', sortOrder: 11 },
          { name: 'Web Hosting & Domain Services', description: 'Domain registration, hosting setup, SSL certificates, WordPress installation.', category: 'premium', icon: 'globe', basePrice: 100000, estimatedDuration: '1-3 days', sortOrder: 12 },
        ];

        let seeded = 0;
        for (const svc of services) {
          const [, created] = await Service.findOrCreate({ where: { name: svc.name }, defaults: svc });
          if (created) seeded++;
        }
        if (seeded > 0) console.log(`✅ Auto-seeded ${seeded} new services`);

        // Ensure admin account exists
        const adminEmail = process.env.ADMIN_EMAIL || 'robertcharles088@gmail.com';
        const [, adminCreated] = await User.findOrCreate({
          where: { email: adminEmail },
          defaults: {
            name:       process.env.ADMIN_NAME     || 'Robert Charles (KIRATECH Admin)',
            email:      adminEmail,
            password:   process.env.ADMIN_PASSWORD || 'Admin@123456',
            role:       'admin',
            isVerified: true,
            isActive:   true,
          },
        });
        if (adminCreated) {
          console.log(`✅ Admin account created: ${adminEmail}`);
        } else {
          console.log(`ℹ️  Admin account ready: ${adminEmail}`);
        }
      } catch (seedErr) {
        // Non-fatal — log but don't crash the server
        console.warn('⚠️  Auto-seed warning:', seedErr.message);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    await verifyEmailConnection();
    app.listen(PORT, () => {
      console.log(`🚀 KIRATECH Server: http://localhost:${PORT}`);
      if (!isProd) console.log(`📖 API Docs:        http://localhost:${PORT}/api/docs`);
    });
  })
  .catch(err => { console.error('❌ DB connection failed:', err.message); process.exit(1); });

module.exports = app;
