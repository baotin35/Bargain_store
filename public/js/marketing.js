const TIER_STYLE = {
  Bronze:   { bg: '#fbe9e7', color: '#bf360c', icon: '🥉' },
  Silver:   { bg: '#f5f5f5', color: '#616161', icon: '🥈' },
  Gold:     { bg: '#fff8e1', color: '#f57f17', icon: '🥇' },
  Platinum: { bg: '#e8eaf6', color: '#283593', icon: '💎' },
};

const SMS_TEMPLATES = [
  { label: '👋 Win-Back',      text: 'Hi {name}! We miss you at Mom and Pop. Come in this week and enjoy 10% off your purchase. See you soon!' },
  { label: '🎂 Birthday',      text: 'Happy Birthday {name}! 🎉 Enjoy 15% off your next visit this week — our gift to you! Show this text at checkout.' },
  { label: '🥇 Tier Upgrade',  text: 'Hi {name}! Great news — you just reached {tier} status! Enjoy exclusive discounts on your next visit. Thank you for your loyalty!' },
  { label: '📦 Flash Sale',    text: 'Hi {name}! Flash Sale TODAY ONLY at Mom and Pop — up to 20% off select items. Limited stock, first come first served!' },
  { label: '🤝 Refer a Friend',text: 'Hi {name}! Bring a friend to Mom and Pop and you BOTH get $3 off your next purchase. More friends = more savings!' },
];

let currentListing = null;
let marketingData = null;

function tierBadge(tier) {
  const t = TIER_STYLE[tier] || TIER_STYLE.Bronze;
  return `<span style="background:${t.bg};color:${t.color};padding:2px 8px;border-radius:20px;font-size:0.78rem;font-weight:700;">${t.icon} ${tier || 'Bronze'}</span>`;
}

async function loadMarketing() {
  marketingData = await API.get('/api/marketing');
  const d = marketingData;

  document.getElementById('member-total').textContent  = fmtCurrency(d.memberTotal);
  document.getElementById('walkin-total').textContent  = fmtCurrency(d.walkInTotal);
  document.getElementById('new-members').textContent   = d.newMembersCount;
  document.getElementById('at-risk-count').textContent = d.atRisk.length;
  document.getElementById('slow-count').textContent    = d.slowMovers.length;
  document.getElementById('bday-count').textContent    = d.upcomingBirthdays.length;

  renderSlowMovers(d.slowMovers);
  renderTopCustomers(d.topCustomers);
  renderTopProducts(d.topProducts);
  renderAtRisk(d.atRisk);
  renderBirthdays(d.upcomingBirthdays);
  renderCatChart(d.revenueByCategory);
  renderSmsTemplates();
}

// ── Slow Movers ───────────────────────────────────────────
function renderSlowMovers(items) {
  const tbody = document.getElementById('slow-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#2e7d32;">✓ No slow-moving items — great turnover!</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(p => {
    const salePrice = (Number(p.price) * 0.85).toFixed(2);
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-info">${p.category}</span></td>
        <td>${fmtCurrency(p.price)}</td>
        <td><span class="badge badge-warning">${p.stock} ${p.unit}</span></td>
        <td>${p.soldLast30 === 0 ? '<span style="color:#c62828;">0</span>' : p.soldLast30}</td>
        <td><strong style="color:#2e7d32;">$${salePrice}</strong> <small style="color:#888;">(-15%)</small></td>
        <td>
          <button class="btn btn-primary btn-sm" onclick='generateListing(${JSON.stringify(p).replace(/'/g,"&#39;")}, ${salePrice})'>
            📋 Generate Post
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function generateListing(product, salePrice) {
  const listing = `🏷️ ${product.name} — SALE $${salePrice} (reg. $${Number(product.price).toFixed(2)})

📦 ${product.stock} ${product.unit} available

${product.name} in great condition, selling at a discount to clear inventory.

Category: ${product.category}
Condition: New / Store Stock
Price: $${salePrice} each (or best offer)

✅ Available for pickup
✅ Local sale only
✅ First come, first served

Contact us to arrange pickup. Cash, Venmo, Zelle accepted.

#${product.category.replace(/\s/g,'')} #forsale #deals #${product.name.split(' ')[0].replace(/[^a-zA-Z]/g,'')}`;

  currentListing = { product, salePrice, listing };
  document.getElementById('listing-text').value = listing;
  document.getElementById('listing-modal').classList.add('open');
}

function closeListing() {
  document.getElementById('listing-modal').classList.remove('open');
  currentListing = null;
}

function openFB() {
  window.open('https://www.facebook.com/marketplace/create/item', '_blank');
}

function openCL() {
  window.open('https://post.craigslist.org/k/for-sale/d/for-sale-by-owner', '_blank');
}

function copyListing() {
  const text = document.getElementById('listing-text').value;
  navigator.clipboard.writeText(text).then(() => {
    const btn = event.target;
    btn.textContent = '✅ Copied!';
    setTimeout(() => btn.textContent = '📋 Copy Text', 2000);
  });
}

