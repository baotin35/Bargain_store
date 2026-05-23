const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'config.json');

const DEFAULT = {
  email: { enabled: false, user: '', pass: '', fromName: 'Mom and Pop' },
  sms:   { enabled: false, accountSid: '', authToken: '', fromNumber: '' },
};

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); }
  catch { return { ...DEFAULT }; }
}

router.get('/', (req, res) => {
  const cfg = readConfig();
  // Mask secrets before sending to client
  const safe = JSON.parse(JSON.stringify(cfg));
  if (safe.email?.pass) safe.email.pass = '••••••••';
  if (safe.sms?.authToken) safe.sms.authToken = '••••••••';
  res.json(safe);
});

router.post('/', (req, res) => {
  const current = readConfig();
  const body = req.body;

  const next = {
    email: {
      enabled:  body.emailEnabled === true || body.emailEnabled === 'true',
      user:     body.emailUser     || current.email?.user     || '',
      pass:     body.emailPass && body.emailPass !== '••••••••' ? body.emailPass : (current.email?.pass || ''),
      fromName: body.emailFromName || current.email?.fromName || 'Mom and Pop',
    },
    sms: {
      enabled:    body.smsEnabled === true || body.smsEnabled === 'true',
      accountSid: body.smsSid       || current.sms?.accountSid  || '',
      authToken:  body.smsToken && body.smsToken !== '••••••••' ? body.smsToken : (current.sms?.authToken || ''),
      fromNumber: body.smsFrom      || current.sms?.fromNumber   || '',
    },
  };

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2));
  res.json({ ok: true });
});

module.exports = router;
