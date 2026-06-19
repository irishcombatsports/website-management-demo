const express = require('express');
const Stripe = require('stripe');
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');
const { sendPaymentConfirmation, sendFreeClassNotification, sendDropInBookingNotification } = require('../email');
const { createAdminNotification } = require('../notifications');
const { getMembershipPeriod } = require('../billing');

const router = express.Router();

const getStripe = () => Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
  monthly:         { amount: 8000, currency: 'eur', name: 'Unlimited Monthly Membership', desc: 'Unlimited regular classes' },
  limited_monthly: { amount: 6000, currency: 'eur', name: '2 Classes Weekly Membership',   desc: 'Two regular classes per week' },
  drop_in:         { amount: 1000, currency: 'eur', name: 'Drop-In Class',                 desc: 'Single class · Subject to space' },
};

// Get publishable key for frontend
router.get('/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Create Stripe Checkout Session (hosted payment page)
router.post('/checkout', authenticate, async (req, res) => {
  try {
    const { type, class_preference, membership_period } = req.body;
    const stripe = getStripe();

    if (type === 'free_class') {
      // No payment needed — activate directly
      const existing = db.prepare("SELECT id FROM memberships WHERE user_id = ? AND type = 'free_class'").get(req.user.id);
      if (existing) return res.status(400).json({ error: 'Free class trial already used' });

      const starts = new Date().toISOString();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      db.prepare("INSERT INTO memberships (user_id, type, status, amount_paid, starts_at, expires_at) VALUES (?, 'free_class', 'active', 0, ?, ?)")
        .run(req.user.id, starts, expires);

      // Notify admin of free class booking
      const freeUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
      sendFreeClassNotification(freeUser).catch(err => console.error('Free class notification failed:', err));
      createAdminNotification({
        type: 'free_class',
        title: 'Free trial booked',
        body: `${freeUser.full_name} booked their free class.`,
        memberId: freeUser.id,
      });

      return res.json({ url: `${process.env.FRONTEND_URL}/dashboard?success=free_class` });
    }

    const plan = PLANS[type];
    if (!plan) return res.status(400).json({ error: 'Invalid membership type' });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    // Create or retrieve Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.full_name });
      customerId = customer.id;
      db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').run(customerId, user.id);
    }

    const period = ['monthly', 'limited_monthly'].includes(type) && membership_period === 'next' ? 'next' : 'current';

    const periodDescription = ['monthly', 'limited_monthly'].includes(type)
      ? (period === 'next' ? ' · Starts next month' : ' · Starts this month')
      : '';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: plan.currency,
          product_data: { name: plan.name, description: `${plan.desc}${periodDescription}` },
          unit_amount: plan.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=${type}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?cancelled=true`,
      metadata: { user_id: String(req.user.id), membership_type: type, class_preference: class_preference || '', membership_period: period },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'Could not create checkout session. Check your Stripe keys.' });
  }
});

// Confirm payment after Stripe purpleirects back (using session_id)
router.post('/confirm', authenticate, async (req, res) => {
  try {
    const { session_id, type } = req.body;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Check not already recorded
    const existing = db.prepare('SELECT id FROM memberships WHERE stripe_payment_intent_id = ?').get(session.payment_intent);
    if (existing) return res.json({ message: 'Already recorded' });

    const sessionType = session.metadata?.membership_type || type;
    const period = getMembershipPeriod(session.metadata?.membership_period === 'next' ? 'next' : 'current');
    const starts = ['monthly', 'limited_monthly'].includes(sessionType)
      ? period.starts
      : new Date().toISOString();
    const expires = ['monthly', 'limited_monthly'].includes(sessionType)
      ? period.expires
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const classPreference = session.metadata?.class_preference || '';
    const membershipResult = db.prepare("INSERT INTO memberships (user_id, type, status, stripe_payment_intent_id, amount_paid, starts_at, expires_at, class_preference) VALUES (?, ?, 'active', ?, ?, ?, ?, ?)")
      .run(req.user.id, sessionType, session.payment_intent, session.amount_total, starts, expires, classPreference);

    // Send payment confirmation email (non-blocking)
    const payUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const membership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(membershipResult.lastInsertRowid);
    sendPaymentConfirmation(payUser, membership).catch(err => console.error('Payment email failed:', err));
    if (sessionType === 'drop_in') {
      sendDropInBookingNotification(payUser, classPreference).catch(err => console.error('Drop-in notification failed:', err));
      createAdminNotification({
        type: 'drop_in',
        title: 'Drop-in class paid',
        body: `${payUser.full_name} paid for a drop-in class${classPreference ? `: ${classPreference}` : '.'}`,
        memberId: payUser.id,
      });
    } else if (['monthly', 'limited_monthly'].includes(sessionType)) {
      createAdminNotification({
        type: 'monthly',
        title: sessionType === 'limited_monthly' ? 'Limited monthly membership paid' : 'Monthly membership paid',
        body: `${payUser.full_name} paid for ${sessionType === 'limited_monthly' ? 'a 2 classes weekly membership' : 'a monthly membership'}${period.period === 'next' ? ' starting next month' : ''}.`,
        memberId: payUser.id,
      });
    }

    res.json({ message: 'Membership activated' });
  } catch (err) {
    console.error('Confirm error:', err);
    res.status(500).json({ error: 'Could not confirm payment' });
  }
});

// Stripe webhook (for production reliability)
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.payment_status === 'paid') {
      const { user_id, membership_type, class_preference, membership_period } = session.metadata;
      const existing = db.prepare('SELECT id FROM memberships WHERE stripe_payment_intent_id = ?').get(session.payment_intent);
      if (!existing) {
        const period = getMembershipPeriod(membership_period === 'next' ? 'next' : 'current');
        const starts = ['monthly', 'limited_monthly'].includes(membership_type)
          ? period.starts
          : new Date().toISOString();
        const expires = ['monthly', 'limited_monthly'].includes(membership_type)
          ? period.expires
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const webhookResult = db.prepare("INSERT INTO memberships (user_id, type, status, stripe_payment_intent_id, amount_paid, starts_at, expires_at, class_preference) VALUES (?, ?, 'active', ?, ?, ?, ?, ?)")
          .run(user_id, membership_type, session.payment_intent, session.amount_total, starts, expires, class_preference || '');
        console.log(`OK Membership activated for user ${user_id}: ${membership_type}`);
        // Send emails (non-blocking)
        const webhookUser = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
        const webhookMembership = db.prepare('SELECT * FROM memberships WHERE id = ?').get(webhookResult.lastInsertRowid);
        if (webhookUser) {
          sendPaymentConfirmation(webhookUser, webhookMembership).catch(err => console.error('Webhook payment email failed:', err));
          if (membership_type === 'drop_in') {
            sendDropInBookingNotification(webhookUser, class_preference || '').catch(err => console.error('Webhook drop-in notification failed:', err));
            createAdminNotification({
              type: 'drop_in',
              title: 'Drop-in class paid',
              body: `${webhookUser.full_name} paid for a drop-in class${class_preference ? `: ${class_preference}` : '.'}`,
              memberId: webhookUser.id,
            });
          } else if (['monthly', 'limited_monthly'].includes(membership_type)) {
            createAdminNotification({
              type: 'monthly',
              title: membership_type === 'limited_monthly' ? 'Limited monthly membership paid' : 'Monthly membership paid',
              body: `${webhookUser.full_name} paid for ${membership_type === 'limited_monthly' ? 'a 2 classes weekly membership' : 'a monthly membership'}${period.period === 'next' ? ' starting next month' : ''}.`,
              memberId: webhookUser.id,
            });
          }
        }
      }
    }
  }

  res.json({ received: true });
});

module.exports = router;
