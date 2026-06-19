const nodemailer = require('nodemailer');

const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = emailHost.includes('gmail') ? 465 : Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailPort === 465,
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const BRAND = {
  name: "Training Club",
  email: 'hello@trainingclub.example',
  url: process.env.FRONTEND_URL || 'http://localhost:5173',
  color: '#8B2FC9',
};

// Admin notifications go to ADMIN_EMAIL falling back to the club email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || BRAND.email;

function template(title, body) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
        <!-- Header -->
        <tr>
          <td style="background:${BRAND.color};padding:28px 32px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:11px;letter-spacing:3px;text-transform:uppercase;opacity:0.8;">TRAINING CLUB</p>
            <h1 style="margin:6px 0 0;color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">${title}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#444;font-size:12px;">123 Main Street · Your Town · Est. 2021</p>
            <p style="margin:6px 0 0;font-size:12px;">
              <a href="${BRAND.url}" style="color:${BRAND.color};text-decoration:none;">trainingclub.example</a>
              &nbsp;·&nbsp;
              <a href="mailto:${BRAND.email}" style="color:#444;text-decoration:none;">${BRAND.email}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function text(t) {
  return `<p style="margin:0 0 16px;color:#ccc;font-size:15px;line-height:1.6;">${t}</p>`;
}
function btn(label, url) {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="background:${BRAND.color};color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;display:inline-block;">${label}</a>
  </div>`;
}
function highlight(content) {
  return `<div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px 20px;margin:16px 0;">${content}</div>`;
}
function detailRow(label, value) {
  return `<p style="margin:6px 0;color:#999;font-size:13px;"><span style="color:#666;">${label}:</span> <strong style="color:#ccc;">${value}</strong></p>`;
}

