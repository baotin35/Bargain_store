const express = require('express');
const router = express.Router();
const { sendEmail, sendSms } = require('../utils/notifier');

// POST /api/notify/sms
router.post('/sms', async (req, res) => {
  const { to, body, name } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'Missing to or body' });
  try {
    await sendSms({ to, body });
    res.json({ ok: true, message: `SMS sent to ${name || to}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notify/email
router.post('/email', async (req, res) => {
  const { to, toName, subject, html, text } = req.body;
  if (!to || !subject) return res.status(400).json({ error: 'Missing to or subject' });
  try {
    const htmlBody = html || `<p>${(text || '').replace(/\n/g, '<br>')}</p>`;
    await sendEmail({ to, toName, subject, html: htmlBody });
    res.json({ ok: true, message: `Email sent to ${toName || to}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
