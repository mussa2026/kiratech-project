const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticate, requireVerified, authorize } = require('../middleware/auth');
const { ServiceRequest, Payment, Notification, User, Service } = require('../models');
const { sendEmail } = require('../utils/email');

const router = express.Router();

// ─── Payment method config ────────────────────────────────────────────────────
const MOBILE_METHODS = {
  mpesa:       { label: 'M-Pesa',       currency: 'TZS', flag: '🇹🇿', country: 'Tanzania/Kenya' },
  airtel_money:{ label: 'Airtel Money', currency: 'TZS', flag: '🇹🇿', country: 'Tanzania' },
  tigo_pesa:   { label: 'Tigo Pesa',    currency: 'TZS', flag: '🇹🇿', country: 'Tanzania' },
  mtn_momo:    { label: 'MTN MoMo',     currency: 'UGX', flag: '🇺🇬', country: 'Uganda/Rwanda' },
};
const CRYPTO_METHODS = {
  binance: { label: 'Binance Pay / USDT', currency: 'USDT' },
};

// ─── Business config helper ───────────────────────────────────────────────────
function getMobileNumbers() {
  return {
    mpesa:        process.env.MPESA_TZ_BUSINESS_NUMBER   || '+255714759884',
    airtel_money: process.env.AIRTEL_MERCHANT_NUMBER     || '+255784759884',
    tigo_pesa:    process.env.TIGO_BILLER_MSISDN         || '+255652759884',
    mtn_momo:     process.env.MTN_MERCHANT_NUMBER        || '+255714759884',
  };
}
function getCryptoAddresses() {
  return {
    BEP20: process.env.USDT_BEP20_ADDRESS || 'CONFIGURE_BEP20_ADDRESS',
    TRC20: process.env.USDT_TRC20_ADDRESS || 'CONFIGURE_TRC20_ADDRESS',
    ERC20: process.env.USDT_ERC20_ADDRESS || 'CONFIGURE_ERC20_ADDRESS',
  };
}
function getBinanceMerchantId() {
  return process.env.BINANCE_MERCHANT_ID || null;
}

// ─── Stripe helper ────────────────────────────────────────────────────────────
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith('sk_test_your')) return null;
  return require('stripe')(key);
}

// ─── Helper: validate request is payable ─────────────────────────────────────
async function validatePayableRequest(requestId, userId) {
  const request = await ServiceRequest.findOne({
    where: { id: requestId, userId },
    include: [{ model: Service, as: 'service' }],
  });
  if (!request) return { error: 'Service request not found', status: 404 };
  if (request.status !== 'completed') return { error: 'Payment only available for completed requests', status: 400 };
  if (request.paymentStatus === 'paid') return { error: 'This request has already been paid', status: 400 };
  if (request.paymentStatus === 'waived') return { error: 'Payment has been waived for this request', status: 400 };
  if (!request.finalCost || parseFloat(request.finalCost) <= 0) {
    return { error: 'Final cost has not been set yet. Please contact admin.', status: 400 };
  }
  return { request };
}

