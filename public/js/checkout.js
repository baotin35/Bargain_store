let cart = [];
let allMembers = [];
let currentPaymentMethod = 'cash';

function setPaymentMethod(method) {
  currentPaymentMethod = method;
  const isCard = method === 'credit_card' || method === 'debit_card';

  // Update button styles
  ['cash', 'credit_card', 'debit_card'].forEach(m => {
    const btn = document.getElementById('btn-' + m);
    if (m === method) {
      btn.style.background = '#1a237e';
      btn.style.color = '#fff';
      btn.style.borderColor = '#1a237e';
    } else {
      btn.style.background = '#fff';
      btn.style.color = '#444';
      btn.style.borderColor = '#ddd';
    }
  });

  // Toggle cash vs card UI
  document.getElementById('cash-fields').style.display  = isCard ? 'none' : 'block';
  document.getElementById('card-fields').style.display  = isCard ? 'block' : 'none';
  document.getElementById('change-row').style.display   = isCard ? 'none' : 'flex';

  const label = method === 'credit_card' ? '💳 Confirm Card Payment'
              : method === 'debit_card'  ? '🏦 Confirm Debit Payment'
              : '✅ Process Payment';
  document.getElementById('pay-btn').textContent = label;
}

// ── Scanner toast notification (non-blocking, keeps focus) ──
function scanToast(msg, type = 'error') {
  let toast = document.getElementById('scan-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'scan-toast';
    toast.style.cssText = `
      position:fixed; top:20px; left:50%; transform:translateX(-50%);
      padding:10px 22px; border-radius:8px; font-weight:600; font-size:0.95rem;
      z-index:9999; box-shadow:0 4px 16px rgba(0,0,0,0.18); transition:opacity 0.3s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#c62828' : '#2e7d32';
  toast.style.color = '#fff';
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ── Scanner indicator ──────────────────────────────────────
function setScannerReady(ready) {
  const inp = document.getElementById('barcode-input');
  const lbl = document.getElementById('scanner-status');
  inp.style.borderColor = ready ? '#2e7d32' : '#1a237e';
  if (lbl) lbl.textContent = ready ? '🟢 Scanner Ready' : '🔵 Scanner Active';
}

// ── Keep focus on barcode field unless user is in a payment field ──
const PAYMENT_FIELDS = ['amount-paid', 'discount', 'tax', 'member-select', 'phone-search'];

document.addEventListener('click', (e) => {
  const tag = e.target.tagName;
  const id  = e.target.id;
  // Allow focus on payment fields, qty inputs, buttons
  if (PAYMENT_FIELDS.includes(id)) return;
  if (tag === 'SELECT' || tag === 'BUTTON') return;
  if (e.target.closest('.modal-overlay')) return;
  // Return focus to scanner after a short delay (lets click complete first)
  setTimeout(() => document.getElementById('barcode-input').focus(), 50);
});

// ── Keyboard shortcut: press Escape to jump back to scanner ──
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('barcode-input').focus();
    document.getElementById('barcode-input').select();
  }
});

document.getElementById('barcode-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); scanBarcode(); }
});

async function scanBarcode() {
  const inp  = document.getElementById('barcode-input');
  const code = inp.value.trim();
  if (!code) return;
  try {
    const product = await API.get(`/api/inventory/barcode/${encodeURIComponent(code)}`);
    addToCart(product);
    inp.value = '';
    inp.focus();
    setScannerReady(true);
    scanToast(`✓ ${product.name}`, 'success');
  } catch (err) {
    inp.value = '';
    inp.focus();
    setScannerReady(false);
    scanToast(`Not found: ${code}`, 'error');
    setTimeout(() => setScannerReady(true), 1500);
  }
}

async function init() {
  allMembers = await API.get('/api/members');
  const sel = document.getElementById('member-select');
  allMembers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = `${m.name}${m.phone ? ' (' + m.phone + ')' : ''}`;
    sel.appendChild(opt);
  });

  // Phone search — live filter as user types
  document.getElementById('phone-search').addEventListener('input', function () {
    const q = this.value.trim();
    if (q.length < 3) { hidePhoneResults(); return; }
    const matches = allMembers.filter(m =>
      m.name !== 'Walk-in Customer' &&
      (m.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
      m.name.toLowerCase().includes(q.toLowerCase())
    );
    showPhoneResults(matches);
  });

  document.getElementById('phone-search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); searchByPhone(); }
    if (e.key === 'Escape') { hidePhoneResults(); document.getElementById('barcode-input').focus(); }
  });

  // Hide results when member dropdown changes manually
  document.getElementById('member-select').addEventListener('change', function () {
    showMemberInfo(this.value);
    hidePhoneResults();
    document.getElementById('phone-search').value = '';
  });

  document.getElementById('barcode-input').focus();
  setScannerReady(true);
}

function searchByPhone() {
  const q = document.getElementById('phone-search').value.trim();
  if (!q) return;
  const matches = allMembers.filter(m =>
    m.name !== 'Walk-in Customer' &&
    ((m.phone || '').replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
     m.name.toLowerCase().includes(q.toLowerCase()))
  );
  if (matches.length === 1) {
    selectMember(matches[0]);
  } else {
    showPhoneResults(matches);
  }
}

function showPhoneResults(matches) {
  const box = document.getElementById('phone-results');
  if (!matches.length) {
    box.style.display = 'block';
    box.innerHTML = '<div style="padding:10px 14px;color:#aaa;font-size:0.88rem;">No members found</div>';
    return;
  }
  box.style.display = 'block';
  box.innerHTML = matches.map(m => `
    <div onclick="selectMember(${JSON.stringify(m).replace(/"/g, '&quot;')})"
      style="padding:10px 14px;cursor:pointer;border-bottom:1px solid #f0f0f0;font-size:0.9rem;"
      onmouseover="this.style.background='#f5f6fa'" onmouseout="this.style.background=''">
      <strong>${m.name}</strong>
      <span style="color:#888;margin-left:8px;">${m.phone || ''}</span>
      ${Number(m.balance) > 0 ? `<span style="float:right;color:#e65100;font-size:0.82rem;">Balance: $${Number(m.balance).toFixed(2)}</span>` : ''}
    </div>
  `).join('');
}

function hidePhoneResults() {
  document.getElementById('phone-results').style.display = 'none';
}

function selectMember(m) {
  document.getElementById('member-select').value = m.id;
  document.getElementById('phone-search').value = '';
  hidePhoneResults();
  showMemberInfo(m.id);
  document.getElementById('barcode-input').focus();
}

function showMemberInfo(memberId) {
  const infoEl = document.getElementById('member-info');
  if (!memberId) { infoEl.style.display = 'none'; return; }
  const m = allMembers.find(x => String(x.id) === String(memberId));
  if (!m || m.name === 'Walk-in Customer') { infoEl.style.display = 'none'; return; }
  infoEl.style.display = 'block';
  infoEl.innerHTML = `
    👤 <strong>${m.name}</strong>
    ${m.phone ? `&nbsp;|&nbsp; 📞 ${m.phone}` : ''}
    ${m.email ? `&nbsp;|&nbsp; ✉️ ${m.email}` : ''}
    ${Number(m.balance) > 0
      ? `<br><span style="color:#e65100;">⚠️ Outstanding balance: $${Number(m.balance).toFixed(2)}</span>`
      : '<br><span style="color:#2e7d32;">✓ No outstanding balance</span>'}
  `;
}

function addToCart(product) {
  const existing = cart.find(c => String(c.productId) === String(product.id));
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ productId: product.id, barcode: product.barcode, name: product.name, price: Number(product.price), qty: 1 });
  }
  renderCart();
}

function updateQty(productId, qty) {
  const item = cart.find(c => String(c.productId) === String(productId));
  if (!item) return;
  if (qty <= 0) { cart = cart.filter(c => String(c.productId) !== String(productId)); }
  else item.qty = qty;
  renderCart();
}

function removeFromCart(productId) {
  cart = cart.filter(c => String(c.productId) !== String(productId));
  renderCart();
}

function renderCart() {
  const tbody = document.getElementById('cart-tbody');
  if (!cart.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">Cart is empty — scan a product</td></tr>';
  } else {
    tbody.innerHTML = cart.map(item => `
      <tr>
        <td><code>${item.barcode}</code></td>
        <td>${item.name}</td>
        <td>${fmtCurrency(item.price)}</td>
        <td>
          <input type="number" value="${item.qty}" min="1"
            style="width:60px;padding:4px 8px;border:1.5px solid #ddd;border-radius:5px;"
            onchange="updateQty(${item.productId}, parseInt(this.value)); document.getElementById('barcode-input').focus();">
        </td>
        <td>${fmtCurrency(item.price * item.qty)}</td>
        <td><button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.productId})">✕</button></td>
      </tr>
    `).join('');
  }
  recalc();
}

function getSubtotal() {
  return cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}

function recalc() {
  const subtotal  = getSubtotal();
  const discount  = parseFloat(document.getElementById('discount').value) || 0;
  const taxPct    = parseFloat(document.getElementById('tax').value) || 0;
  const taxAmt    = (subtotal - discount) * (taxPct / 100);
  const total     = subtotal - discount + taxAmt;

  document.getElementById('subtotal').textContent          = fmtCurrency(subtotal);
  document.getElementById('discount-display').textContent  = '−' + fmtCurrency(discount);
  document.getElementById('tax-display').textContent       = '+' + fmtCurrency(taxAmt);
  document.getElementById('grand-total').textContent       = fmtCurrency(total);
  calcChange();
}

function calcChange() {
  const total  = parseFloat(document.getElementById('grand-total').textContent.replace('$','').replace(/,/g,'')) || 0;
  const paid   = parseFloat(document.getElementById('amount-paid').value) || 0;
  const change = paid - total;
  document.getElementById('change-display').textContent   = fmtCurrency(Math.max(0, change));
  document.getElementById('change-display').style.color   = change < 0 ? '#c62828' : '#2e7d32';
}

function clearCart() {
  if (cart.length && !confirm('Clear the cart?')) return;
  cart = [];
  document.getElementById('discount').value      = 0;
  document.getElementById('tax').value           = 10;
  document.getElementById('amount-paid').value   = '';
  document.getElementById('member-select').value = '';
  document.getElementById('phone-search').value  = '';
  document.getElementById('member-info').style.display = 'none';
  hidePhoneResults();
  renderCart();
  document.getElementById('barcode-input').focus();
}

async function processPayment() {
  const errEl = document.getElementById('pay-error');
  errEl.style.display = 'none';

  if (!cart.length) { errEl.textContent = 'Cart is empty.'; errEl.style.display = 'block'; return; }

  const isCard = currentPaymentMethod === 'credit_card' || currentPaymentMethod === 'debit_card';
  const amountPaid = isCard
    ? parseFloat(document.getElementById('grand-total').textContent.replace('$','').replace(/,/g,''))
    : parseFloat(document.getElementById('amount-paid').value);

  if (!isCard && (!amountPaid || amountPaid <= 0)) {
    errEl.textContent = 'Please enter amount paid.'; errEl.style.display = 'block'; return;
  }

  try {
    const result = await API.post('/api/checkout', {
      memberId:      document.getElementById('member-select').value || null,
      items:         cart.map(i => ({ productId: i.productId, qty: i.qty })),
      discount:      parseFloat(document.getElementById('discount').value) || 0,
      tax:           parseFloat(document.getElementById('tax').value) || 0,
      amountPaid,
      paymentMethod: currentPaymentMethod
    });
    location.href = `invoice.html?id=${result.transaction.id}`;
  } catch (err) {
    errEl.textContent = err.message; errEl.style.display = 'block';
  }
}

init().catch(() => location.href = 'index.html');
renderCart();
