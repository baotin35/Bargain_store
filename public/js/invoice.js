const PAY_LABEL = { cash: '💵 Cash', credit_card: '💳 Credit Card', debit_card: '🏦 Debit Card' };

// ── Invoice List ─────────────────────────────────────────────
let allInvoices = [], filteredInvoices = [];
let sortCol = 'date', sortDir = -1;

const SORT_VAL = {
  invoiceNo:     i => (i.invoiceNo || '').toLowerCase(),
  date:          i => i.date || '',
  memberName:    i => (i.memberName || 'walk-in').toLowerCase(),
  total:         i => Number(i.total || 0),
  discount:      i => Number(i.discount || 0),
  paymentMethod: i => (i.paymentMethod || '').toLowerCase(),
};

function sortBy(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  renderList(filteredInvoices);
}

function applySort(data) {
  if (!Array.isArray(data)) return [];
  const getter = SORT_VAL[sortCol];
  if (!getter) return data;
  return [...data].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });
}

function updateSortHeaders() {
  document.querySelectorAll('#list-view th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

function renderList(data) {
  filteredInvoices = data;
  const sorted = applySort(data);
  updateSortHeaders();
  const tbody = document.getElementById('inv-list-tbody');
  if (!sorted.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding:24px;color:#aaa;">No invoices found</td></tr>';
    return;
  }
  tbody.innerHTML = sorted.map(inv => `
    <tr>
      <td><strong>${inv.invoiceNo}</strong></td>
      <td>${fmtDate(inv.date)}</td>
      <td>${inv.memberName}</td>
      <td><strong>${fmtCurrency(inv.total)}</strong></td>
      <td>${Number(inv.discount) > 0 ? fmtCurrency(inv.discount) : '—'}</td>
      <td>${PAY_LABEL[inv.paymentMethod] || '💵 Cash'}</td>
      <td><a href="invoice.html?id=${inv.id}" class="btn btn-outline btn-sm">View</a></td>
    </tr>
  `).join('');
}

function filterList() {
  const q = document.getElementById('inv-search').value.toLowerCase();
  const filtered = q
    ? allInvoices.filter(i =>
        (i.invoiceNo || '').toLowerCase().includes(q) ||
        (i.memberName || '').toLowerCase().includes(q)
      )
    : allInvoices;
  renderList(filtered);
}

async function loadList() {
  const result = await API.get('/api/invoice');
  allInvoices = Array.isArray(result) ? result : [];
  document.getElementById('inv-search').addEventListener('input', filterList);
  renderList(allInvoices);
}

// ── Invoice Detail ───────────────────────────────────────────
async function loadDetail(id) {
  try {
    const { transaction: tx, member, items } = await API.get(`/api/invoice/${id}`);

    document.getElementById('invoice-loading').style.display = 'none';
    document.getElementById('invoice-body').style.display = 'block';

    document.title = `Invoice ${tx.invoiceNo} — Mom and Pop`;
    document.getElementById('inv-number').textContent = tx.invoiceNo;
    document.getElementById('inv-date').textContent = fmtDate(tx.date);
    document.getElementById('inv-member').textContent = member
      ? `${member.name}${member.phone ? ' | ' + member.phone : ''}`
      : 'Walk-in Customer';

    const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.qty), 0);

    document.getElementById('inv-items').innerHTML = items.map(i => `
      <tr>
        <td><code>${i.barcode}</code></td>
        <td>${i.name}</td>
        <td>${fmtCurrency(i.price)}</td>
        <td>${i.qty}</td>
        <td class="text-right">${fmtCurrency(i.subtotal)}</td>
      </tr>
    `).join('');

    const isCard = tx.paymentMethod === 'credit_card' || tx.paymentMethod === 'debit_card';
    document.getElementById('inv-subtotal').textContent = fmtCurrency(subtotal);
    document.getElementById('inv-discount').textContent = '−' + fmtCurrency(tx.discount);
    document.getElementById('inv-tax').textContent      = '+' + fmtCurrency(tx.tax);
    document.getElementById('inv-total').textContent    = fmtCurrency(tx.total);
    document.getElementById('inv-paid').textContent     = PAY_LABEL[tx.paymentMethod] || '💵 Cash';
    document.getElementById('inv-change').textContent   = isCard ? '—' : fmtCurrency(tx.change);
  } catch (err) {
    document.getElementById('invoice-loading').textContent = 'Failed to load invoice: ' + err.message;
  }
}

// ── Route based on ?id param ─────────────────────────────────
const invoiceId = new URLSearchParams(location.search).get('id');

if (invoiceId) {
  document.getElementById('list-view').style.display = 'none';
  document.getElementById('detail-view').style.display = '';
  loadDetail(invoiceId);
} else {
  loadList().catch(err => {
    if (err.message.includes('401') || err.message.includes('Not logged')) {
      location.href = 'index.html';
    } else {
      document.getElementById('inv-list-tbody').innerHTML =
        `<tr><td colspan="7" class="text-center" style="padding:24px;color:#c62828;">Error: ${err.message}</td></tr>`;
    }
  });
}
