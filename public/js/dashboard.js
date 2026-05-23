document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

// ── Transaction table sort ───────────────────────────────────
let txData = [];
let txSortCol = 'date', txSortDir = -1;

const TX_SORT = {
  invoiceNo:  t => (t.invoiceNo || '').toLowerCase(),
  date:       t => t.date || '',
  total:      t => Number(t.total || 0),
  amountPaid: t => Number(t.amountPaid || 0),
  change:     t => Number(t.change || 0),
};

function txSortBy(col) {
  if (txSortCol === col) txSortDir *= -1;
  else { txSortCol = col; txSortDir = 1; }
  renderTxTable();
}

function renderTxTable() {
  const getter = TX_SORT[txSortCol];
  const sorted = getter
    ? [...txData].sort((a, b) => {
        const va = getter(a), vb = getter(b);
        if (typeof va === 'string') return va.localeCompare(vb) * txSortDir;
        return (va - vb) * txSortDir;
      })
    : txData;

  document.querySelectorAll('#tx-tbody').forEach(() => {});
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === txSortCol) th.classList.add(txSortDir === 1 ? 'sort-asc' : 'sort-desc');
  });

  const txTbody = document.getElementById('tx-tbody');
  if (!sorted.length) {
    txTbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">No transactions yet</td></tr>';
    return;
  }
  txTbody.innerHTML = sorted.map(t => `
    <tr>
      <td><strong>${t.invoiceNo}</strong></td>
      <td>${fmtDate(t.date)}</td>
      <td>${fmtCurrency(t.total)}</td>
      <td>${fmtCurrency(t.amountPaid)}</td>
      <td>${fmtCurrency(t.change)}</td>
      <td><a href="invoice.html?id=${t.id}" class="btn btn-outline btn-sm">View</a></td>
    </tr>
  `).join('');
}

// ── Main load ────────────────────────────────────────────────
async function loadDashboard() {
  const d = await API.get('/api/dashboard');

  document.getElementById('sales-today').textContent = fmtCurrency(d.salesToday);
  document.getElementById('total-sales').textContent = fmtCurrency(d.totalSales);
  document.getElementById('total-tx').textContent = d.totalTransactions;
  document.getElementById('total-payables').textContent = fmtCurrency(d.totalPayables);
  document.getElementById('total-receivables').textContent = fmtCurrency(d.totalReceivables);
  document.getElementById('low-stock-count').textContent = d.lowStock.length;

  const marginEl = document.getElementById('avg-margin');
  marginEl.textContent = d.avgMargin + '%';
  marginEl.style.color = d.avgMargin >= 35 ? '#2e7d32' : d.avgMargin >= 20 ? '#f57f17' : '#c62828';

  document.getElementById('inv-value').textContent = fmtCurrency(d.inventoryValue);
  document.getElementById('low-margin-count').textContent = d.lowMarginCount;

  txData = d.recentTransactions;
  renderTxTable();

  const lsTbody = document.getElementById('low-stock-tbody');
  if (!d.lowStock.length) {
    lsTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding:24px;color:#aaa;">All items are well-stocked</td></tr>';
  } else {
    lsTbody.innerHTML = d.lowStock.map(i => `
      <tr>
        <td>${i.barcode}</td>
        <td>${i.name}</td>
        <td>${i.category}</td>
        <td><span class="badge badge-danger">${i.stock}</span></td>
        <td>${i.unit}</td>
      </tr>
    `).join('');
  }
}

loadDashboard().catch(err => {
  if (err.message.includes('401') || err.message.includes('Not logged')) location.href = 'index.html';
});