// ── Top Customers ─────────────────────────────────────────
function renderTopCustomers(customers) {
  const tbody = document.getElementById('top-customers');
  if (!customers.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#aaa;">No member sales yet</td></tr>';
    return;
  }
  tbody.innerHTML = customers.map((m, i) => `
    <tr>
      <td><strong>${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</strong></td>
      <td><strong>${m.name}</strong>${m.phone ? `<br><small style="color:#888;">${m.phone}</small>` : ''}</td>
      <td>${tierBadge(m.tier)}</td>
      <td>${Number(m.points || 0).toLocaleString()} pts</td>
      <td><strong style="color:#2e7d32;">${fmtCurrency(m.totalSpent)}</strong></td>
    </tr>
  `).join('');
}

// ── Top Products ──────────────────────────────────────────
function renderTopProducts(products) {
  const tbody = document.getElementById('top-products');
  if (!products.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#aaa;">No sales data yet</td></tr>';
    return;
  }
  tbody.innerHTML = products.map((p, i) => `
    <tr>
      <td><strong>${i + 1}</strong></td>
      <td>${p.name}</td>
      <td><span class="badge badge-info">${p.category}</span></td>
      <td><strong>${p.unitsSold}</strong> ${p.unit}</td>
      <td>${fmtCurrency(p.revenue)}</td>
    </tr>
  `).join('');
}

// ── At-Risk ───────────────────────────────────────────────
function renderAtRisk(customers) {
  const tbody = document.getElementById('at-risk');
  if (!customers.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:20px;color:#2e7d32;">✓ All customers are active!</td></tr>';
    return;
  }
  tbody.innerHTML = customers.map(m => `
    <tr>
      <td><strong>${m.name}</strong></td>
      <td>${m.phone || '—'}</td>
      <td>${m.lastVisit ? fmtDate(m.lastVisit) : '<span style="color:#aaa;">Never</span>'}</td>
      <td><span class="badge ${(m.daysSince||999) >= 60 ? 'badge-danger' : 'badge-warning'}">${m.daysSince !== null ? m.daysSince + ' days' : 'Never'}</span></td>
      <td style="white-space:nowrap;">
        ${m.phone ? `
          <button class="btn btn-outline btn-sm" onclick="copyWinBack('${m.name.replace(/'/g,"\\'")}','${m.phone}')">📋 Copy</button>
          <button class="btn btn-primary btn-sm" onclick="sendWinBackSms('${m.name.replace(/'/g,"\\'")}','${m.phone}')">📱 Send SMS</button>
        ` : '—'}
      </td>
    </tr>
  `).join('');
}

function copyWinBack(name, phone) {
  const msg = SMS_TEMPLATES[0].text.replace('{name}', name.split(' ')[0]);
  navigator.clipboard.writeText(msg).then(() => {
    showToast(`Win-back SMS copied for ${name}! Paste into your messages app.`);
  });
}

async function sendWinBackSms(name, phone) {
  const msg = SMS_TEMPLATES[0].text.replace('{name}', name.split(' ')[0]);
  await sendNotify('sms', { to: phone, body: msg, name });
}

// ── Birthdays ─────────────────────────────────────────────
function renderBirthdays(members) {
  const tbody = document.getElementById('bday-tbody');
  if (!members.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding:20px;color:#aaa;">No birthdays this week</td></tr>';
    return;
  }
  tbody.innerHTML = members.map(m => `
    <tr>
      <td><strong>${m.name}</strong></td>
      <td>${m.phone || '—'}</td>
      <td>🎂 ${m.birthday ? fmtDate(m.birthday) : '—'}</td>
      <td style="white-space:nowrap;">
        ${m.phone ? `<button class="btn btn-outline btn-sm" onclick="copyBdaySms('${m.name.replace(/'/g,"\\'")}')">📋 Copy SMS</button>
          <button class="btn btn-primary btn-sm" onclick="sendBdaySms('${m.name.replace(/'/g,"\\'")}','${m.phone}')">📱 Send SMS</button>` : ''}
        ${m.email ? `<button class="btn btn-warning btn-sm" onclick="sendBdayEmail('${m.name.replace(/'/g,"\\'")}','${m.email}')">📧 Send Email</button>` : ''}
        ${!m.phone && !m.email ? '—' : ''}
      </td>
    </tr>
  `).join('');
}

function copyBdaySms(name) {
  const msg = SMS_TEMPLATES[1].text.replace('{name}', name.split(' ')[0]);
  navigator.clipboard.writeText(msg).then(() => showToast(`Birthday SMS copied for ${name}!`));
}

async function sendBdaySms(name, phone) {
  const msg = SMS_TEMPLATES[1].text.replace('{name}', name.split(' ')[0]);
  await sendNotify('sms', { to: phone, body: msg, name });
}

async function sendBdayEmail(name, email) {
  const first = name.split(' ')[0];
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:2px solid #1a237e;border-radius:12px;">
      <h2 style="color:#1a237e;text-align:center;">🎂 Happy Birthday, ${first}!</h2>
      <p style="font-size:1.05rem;">We're celebrating YOU today! As our valued member, enjoy <strong>15% off</strong> your next visit this week — it's our birthday gift to you.</p>
      <div style="text-align:center;margin:20px 0;">
        <span style="background:#1a237e;color:#fff;padding:10px 24px;border-radius:6px;font-size:1.1rem;font-weight:700;">15% OFF — This Week Only</span>
      </div>
      <p style="color:#555;font-size:0.9rem;">Show this email at checkout. Valid for 7 days from your birthday. Cannot be combined with other offers.</p>
      <p style="color:#888;font-size:0.82rem;margin-top:20px;">— Mom and Pop Team</p>
    </div>`;
  await sendNotify('email', { to: email, toName: name, subject: `🎂 Happy Birthday ${first}! Your 15% off is waiting`, html });
}

