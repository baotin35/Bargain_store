let allReceivables = [];
let allMembers = [];
let sortCol = null, sortDir = 1;

const REC_SORT = {
  memberName:  r => getMemberName(r.memberId).toLowerCase(),
  description: r => (r.description || '').toLowerCase(),
  amount:      r => Number(r.amount || 0),
  dueDate:     r => r.dueDate || '',
  status:      r => r.status || '',
};

function sortBy(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  renderTable();
}

function applySort(items) {
  const getter = sortCol ? REC_SORT[sortCol] : null;
  if (!getter) return items;
  return [...items].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });
}

function updateRecHeaders() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

async function loadReceivables() {
  [allReceivables, allMembers] = await Promise.all([
    API.get('/api/receivables'),
    API.get('/api/members')
  ]);

  // Populate member dropdown
  const sel = document.getElementById('f-member-id');
  sel.innerHTML = '<option value="">Select member...</option>';
  allMembers.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    sel.appendChild(opt);
  });

  renderTable();
}

function getMemberName(id) {
  const m = allMembers.find(m => String(m.id) === String(id));
  return m ? m.name : id || '—';
}

function renderTable() {
  const items = applySort(allReceivables);
  updateRecHeaders();
  const tbody = document.getElementById('rec-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">No receivables recorded</td></tr>';
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  tbody.innerHTML = items.map(r => {
    const overdue = r.status !== 'paid' && r.dueDate && r.dueDate < today;
    return `
      <tr>
        <td><strong>${getMemberName(r.memberId)}</strong></td>
        <td>${r.description || '—'}</td>
        <td>${fmtCurrency(r.amount)}</td>
        <td>${r.dueDate ? fmtDate(r.dueDate) : '—'}${overdue ? ' <span class="badge badge-danger">Overdue</span>' : ''}</td>
        <td>
          <span class="badge ${r.status === 'paid' ? 'badge-success' : 'badge-warning'}">
            ${r.status === 'paid' ? 'Paid' : 'Unpaid'}
          </span>
        </td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editItem(${r.id})">Edit</button>
          ${r.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="markPaid(${r.id})">Mark Paid</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="deleteItem(${r.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openModal(item = null) {
  document.getElementById('rec-modal').classList.add('open');
  document.getElementById('modal-title').textContent = item ? 'Edit Receivable' : 'Add Receivable';
  document.getElementById('rec-id').value = item ? item.id : '';
  document.getElementById('f-member-id').value = item ? item.memberId : '';
  document.getElementById('f-description').value = item ? item.description : '';
  document.getElementById('f-amount').value = item ? item.amount : '';
  document.getElementById('f-due-date').value = item ? item.dueDate : '';
  document.getElementById('f-status').value = item ? item.status : 'unpaid';
  document.getElementById('f-paid-date').value = item ? item.paidDate : '';
  togglePaidDate();
}

function closeModal() {
  document.getElementById('rec-modal').classList.remove('open');
  document.getElementById('rec-form').reset();
}

function togglePaidDate() {
  const show = document.getElementById('f-status').value === 'paid';
  document.getElementById('paid-date-group').style.display = show ? 'block' : 'none';
}

document.getElementById('f-status').addEventListener('change', togglePaidDate);

function editItem(id) {
  const item = allReceivables.find(r => Number(r.id) === id);
  if (item) openModal(item);
}

async function markPaid(id) {
  const today = new Date().toISOString().slice(0, 10);
  await API.put(`/api/receivables/${id}`, { status: 'paid', paidDate: today });
  await loadReceivables();
}

async function deleteItem(id) {
  if (!confirm('Delete this receivable?')) return;
  await API.delete(`/api/receivables/${id}`);
  await loadReceivables();
}

document.getElementById('rec-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('rec-id').value;
  const memberId = document.getElementById('f-member-id').value;
  const body = {
    memberId,
    memberName: getMemberName(memberId),
    description: document.getElementById('f-description').value,
    amount: parseFloat(document.getElementById('f-amount').value),
    dueDate: document.getElementById('f-due-date').value,
    status: document.getElementById('f-status').value,
    paidDate: document.getElementById('f-paid-date').value,
  };
  try {
    if (id) await API.put(`/api/receivables/${id}`, body);
    else await API.post('/api/receivables', body);
    closeModal();
    await loadReceivables();
  } catch (err) { alert('Error: ' + err.message); }
});

loadReceivables().catch(() => location.href = 'index.html');
