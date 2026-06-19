const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────
// Built lazily so missing env vars don't crash the import — only fail at send time.
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === 'your_email@gmail.com' ||
      process.env.EMAIL_PASS === 'your_app_password' ||
      process.env.EMAIL_PASS === 'your_16_char_app_password_here') {
    return null; // Not configured yet
  }

  _transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,           // TLS via STARTTLS on port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Must be a Gmail App Password, NOT your account password
    },
    tls: {
      rejectUnauthorized: true,
    },
    pool: true,              // Reuse connections for better performance
    maxConnections: 3,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  });

  return _transporter;
}

/**
 * Verify SMTP connection on startup. Call from server.js after DB connects.
 */
async function verifyEmailConnection() {
  const t = getTransporter();
  if (!t) {
    console.warn('⚠️  Email not configured — set EMAIL_USER and EMAIL_PASS in .env');
    console.warn('   Email features (verification, notifications) will be silently skipped.');
    return false;
  }
  try {
    await t.verify();
    console.log(`✅ Email connected: ${process.env.EMAIL_USER}`);
    return true;
  } catch (err) {
    console.error('❌ Email connection failed:', err.message);
    console.error('   Check your Gmail App Password at: https://myaccount.google.com/apppasswords');
    _transporter = null; // Reset so it can be retried
    return false;
  }
}