// ─── Helper: mark request paid & notify ──────────────────────────────────────
async function markRequestPaid(payment, request, methodLabel) {
  await request.update({ paymentStatus: 'paid' });
  const amount = payment.amount / 100;
  await Notification.create({
    userId: payment.userId, title: 'Payment Confirmed',
    message: `Your payment of ${amount.toFixed(2)} ${payment.currency.toUpperCase()} via ${methodLabel} for ticket #${request.ticketNumber} has been confirmed.`,
    type: 'general', relatedId: request.id,
  });
  const admins = await User.findAll({ where: { role: 'admin', isActive: true } });
  await Promise.all(admins.map(a => Notification.create({
    userId: a.id, title: 'Payment Received',
    message: `${methodLabel} payment of ${amount.toFixed(2)} ${payment.currency.toUpperCase()} confirmed for ticket #${request.ticketNumber}.`,
    type: 'general', relatedId: request.id,
  })));
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/methods — returns all available payment methods & details
// ═══════════════════════════════════════════════════════════════════════════
router.get('/methods', (req, res) => {
  const numbers  = getMobileNumbers();
  const crypto   = getCryptoAddresses();
  const binanceId = getBinanceMerchantId();
  const stripeOk  = !!getStripe();

  res.json({
    methods: {
      stripe: {
        available: stripeOk,
        label: 'Credit / Debit Card',
        icon: '💳',
        description: 'Visa, Mastercard, American Express',
        currency: process.env.STRIPE_CURRENCY || 'usd',
      },
      mpesa: {
        available: true,
        label: 'M-Pesa',
        icon: '📱',
        description: 'Vodacom Tanzania / Safaricom Kenya',
        flag: '🇹🇿🇰🇪',
        businessNumber: numbers.mpesa,
        accountRef: process.env.MPESA_TZ_ACCOUNT_REF || 'KIRATECH',
        currency: 'TZS',
        instructions: `Send to Business Number: ${numbers.mpesa}, Reference: KIRATECH`,
      },
      airtel_money: {
        available: true,
        label: 'Airtel Money',
        icon: '📱',
        description: 'Airtel Tanzania',
        flag: '🇹🇿',
        businessNumber: numbers.airtel_money,
        currency: 'TZS',
        instructions: `Send to merchant number: ${numbers.airtel_money}`,
      },
      tigo_pesa: {
        available: true,
        label: 'Tigo Pesa',
        icon: '📱',
        description: 'MIC Tanzania (Tigo)',
        flag: '🇹🇿',
        businessNumber: numbers.tigo_pesa,
        currency: 'TZS',
        instructions: `Send to Tigo Pesa number: ${numbers.tigo_pesa}`,
      },
      mtn_momo: {
        available: true,
        label: 'MTN Mobile Money',
        icon: '📱',
        description: 'MTN Uganda / Rwanda / Ghana',
        flag: '🇺🇬🇷🇼🇬🇭',
        businessNumber: numbers.mtn_momo,
        currency: 'UGX',
        instructions: `Send to MTN MoMo number: ${numbers.mtn_momo}`,
      },
      binance: {
        available: true,
        label: 'Binance Pay / USDT',
        icon: '🟡',
        description: 'Pay with USDT via Binance Pay or direct wallet transfer',
        merchantId: binanceId,
        addresses: {
          BEP20: { address: crypto.BEP20, network: 'BNB Smart Chain (BEP20)', label: 'USDT BEP20' },
          TRC20: { address: crypto.TRC20, network: 'Tron Network (TRC20)', label: 'USDT TRC20' },
          ERC20: { address: crypto.ERC20, network: 'Ethereum (ERC20)', label: 'USDT ERC20' },
        },
        warning: 'Only send USDT. Sending other tokens may result in permanent loss.',
      },
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/create-intent  (Stripe card)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/create-intent', authenticate, requireVerified,
  [body('requestId').notEmpty().isUUID()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    const stripe = getStripe();
    if (!stripe) return res.status(503).json({ error: 'Card payments not configured. Set STRIPE_SECRET_KEY in .env' });
    try {
      const { request, error, status } = await validatePayableRequest(req.body.requestId, req.user.id);
      if (error) return res.status(status).json({ error });
      const currency    = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();
      const amountCents = Math.round(parseFloat(request.finalCost) * 100);
      const pi = await stripe.paymentIntents.create({
        amount: amountCents, currency,
        metadata: { requestId: request.id, ticketNumber: request.ticketNumber, userId: req.user.id },
        description: `KIRATECH #${request.ticketNumber} — ${request.service?.name}`,
        receipt_email: req.user.email,
      });
      const payment = await Payment.create({
        requestId: request.id, userId: req.user.id,
        paymentMethod: 'stripe', stripePaymentIntentId: pi.id,
        amount: amountCents, currency, status: 'pending',
      });
      res.json({ clientSecret: pi.client_secret, amount: parseFloat(request.finalCost), currency, paymentId: payment.id });
    } catch (err) {
      console.error('Create intent error:', err);
      res.status(500).json({ error: err.message || 'Failed to create payment intent' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/mobile-money  — Mobile money payment initiation
// Customer submits phone + method, system creates pending record & shows instructions
// ═══════════════════════════════════════════════════════════════════════════
router.post('/mobile-money', authenticate, requireVerified,
  [
    body('requestId').notEmpty().isUUID(),
    body('method').isIn(['mpesa', 'airtel_money', 'tigo_pesa', 'mtn_momo']),
    body('phone').notEmpty().withMessage('Phone number required'),
    body('providerRef').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { request, error, status } = await validatePayableRequest(req.body.requestId, req.user.id);
      if (error) return res.status(status).json({ error });

      const { method, phone, providerRef } = req.body;
      const methodInfo  = MOBILE_METHODS[method];
      const amountCents = Math.round(parseFloat(request.finalCost) * 100);
      const businessNums = getMobileNumbers();

      const payment = await Payment.create({
        requestId: request.id, userId: req.user.id,
        paymentMethod: method, phoneNumber: phone,
        providerRef: providerRef || null,
        amount: amountCents, currency: methodInfo.currency.toLowerCase(),
        status: providerRef ? 'awaiting_confirmation' : 'awaiting_confirmation',
        notes: `Customer phone: ${phone}. ${providerRef ? `TX ref: ${providerRef}` : 'Awaiting admin confirmation.'}`,
      });

      // Notify admins to confirm
      const admins = await User.findAll({ where: { role: 'admin', isActive: true } });
      await Promise.all(admins.map(a => Notification.create({
        userId: a.id, title: `${methodInfo.label} Payment Pending`,
        message: `${req.user.name} claims ${methodInfo.label} payment for ticket #${request.ticketNumber}. Phone: ${phone}${providerRef ? `. Ref: ${providerRef}` : ''}. Please confirm.`,
        type: 'general', relatedId: request.id,
      })));

      // Notify customer
      await Notification.create({
        userId: req.user.id, title: 'Payment Submitted — Awaiting Confirmation',
        message: `Your ${methodInfo.label} payment for ticket #${request.ticketNumber} has been submitted and is awaiting admin confirmation.`,
        type: 'general', relatedId: request.id,
      });

      res.json({
        message: 'Mobile money payment submitted. Admin will confirm shortly.',
        paymentId: payment.id,
        instructions: {
          method: methodInfo.label,
          businessNumber: businessNums[method],
          accountRef: `KIRATECH-${request.ticketNumber}`,
          amount: parseFloat(request.finalCost),
          currency: methodInfo.currency,
          note: `Send exactly ${parseFloat(request.finalCost).toFixed(2)} ${methodInfo.currency} to ${businessNums[method]} with reference KIRATECH-${request.ticketNumber}`,
        },
      });
    } catch (err) {
      console.error('Mobile money error:', err);
      res.status(500).json({ error: 'Failed to submit mobile money payment' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/payments/crypto  — Binance Pay / USDT payment submission
// Customer provides TX hash after sending; admin confirms
// ═══════════════════════════════════════════════════════════════════════════
router.post('/crypto', authenticate, requireVerified,
  [
    body('requestId').notEmpty().isUUID(),
    body('network').isIn(['BEP20', 'TRC20', 'ERC20']).withMessage('Network must be BEP20, TRC20, or ERC20'),
    body('txHash').notEmpty().withMessage('Transaction hash required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const { request, error, status } = await validatePayableRequest(req.body.requestId, req.user.id);
      if (error) return res.status(status).json({ error });

      const { network, txHash } = req.body;
      const addresses   = getCryptoAddresses();
      const amountCents = Math.round(parseFloat(request.finalCost) * 100);

      const payment = await Payment.create({
        requestId: request.id, userId: req.user.id,
        paymentMethod: 'binance', providerRef: txHash,
        cryptoAddress: addresses[network], cryptoNetwork: network,
        amount: amountCents, currency: 'usdt',
        status: 'awaiting_confirmation',
        notes: `USDT ${network} TX: ${txHash}`,
      });

      // Notify admins
      const admins = await User.findAll({ where: { role: 'admin', isActive: true } });
      await Promise.all(admins.map(a => Notification.create({
        userId: a.id, title: 'Crypto Payment Pending Confirmation',
        message: `${req.user.name} submitted USDT (${network}) for ticket #${request.ticketNumber}. TX: ${txHash.slice(0, 20)}... Please verify on-chain.`,
        type: 'general', relatedId: request.id,
      })));

      await Notification.create({
        userId: req.user.id, title: 'Crypto Payment Submitted',
        message: `Your USDT payment for ticket #${request.ticketNumber} has been submitted (TX: ${txHash.slice(0, 20)}...). Admin is verifying.`,
        type: 'general', relatedId: request.id,
      });

      res.json({
        message: 'Crypto payment submitted. Admin will verify on-chain and confirm.',
        paymentId: payment.id,
        network, txHash,
        verifyUrl: network === 'BEP20'
          ? `https://bscscan.com/tx/${txHash}`
          : network === 'TRC20'
          ? `https://tronscan.org/#/transaction/${txHash}`
          : `https://etherscan.io/tx/${txHash}`,
      });
    } catch (err) {
      console.error('Crypto payment error:', err);
      res.status(500).json({ error: 'Failed to submit crypto payment' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/payments/admin/confirm/:paymentId  — Admin manually confirms payment
// Used for mobile money and crypto after verification
// ═══════════════════════════════════════════════════════════════════════════
router.put('/admin/confirm/:paymentId', authenticate, requireVerified, authorize('admin'),
  [body('notes').optional().trim()],
  async (req, res) => {
    try {
      const payment = await Payment.findByPk(req.params.paymentId);
      if (!payment) return res.status(404).json({ error: 'Payment record not found' });
      if (payment.status === 'succeeded') return res.status(400).json({ error: 'Payment already confirmed' });

      await payment.update({
        status: 'succeeded', paidAt: new Date(),
        adminConfirmedBy: req.user.id,
        notes: req.body.notes || payment.notes,
      });

      const request = await ServiceRequest.findByPk(payment.requestId, {
        include: [{ model: User, as: 'customer' }],
      });
      if (request) {
        const methodLabel = MOBILE_METHODS[payment.paymentMethod]?.label ||
          CRYPTO_METHODS[payment.paymentMethod]?.label || payment.paymentMethod;
        await markRequestPaid(payment, request, methodLabel);

        // Email confirmation
        if (request.customer) {
          await sendEmail({
            to: request.customer.email,
            subject: `Payment Confirmed — Ticket #${request.ticketNumber}`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px">
              <h2 style="color:#16a34a">✅ Payment Confirmed</h2>
              <p>Hi <strong>${request.customer.name}</strong>, your payment has been verified and confirmed.</p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Ticket</td><td style="padding:8px;border:1px solid #eee">#${request.ticketNumber}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Method</td><td style="padding:8px;border:1px solid #eee">${methodLabel}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Amount</td><td style="padding:8px;border:1px solid #eee;color:#16a34a;font-weight:bold">${(payment.amount/100).toFixed(2)} ${payment.currency.toUpperCase()}</td></tr>
                <tr><td style="padding:8px;border:1px solid #eee;font-weight:bold">Date</td><td style="padding:8px;border:1px solid #eee">${new Date().toLocaleString()}</td></tr>
              </table>
              <p>Thank you for using KIRATECH IT Support!</p></div>`,
          });
        }
      }
      res.json({ message: 'Payment confirmed successfully' });
    } catch (err) {
      console.error('Confirm payment error:', err);
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/request/:requestId  — get payment info for a request
// ═══════════════════════════════════════════════════════════════════════════
router.get('/request/:requestId', authenticate, requireVerified, async (req, res) => {
  try {
    const request = await ServiceRequest.findByPk(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const payment = await Payment.findOne({
      where: { requestId: req.params.requestId },
      order: [['createdAt', 'DESC']],
    });
    res.json({
      payment: payment ? {
        id: payment.id, status: payment.status,
        paymentMethod: payment.paymentMethod,
        amount: payment.amount / 100, currency: payment.currency,
        receiptUrl: payment.receiptUrl, paidAt: payment.paidAt,
        providerRef: payment.providerRef, cryptoNetwork: payment.cryptoNetwork,
        createdAt: payment.createdAt,
      } : null,
    });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch payment info' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/payments/admin/set-cost/:requestId  — admin sets final cost
// ═══════════════════════════════════════════════════════════════════════════
router.put('/admin/set-cost/:requestId', authenticate, requireVerified, authorize('admin'),
  [
    body('finalCost').isFloat({ min: 0 }),
    body('estimatedCost').optional().isFloat({ min: 0 }),
    body('waive').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    try {
      const request = await ServiceRequest.findByPk(req.params.requestId, {
        include: [{ model: User, as: 'customer' }],
      });
      if (!request) return res.status(404).json({ error: 'Request not found' });
      if (request.status !== 'completed') return res.status(400).json({ error: 'Can only set cost on completed requests' });
      if (request.paymentStatus === 'paid') return res.status(400).json({ error: 'Already paid' });
      const updates = { finalCost: parseFloat(req.body.finalCost) };
      if (req.body.estimatedCost) updates.estimatedCost = parseFloat(req.body.estimatedCost);
      if (req.body.waive === true || req.body.waive === 'true') updates.paymentStatus = 'waived';
      await request.update(updates);
      if (request.customer) {
        await Notification.create({
          userId: request.userId,
          title: updates.paymentStatus === 'waived' ? 'Payment Waived' : 'Invoice Ready',
          message: updates.paymentStatus === 'waived'
            ? `Payment for ticket #${request.ticketNumber} has been waived.`
            : `Invoice for ticket #${request.ticketNumber} is ready. Amount: $${updates.finalCost.toFixed(2)}`,
          type: 'general', relatedId: request.id,
        });
      }
      res.json({ message: updates.paymentStatus === 'waived' ? 'Payment waived' : 'Cost set', finalCost: updates.finalCost });
    } catch (err) {
      console.error('Set cost error:', err);
      res.status(500).json({ error: 'Failed to set cost' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/payments/admin/history
// ═══════════════════════════════════════════════════════════════════════════
router.get('/admin/history', authenticate, requireVerified, authorize('admin'), async (req, res) => {
  try {
    const { paginate, paginateResponse } = require('../utils/helpers');
    const { page, limit, status } = req.query;
    const { limit: lim, offset, page: pg } = paginate(page, limit || 20);
    const where = {};
    if (status) where.status = status;
    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [
        { model: ServiceRequest, as: 'request', attributes: ['id', 'ticketNumber', 'title'] },
        { model: User, as: 'payer', attributes: ['id', 'name', 'email'] },
      ],
      order: [['createdAt', 'DESC']], limit: lim, offset,
    });
    const formatted = rows.map(p => ({
      id: p.id, ticketNumber: p.request?.ticketNumber, title: p.request?.title,
      customer: p.payer?.name, customerEmail: p.payer?.email,
      amount: p.amount / 100, currency: p.currency,
      paymentMethod: p.paymentMethod, status: p.status,
      receiptUrl: p.receiptUrl, providerRef: p.providerRef,
      cryptoNetwork: p.cryptoNetwork, paidAt: p.paidAt, createdAt: p.createdAt,
    }));
    res.json(paginateResponse(formatted, pg, lim, count));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch payment history' }); }
});

// ═══════════════════════════════════════════════════════════════════════════
// Stripe webhook (raw body — mounted separately in server.js)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    if (!webhookSecret || webhookSecret.startsWith('whsec_your')) {
      event = JSON.parse(req.body.toString());
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    }
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }
  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const payment = await Payment.findOne({ where: { stripePaymentIntentId: pi.id } });
      if (!payment) return res.json({ received: true });
      let receiptUrl = null;
      try {
        if (pi.latest_charge) {
          const charge = await stripe.charges.retrieve(pi.latest_charge);
          receiptUrl = charge.receipt_url;
        }
      } catch (_) {}
      await payment.update({ status: 'succeeded', receiptUrl, paidAt: new Date() });
      const request = await ServiceRequest.findByPk(payment.requestId, { include: [{ model: User, as: 'customer' }] });
      if (request) await markRequestPaid(payment, request, 'Card (Stripe)');
    } else if (event.type === 'payment_intent.payment_failed') {
      const payment = await Payment.findOne({ where: { stripePaymentIntentId: event.data.object.id } });
      if (payment) await payment.update({ status: 'failed' });
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