async function sendMail(mail) {
  if (process.env.RESEND_API_KEY) {
    const from = process.env.RESEND_FROM || `"Training Club" <noreply@trainingclub.example>`;
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(mail.to) ? mail.to : [mail.to],
        subject: mail.subject,
        html: mail.html,
        reply_to: mail.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend failed (${response.status}): ${error}`);
    }
    return response.json();
  }

  return transporter.sendMail(mail);
}

// ── EMAILS ──────────────────────────────────────────────

async function sendWelcome(user) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: user.email,
    subject: `Welcome to Training Club, ${user.full_name.split(' ')[0]}!`,
    html: template('Welcome Aboard!', `
      ${text(`Hey ${user.full_name.split(' ')[0]}, welcome to <strong style="color:#fff;">Training Club</strong> — Training Club and fitness studio.`)}
      ${text(`You're one step away from your free first class. Just sign the waiver and you're good to go.`)}
      ${btn('Sign Waiver & Book Free Class', `${BRAND.url}/dashboard`)}
      ${highlight(`
        ${detailRow('Email', user.email)}
        ${detailRow('Experience', user.experience_level || 'Beginner')}
        ${detailRow('Location', '123 Main Street, Your Town')}
      `)}
      ${text(`Any questions? Just reply to this email — we're always happy to help.`)}
      <p style="margin:24px 0 0;color:#555;font-size:13px;">See you in class.</p>
    `),
  });
}

async function sendWaiverConfirmation(user) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: user.email,
    subject: `Waiver signed — you're ready to train! `,
    html: template('Waiver Signed ', `
      ${text(`Hi ${user.full_name.split(' ')[0]}, your participation waiver has been signed and saved.`)}
      ${text(`You're now fully registered and ready to train at Training Club. Book your first class or activate your membership below.`)}
      ${btn('Go to My Dashboard', `${BRAND.url}/dashboard`)}
      ${highlight(`
        <p style="margin:0;color:#888;font-size:13px;">Classes run <strong style="color:#ccc;">Mon–Fri evenings</strong> at 123 Main Street, Your Town.</p>
        <p style="margin:8px 0 0;color:#888;font-size:13px;">Email us at <a href="mailto:${BRAND.email}" style="color:${BRAND.color};">${BRAND.email}</a> for the current timetable.</p>
      `)}
    `),
  });
}

async function sendPaymentConfirmation(user, membership) {
  const labels = { monthly: 'Unlimited Monthly Membership', limited_monthly: '2 Classes Weekly Membership', drop_in: 'Drop-In Class', free_class: 'Free Trial Class' };
  const amounts = { monthly: '€80.00', limited_monthly: '€60.00', drop_in: '€10.00', free_class: '€0.00' };
  const label = labels[membership.type] || membership.type;
  const amount = amounts[membership.type] || '—';
  const expires = membership.expires_at
    ? new Date(membership.expires_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: user.email,
    subject: `Payment confirmed — ${label} `,
    html: template('Payment Confirmed', `
      ${text(`Hi ${user.full_name.split(' ')[0]}, your payment was successful. Here's your receipt:`)}
      ${highlight(`
        ${detailRow('Membership', label)}
        ${detailRow('Amount paid', amount)}
        ${detailRow('Valid until', expires)}
        ${detailRow('Status', 'Active ')}
      `)}
      ${btn('View My Membership', `${BRAND.url}/dashboard`)}
      ${text(`Classes run Mon–Fri evenings at 123 Main Street, Your Town. See you on the mats!`)}
    `),
  });
}

async function sendPasswordReset(user, resetUrl) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: user.email,
    subject: `Reset your password — Training Club`,
    html: template('Reset Your Password', `
      ${text(`Hi ${user.full_name.split(' ')[0]}, we received a request to reset your password.`)}
      ${btn('Reset Password', resetUrl)}
      ${text(`This link expires in <strong style="color:#fff;">1 hour</strong>. If you didn't request this, ignore this email — your account is safe.`)}
      <p style="margin:16px 0 0;color:#555;font-size:12px;text-align:center;">Or paste this link into your browser:<br><span style="color:#666;word-break:break-all;">${resetUrl}</span></p>
    `),
  });
}

async function sendFreeClassNotification(user) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: ADMIN_EMAIL,
    subject: `New free class booking — ${user.full_name}`,
    html: template('Free Class Booked', `
      ${text(`A new member has booked their <strong style="color:#fff;">free trial class</strong> and will be coming in to train.`)}
      ${highlight(`
        ${detailRow('Name', user.full_name)}
        ${detailRow('Email', user.email)}
        ${detailRow('Phone', user.phone || 'Not provided')}
        ${detailRow('Experience', user.experience_level || 'Beginner')}
        ${detailRow('Booked', new Date().toLocaleString('en-IE', { dateStyle: 'full', timeStyle: 'short' }))}
      `)}
      ${btn('View in Admin Panel', `${BRAND.url}/admin`)}
      ${text(`Reply directly to this email or contact <a href="mailto:${user.email}" style="color:${BRAND.color};">${user.email}</a> to confirm their session time.`)}
    `),
  });
}

async function sendContactMessage({ name, email, message }) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `New contact message from ${name}`,
    html: template('New Message ', `
      ${text(`You've received a new message from the website contact form.`)}
      ${highlight(`
        ${detailRow('Name', name)}
        ${detailRow('Email', `<a href="mailto:${email}" style="color:${BRAND.color};">${email}</a>`)}
        ${detailRow('Sent', new Date().toLocaleString('en-IE', { dateStyle: 'full', timeStyle: 'short' }))}
      `)}
      <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px 20px;margin:16px 0;">
        <p style="margin:0 0 6px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Message</p>
        <p style="margin:0;color:#ccc;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</p>
      </div>
      <p style="margin:16px 0 0;color:#555;font-size:13px;">Hit Reply to respond directly to ${name}.</p>
    `),
  });
}

async function sendRenewalReminder(user, membership) {
  const expires = new Date(membership.expires_at).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
  const label = membership.type === 'limited_monthly' ? '2 Classes Weekly Membership' : membership.type === 'monthly' ? 'Unlimited Monthly Membership' : 'Drop-In Class';
  const renewFrom = membership.type === 'limited_monthly' ? '€60 / month' : '€80 / month';

  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: user.email,
    subject: `Your ${label} expires in 7 days — renew now`,
    html: template('Membership Expiring Soon', `
      ${text(`Hey ${user.full_name.split(' ')[0]}, just a heads up — your <strong style="color:#fff;">${label}</strong> expires on <strong style="color:#fff;">${expires}</strong>.`)}
      ${text(`Don't let your membership lapse. Renew now to keep training without any gap.`)}
      ${btn('Renew My Membership', `${BRAND.url}/dashboard`)}
      ${highlight(`
        ${detailRow('Membership', label)}
        ${detailRow('Expires', expires)}
        ${detailRow('Renew from', renewFrom)}
      `)}
      ${text(`Any questions? Just reply to this email and we'll sort you out.`)}
      <p style="margin:24px 0 0;color:#555;font-size:13px;">See you in class.</p>
    `),
  });
}

async function sendDropInBookingNotification(user, classPreference) {
  await sendMail({
    from: `"Training Club" <${BRAND.email}>`,
    to: ADMIN_EMAIL,
    subject: `Drop-in class booked — ${user.full_name}`,
    html: template('Drop-In Booked ', `
      ${text(`A member has paid for a <strong style="color:#fff;">drop-in class</strong>.`)}
      ${highlight(`
        ${detailRow('Name', user.full_name)}
        ${detailRow('Email', `<a href="mailto:${user.email}" style="color:${BRAND.color};">${user.email}</a>`)}
        ${detailRow('Phone', user.phone || 'Not provided')}
        ${detailRow('Class', `<strong style="color:#fff;">${classPreference || 'No preference given'}</strong>`)}
        ${detailRow('Paid', '€10.00')}
        ${detailRow('Booked', new Date().toLocaleString('en-IE', { dateStyle: 'full', timeStyle: 'short' }))}
      `)}
      ${btn('View in Admin Panel', `${BRAND.url}/admin`)}
    `),
  });
}

module.exports = { sendWelcome, sendWaiverConfirmation, sendPaymentConfirmation, sendPasswordReset, sendFreeClassNotification, sendContactMessage, sendRenewalReminder, sendDropInBookingNotification };
