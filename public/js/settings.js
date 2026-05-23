async function loadSettings() {
  const cfg = await API.get('/api/settings');
  document.getElementById('email-enabled').checked   = cfg.email?.enabled || false;
  document.getElementById('email-user').value        = cfg.email?.user || '';
  document.getElementById('email-pass').value        = cfg.email?.pass || '';
  document.getElementById('email-fromname').value    = cfg.email?.fromName || 'Mom and Pop';
  document.getElementById('sms-enabled').checked     = cfg.sms?.enabled || false;
  document.getElementById('sms-sid').value           = cfg.sms?.accountSid || '';
  document.getElementById('sms-token').value         = cfg.sms?.authToken || '';
  document.getElementById('sms-from').value          = cfg.sms?.fromNumber || '';
}

async function saveSettings() {
  const body = {
    emailEnabled:  document.getElementById('email-enabled').checked,
    emailUser:     document.getElementById('email-user').value,
    emailPass:     document.getElementById('email-pass').value,
    emailFromName: document.getElementById('email-fromname').value,
    smsEnabled:    document.getElementById('sms-enabled').checked,
    smsSid:        document.getElementById('sms-sid').value,
    smsToken:      document.getElementById('sms-token').value,
    smsFrom:       document.getElementById('sms-from').value,
  };
  await API.post('/api/settings', body);
  const status = document.getElementById('save-status');
  status.style.display = 'inline';
  setTimeout(() => status.style.display = 'none', 3000);
}

async function testEmail() {
  const to = document.getElementById('test-email').value.trim();
  if (!to) return alert('Enter a test email address first.');
  showTestResult('Sending...', '#555');
  try {
    const r = await API.post('/api/notify/email', {
      to, toName: 'Test',
      subject: 'Mom and Pop Test Email',
      html: '<h2>It works! 🎉</h2><p>Your Mom and Pop email is configured correctly. You can now send birthday promos, win-back messages, and more!</p>',
    });
    showTestResult('✅ ' + r.message, '#2e7d32');
  } catch (err) {
    showTestResult('❌ ' + err.message, '#c62828');
  }
}

async function testSms() {
  const to = document.getElementById('test-phone').value.trim();
  if (!to) return alert('Enter a test phone number (E.164 format: +15551234567).');
  showTestResult('Sending...', '#555');
  try {
    const r = await API.post('/api/notify/sms', {
      to, body: 'Mom and Pop test SMS — it works! Your SMS is configured correctly.',
    });
    showTestResult('✅ ' + r.message, '#2e7d32');
  } catch (err) {
    showTestResult('❌ ' + err.message, '#c62828');
  }
}

function showTestResult(msg, color) {
  const el = document.getElementById('test-result');
  el.textContent = msg;
  el.style.color = color;
  el.style.display = 'block';
}

loadSettings().catch(() => location.href = 'index.html');
