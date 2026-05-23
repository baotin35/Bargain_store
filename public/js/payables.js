let allPayables = [];
let sortCol = null, sortDir = 1;

const PAY_SORT = {
  supplier:    p => (p.supplier || '').toLowerCase(),
  description: p => (p.description || '').toLowerCase(),
  amount:      p => Number(p.amount || 0),
  dueDate:     p => p.dueDate || '',
  status:      p => p.status || '',
};

function sortBy(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  renderTable();
}

function applySort(items) {
  const getter = sortCol ? PAY_SORT[sortCol] : null;
  if (!getter) return items;
  return [...items].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });
}

function updatePayHeaders() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

async function loadPayables() {
  allPayables = await API.get('/api/payables');
  renderTable();
}

function renderTable() {
  const items = applySort(allPayables);
  updatePayHeaders();
  const tbody = document.getElementById('pay-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">No payables recorded</td></tr>';
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  tbody.innerHTML = items.map(p => {
    const overdue = p.status !== 'paid' && p.dueDate && p.dueDate < today;
    return `
      <tr>
        <td><strong>${p.supplier}</strong></td>
        <td>${p.description || '—'}</td>
        <td>${fmtCurrency(p.amount)}</td>
        <td>${p.dueDate ? fmtDate(p.dueDate) : '—'}${overdue ? ' <span class="badge badge-danger">Overdue</span>' : ''}</td>
        <td>
          <span class="badge ${p.status === 'paid' ? 'badge-success' : 'badge-warning'}">
            ${p.status === 'paid' ? 'Paid' : 'Unpaid'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editItem(${p.id})">Edit</button>
          ${p.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="markPaid(${p.id})">Mark Paid</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${p.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openModal(item = null) {
  document.getElementById('pay-modal').classList.add('open');
  document.getElementById('modal-title').textContent = item ? 'Edit Payable' : 'Add Payable';
  document.getElementById('pay-id').value = item ? item.id : '';
  document.getElementById('f-supplier').value = item ? item.supplier : '';
  document.getElementById('f-description').value = item ? item.description : '';
  document.getElementById('f-amount').value = item ? item.amount : '';
  document.getElementById('f-due-date').value = item ? item.dueDate : '';
  document.getElementById('f-status').value = item ? item.status : 'unpaid';
  document.getElementById('f-paid-date').value = item ? item.paidDate : '';
  togglePaidDate();
}

function closeModal() {
  document.getElementById('pay-modal').classList.remove('open');
  document.getElementById('pay-form').reset();
}

function togglePaidDate() {
  const show = document.getElementById('f-status').value === 'paid';
  document.getElementById('paid-date-group').style.display = show ? 'block' : 'none';
}

document.getElementById('f-status').addEventListener('change', togglePaidDate);

function editItem(id) {
  const item = allPayables.find(p => Number(p.id) === id);
  if (item) openModal(item);
}

async function markPaid(id) {
  const today = new Date().toISOString().slice(0, 10);
  await API.put(`/api/payables/${id}`, { status: 'paid', paidDate: today });
  await loadPayables();
}

async function deleteItem(id) {
  if (!confirm('Delete this payable?')) return;
  await API.delete(`/api/payables/${id}`);
  await loadPayables();
}

document.getElementById('pay-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('pay-id').value;
  const body = {
    supplier: document.getElementById('f-supplier').value,
    description: document.getElementById('f-description').value,
    amount: parseFloat(document.getElementById('f-amount').value),
    dueDate: document.getElementById('f-due-date').value,
    status: document.getElementById('f-status').value,
    paidDate: document.getElementById('f-paid-date').value,
  };
  try {
    if (id) await API.put(`/api/payables/${id}`, body);
    else await API.post('/api/payables', body);
    closeModal();
    await loadPayables();
  } catch (err) { alert('Error: ' + err.message); }
});

loadPayables().catch(() => location.href = 'index.html');
