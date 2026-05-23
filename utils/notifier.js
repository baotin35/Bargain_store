const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'config.json');

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { email: {}, sms: {} };
  }
}

async function sendEmail({ to, toName, subject, html }) {
  const cfg = loadConfig().email || {};
  if (!cfg.user || !cfg.pass) throw new Error('Email not configured. Go to Settings to add your Gmail credentials.');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({
    from: `"${cfg.fromName || 'Mom and Pop'}" <${cfg.user}>`,
    to: toName ? `"${toName}" <${to}>` : to,
    subject,
    html,
  });
}

async function sendSms({ to, body }) {
  const cfg = loadConfig().sms || {};
  if (!cfg.accountSid || !cfg.authToken || !cfg.fromNumber) {
    throw new Error('SMS not configured. Go to Settings to add your Twilio credentials.');
  }

  const twilio = require('twilio')(cfg.accountSid, cfg.authToken);
  await twilio.messages.create({ body, from: cfg.fromNumber, to });
}

module.exports = { sendEmail, sendSms, loadConfig };