// ─── Base HTML template ───────────────────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>KIRATECH IT Support</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f1f5f9; color: #334155; }
    .wrapper { max-width: 600px; margin: 32px auto; padding: 0 16px; }
    .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%); padding: 28px 32px; }
    .header-brand { display: flex; align-items: center; gap: 10px; }
    .header-icon { font-size: 26px; }
    .header-name { color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 0.05em; }
    .header-tagline { color: #bfdbfe; font-size: 12px; margin-top: 2px; }
    .body { padding: 32px; }
    .body h2 { color: #1e40af; font-size: 20px; margin-bottom: 12px; }
    .body p { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 12px; }
    .btn-wrap { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: #1d4ed8; color: #ffffff !important;
           text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px;
           letter-spacing: 0.02em; }
    .btn:hover { background: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    td { padding: 10px 12px; border: 1px solid #e2e8f0; }
    td:first-child { font-weight: 600; color: #334155; background: #f8fafc; width: 38%; }
    td:last-child { color: #475569; }
    .note { font-size: 12px; color: #94a3b8; margin-top: 8px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { font-size: 12px; color: #94a3b8; }
    .footer a { color: #1d4ed8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="header-brand">
          <span class="header-icon">🔧</span>
          <div>
            <div class="header-name">KIRATECH</div>
            <div class="header-tagline">IT Support Management System</div>
          </div>
        </div>
      </div>
      <div class="body">${content}</div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} KIRATECH IT Support · Njiro Road, Arusha, Tanzania</p>
        <p style="margin-top:4px">
          <a href="mailto:robertcharles088@gmail.com">robertcharles088@gmail.com</a> ·
          <a href="https://wa.me/255714759884">+255 714 759 884</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  const t = getTransporter();
  if (!t) {
    console.warn(`📭 Email skipped (not configured): "${subject}" → ${to}`);
    return false;
  }
  try {
    const info = await t.sendMail({
      from: process.env.EMAIL_FROM || `KIRATECH IT Support <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text: text || subject, // Plaintext fallback
    });
    console.log(`📧 Email sent → ${to} | "${subject}" | ID: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ Email failed → ${to} | "${subject}"`);
    console.error(`   Error: ${err.message}`);
    if (err.code === 'EAUTH') {
      console.error('   Fix: Generate a Gmail App Password at https://myaccount.google.com/apppasswords');
    }
    return false;
  }
};

// ─── Email templates ──────────────────────────────────────────────────────────

const sendVerificationEmail = async (user, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email — KIRATECH IT Support',
    text: `Hello ${user.name}, please verify your email: ${verifyUrl}`,
    html: baseTemplate(`
      <h2>Welcome to KIRATECH IT Support! 👋</h2>
      <p>Hi <strong>${user.name}</strong>, thank you for registering.</p>
      <p>Please click the button below to verify your email address and activate your account.</p>
      <div class="btn-wrap">
        <a href="${verifyUrl}" class="btn">✓ Verify Email Address</a>
      </div>
      <hr class="divider">
      <p class="note">⏱ This link expires in <strong>24 hours</strong>.</p>
      <p class="note">If you did not create an account, you can safely ignore this email.</p>
      <p class="note">Or copy this URL into your browser:<br><a href="${verifyUrl}" style="color:#1d4ed8;word-break:break-all">${verifyUrl}</a></p>
    `),
  });
};

const sendOtpEmail = async (user, otp) => {
  return sendEmail({
    to: user.email,
    subject: `${otp} — Your KIRATECH Verification Code`,
    text: `Hi ${user.name}, your KIRATECH verification code is: ${otp}. It expires in 15 minutes.`,
    html: baseTemplate(`
      <h2>Verify Your Email 🔐</h2>
      <p>Hi <strong>${user.name}</strong>, welcome to KIRATECH IT Support!</p>
      <p>Enter the code below to verify your email address and activate your account:</p>

      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#f1f5f9;border:2px dashed #1d4ed8;border-radius:12px;padding:20px 40px;">
          <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px">
            Verification Code
          </p>
          <p style="font-size:42px;font-weight:800;letter-spacing:0.18em;color:#1d4ed8;margin:0;font-family:monospace">
            ${otp}
          </p>
        </div>
      </div>

      <hr class="divider">
      <p class="note">⏱ This code expires in <strong>15 minutes</strong>.</p>
      <p class="note">If you did not create an account, you can safely ignore this email.</p>
    `),
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Password Reset — KIRATECH IT Support',
    text: `Hi ${user.name}, reset your password here: ${resetUrl}`,
    html: baseTemplate(`
      <h2>Password Reset Request 🔑</h2>
      <p>Hi <strong>${user.name}</strong>, we received a request to reset your KIRATECH account password.</p>
      <div class="btn-wrap">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      <hr class="divider">
      <p class="note">⏱ This link expires in <strong>1 hour</strong>.</p>
      <p class="note">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
      <p class="note">Or copy this URL:<br><a href="${resetUrl}" style="color:#1d4ed8;word-break:break-all">${resetUrl}</a></p>
    `),
  });
};

const sendRequestConfirmation = async (user, request, service) => {
  return sendEmail({
    to: user.email,
    subject: `Request Received — Ticket #${request.ticketNumber}`,
    text: `Hi ${user.name}, your service request #${request.ticketNumber} has been received.`,
    html: baseTemplate(`
      <h2>Service Request Received ✅</h2>
      <p>Hi <strong>${user.name}</strong>, we have received your IT support request and it is now pending assignment.</p>
      <table>
        <tr><td>Ticket #</td><td><strong>${request.ticketNumber}</strong></td></tr>
        <tr><td>Service</td><td>${service.name}</td></tr>
        <tr><td>Issue</td><td>${request.title}</td></tr>
        <tr><td>Priority</td><td>${request.priority.toUpperCase()}</td></tr>
        <tr><td>Status</td><td>⏳ Pending Assignment</td></tr>
      </table>
      <p>Our admin team will review your request and assign a technician shortly. You will receive an email notification once a technician is assigned.</p>
    `),
  });
};

const sendTechnicianAssignedEmail = async (user, request, technician) => {
  return sendEmail({
    to: user.email,
    subject: `Technician Assigned — Ticket #${request.ticketNumber}`,
    text: `Hi ${user.name}, ${technician.name} has been assigned to your request #${request.ticketNumber}.`,
    html: baseTemplate(`
      <h2>Technician Assigned 👷</h2>
      <p>Hi <strong>${user.name}</strong>, a technician has been assigned to your service request.</p>
      <table>
        <tr><td>Ticket #</td><td><strong>${request.ticketNumber}</strong></td></tr>
        <tr><td>Technician</td><td>${technician.name}</td></tr>
        <tr><td>Phone</td><td>${technician.phone || 'Will contact you soon'}</td></tr>
        <tr><td>Status</td><td>📋 Assigned</td></tr>
      </table>
      <p>Your technician will contact you shortly to confirm the schedule and begin the service.</p>
    `),
  });
};

const sendStatusUpdateEmail = async (user, request) => {
  const statusMap = {
    accepted:    { label: 'Accepted by Technician', icon: '✅', color: '#059669' },
    in_progress: { label: 'Work In Progress',        icon: '🔧', color: '#d97706' },
    completed:   { label: 'Completed',               icon: '🎉', color: '#16a34a' },
    cancelled:   { label: 'Cancelled',               icon: '❌', color: '#dc2626' },
    rejected:    { label: 'Rejected',                icon: '⚠️', color: '#d97706' },
  };
  const s = statusMap[request.status] || { label: request.status, icon: 'ℹ️', color: '#1d4ed8' };

  return sendEmail({
    to: user.email,
    subject: `Request Update — Ticket #${request.ticketNumber}`,
    text: `Hi ${user.name}, your request #${request.ticketNumber} status: ${s.label}.`,
    html: baseTemplate(`
      <h2>${s.icon} Request Status Updated</h2>
      <p>Hi <strong>${user.name}</strong>, your service request status has been updated.</p>
      <table>
        <tr><td>Ticket #</td><td><strong>${request.ticketNumber}</strong></td></tr>
        <tr><td>New Status</td><td style="color:${s.color};font-weight:bold">${s.label}</td></tr>
        ${request.technicianNotes ? `<tr><td>Technician Notes</td><td>${request.technicianNotes}</td></tr>` : ''}
        ${request.cancellationReason ? `<tr><td>Reason</td><td>${request.cancellationReason}</td></tr>` : ''}
      </table>
      ${request.status === 'completed' ? '<p>Thank you for using KIRATECH IT Support! Please leave a review from your dashboard.</p>' : ''}
    `),
  });
};

const sendAdminNewRequestEmail = async (adminEmail, request, user, service) => {
  const dashboardUrl = `${process.env.CLIENT_URL}/admin/requests/${request.id}`;
  return sendEmail({
    to: adminEmail,
    subject: `New Request [${request.priority.toUpperCase()}] — Ticket #${request.ticketNumber}`,
    text: `New service request #${request.ticketNumber} from ${user.name}. Service: ${service.name}.`,
    html: baseTemplate(`
      <h2>New Service Request 📬</h2>
      <p>A new service request has been submitted and requires technician assignment.</p>
      <table>
        <tr><td>Ticket #</td><td><strong>${request.ticketNumber}</strong></td></tr>
        <tr><td>Customer</td><td>${user.name} (${user.email})</td></tr>
        <tr><td>Phone</td><td>${user.phone || 'Not provided'}</td></tr>
        <tr><td>Service</td><td>${service.name} <em>(${service.category})</em></td></tr>
        <tr><td>Issue</td><td>${request.title}</td></tr>
        <tr><td>Priority</td><td style="font-weight:bold;color:${request.priority === 'urgent' ? '#dc2626' : request.priority === 'high' ? '#d97706' : '#1d4ed8'}">${request.priority.toUpperCase()}</td></tr>
        ${request.location ? `<tr><td>Location</td><td>${request.location}</td></tr>` : ''}
      </table>
      <div class="btn-wrap">
        <a href="${dashboardUrl}" class="btn">View & Assign Technician</a>
      </div>
    `),
  });
};

const sendTechnicianTaskEmail = async (techUser, request, service, customer) => {
  const taskUrl = `${process.env.CLIENT_URL}/technician/tasks/${request.id}`;
  return sendEmail({
    to: techUser.email,
    subject: `New Task Assigned — Ticket #${request.ticketNumber}`,
    text: `Hi ${techUser.name}, a new task has been assigned to you: #${request.ticketNumber}.`,
    html: baseTemplate(`
      <h2>New Task Assigned 📋</h2>
      <p>Hi <strong>${techUser.name}</strong>, a new service request has been assigned to you. Please review and accept or reject it from your dashboard.</p>
      <table>
        <tr><td>Ticket #</td><td><strong>${request.ticketNumber}</strong></td></tr>
        <tr><td>Service</td><td>${service.name}</td></tr>
        <tr><td>Customer</td><td>${customer.name}</td></tr>
        <tr><td>Phone</td><td>${customer.phone || 'Not provided'}</td></tr>
        <tr><td>Issue</td><td>${request.title}</td></tr>
        <tr><td>Priority</td><td style="font-weight:bold;color:${request.priority === 'urgent' ? '#dc2626' : request.priority === 'high' ? '#d97706' : '#1d4ed8'}">${request.priority.toUpperCase()}</td></tr>
        ${request.preferredDate ? `<tr><td>Preferred Date</td><td>${new Date(request.preferredDate).toLocaleDateString()} ${request.preferredTime || ''}</td></tr>` : ''}
        ${request.location ? `<tr><td>Location</td><td>${request.location}</td></tr>` : ''}
      </table>
      <div class="btn-wrap">
        <a href="${taskUrl}" class="btn">View Task in Dashboard</a>
      </div>
    `),
  });
};

module.exports = {
  verifyEmailConnection,
  sendEmail,
  sendVerificationEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendRequestConfirmation,
  sendTechnicianAssignedEmail,
  sendStatusUpdateEmail,
  sendAdminNewRequestEmail,
  sendTechnicianTaskEmail,
};