async function sendNotify(type, data) {
  try {
    const r = await API.post(`/api/notify/${type}`, data);
    showToast('✅ ' + r.message, 'success');
  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  }
}

function showToast(msg, type = 'info') {
  const colors = { success: '#2e7d32', error: '#c62828', info: '#1a237e' };
  const toast = document.createElement('div');
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
    background: colors[type] || colors.info, color: '#fff',
    padding: '12px 20px', borderRadius: '8px', fontSize: '0.9rem',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)', maxWidth: '360px',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ── Category Chart ────────────────────────────────────────
function renderCatChart(categories) {
  const maxRev = Math.max(...categories.map(c => c.revenue), 1);
  const colors = ['#1a237e','#283593','#303f9f','#3949ab','#3f51b5','#5c6bc0','#7986cb','#9fa8da'];
  document.getElementById('cat-chart').innerHTML = categories.map((c, i) => `
    <div style="margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:3px;">
        <span style="font-weight:600;">${c.category}</span>
        <span style="color:#555;">${fmtCurrency(c.revenue)}</span>
      </div>
      <div style="background:#f0f2f5;border-radius:4px;height:10px;">
        <div style="width:${Math.round((c.revenue/maxRev)*100)}%;background:${colors[i%colors.length]};height:10px;border-radius:4px;"></div>
      </div>
    </div>
  `).join('') || '<p style="color:#aaa;text-align:center;padding:20px;">No sales data</p>';
}

// ── SMS Templates ─────────────────────────────────────────
function renderSmsTemplates() {
  document.getElementById('sms-templates').innerHTML = SMS_TEMPLATES.map((t, i) => `
    <div style="margin-bottom:10px;padding:10px 12px;background:#f5f6fa;border-radius:8px;cursor:pointer;border:1.5px solid transparent;"
      onclick="copySmsTemplate(${i})" onmouseover="this.style.borderColor='#1a237e'" onmouseout="this.style.borderColor='transparent'">
      <div style="font-weight:700;font-size:0.88rem;">${t.label}</div>
      <div style="font-size:0.8rem;color:#666;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.text.replace(/{[^}]+}/g,'...')}</div>
    </div>
  `).join('');
}

function copySmsTemplate(i) {
  navigator.clipboard.writeText(SMS_TEMPLATES[i].text).then(() => alert(`"${SMS_TEMPLATES[i].label}" template copied! Replace {name} and {tier} with the customer's details.`));
}

// ── Weekly Flyer ──────────────────────────────────────────
function printFlyer() {
  const items = marketingData ? marketingData.slowMovers.slice(0, 6) : [];
  document.getElementById('flyer-date').textContent =
    'Week of ' + new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  document.getElementById('flyer-items').innerHTML = items.length
    ? items.map(p => `
        <div style="border:2px solid #1a237e;border-radius:10px;padding:16px;text-align:center;">
          <div style="font-size:0.75rem;color:#888;text-transform:uppercase;">${p.category}</div>
          <div style="font-weight:700;margin:6px 0;font-size:0.95rem;">${p.name}</div>
          <div style="text-decoration:line-through;color:#aaa;font-size:0.85rem;">$${Number(p.price).toFixed(2)}</div>
          <div style="font-size:1.5rem;font-weight:800;color:#c62828;">$${(Number(p.price)*0.85).toFixed(2)}</div>
          <div style="font-size:0.75rem;color:#2e7d32;">SAVE ${Math.round(0.15*100)}%</div>
        </div>
      `).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#aaa;">No slow-moving items to feature this week!</div>';

  document.getElementById('weekly-flyer').style.display = 'block';
  setTimeout(() => { window.print(); document.getElementById('weekly-flyer').style.display = 'none'; }, 300);
}

loadMarketing().catch(() => location.href = 'index.html');
