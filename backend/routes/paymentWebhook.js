/**
 * Stripe webhook handler — receives raw body, verifies signature, processes events.
 * Mounted in server.js BEFORE express.json() so the raw buffer is intact.
 */
const { Payment, ServiceRequest, Notification, User } = require('../models');
const { sendEmail } = require('../utils/email');

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith('sk_test_your')) return null;
  return require('stripe')(key);
}

module.exports = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });

  const sig           = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  if (!webhookSecret || webhookSecret.startsWith('whsec_your')) {
    // Development: parse raw body manually, skip signature check
    console.warn('⚠️  Stripe webhook: signature check skipped (dev mode)');
    try {
      event = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  } else {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature failed:', err.message);
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const payment = await Payment.findOne({ where: { stripePaymentIntentId: pi.id } });
      if (!payment) {
        console.warn(`Webhook: no Payment row for intent ${pi.id}`);
        return res.json({ received: true });
      }

      // Retrieve receipt URL from charge
      let receiptUrl = null;
      try {
        if (pi.latest_charge) {
          const charge = await stripe.charges.retrieve(pi.latest_charge);
          receiptUrl = charge.receipt_url;
        }
      } catch (_) {}

      await payment.update({ status: 'succeeded', receiptUrl, paidAt: new Date() });

      const request = await ServiceRequest.findByPk(payment.requestId, {
        include: [{ model: User, as: 'customer' }],
      });

      if (request) {
        await request.update({ paymentStatus: 'paid' });

        await Notification.create({
          userId: payment.userId,
          title: '✅ Payment Successful',
          message: `Your payment of $${(payment.amount / 100).toFixed(2)} for ticket #${request.ticketNumber} was confirmed.`,
          type: 'general',
          relatedId: request.id,
        });

        const admins = await User.findAll({ where: { role: 'admin', isActive: true } });
        await Promise.all(
          admins.map((a) =>
            Notification.create({
              userId: a.id,
              title: 'Payment Received',
              message: `$${(payment.amount / 100).toFixed(2)} received for ticket #${request.ticketNumber} from ${request.customer?.name}.`,
              type: 'general',
              relatedId: request.id,
            })
          )
        );

        if (request.customer) {
          await sendEmail({
            to: request.customer.email,
            subject: `Payment Confirmed — Ticket #${request.ticketNumber}`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:580px;margin:auto;padding:24px;background:#fff">
                <div style="background:#1d4ed8;padding:20px 24px;border-radius:8px 8px 0 0">
                  <h1 style="color:#fff;margin:0;font-size:18px">🔧 KIRATECH IT Support</h1>
                </div>
                <div style="padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
                  <h2 style="color:#16a34a;margin-top:0">✅ Payment Confirmed</h2>
                  <p>Hi <strong>${request.customer.name}</strong>, your payment has been successfully processed.</p>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0">
                    <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Ticket #</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${request.ticketNumber}</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Amount Paid</td><td style="padding:8px 12px;border:1px solid #e2e8f0;color:#16a34a;font-weight:bold">$${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()}</td></tr>
                    <tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Date</td><td style="padding:8px 12px;border:1px solid #e2e8f0">${new Date().toLocaleString()}</td></tr>
                    ${receiptUrl ? `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;font-weight:600">Receipt</td><td style="padding:8px 12px;border:1px solid #e2e8f0"><a href="${receiptUrl}" style="color:#1d4ed8">View Stripe Receipt</a></td></tr>` : ''}
                  </table>
                  <p>Thank you for choosing KIRATECH IT Support!</p>
                </div>
              </div>`,
          });
        }
      }
      console.log(`✅ Payment succeeded: ${pi.id} — $${(pi.amount / 100).toFixed(2)}`);
    }

    else if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const payment = await Payment.findOne({ where: { stripePaymentIntentId: pi.id } });
      if (payment) {
        await payment.update({ status: 'failed' });
        console.log(`❌ Payment failed: ${pi.id}`);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
};
