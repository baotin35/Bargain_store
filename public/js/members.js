let allMembers = [];
let sortCol = null, sortDir = 1;

const TIER_ORDER = { Bronze: 1, Silver: 2, Gold: 3, Platinum: 4 };
const MEM_SORT = {
  name:        m => (m.name || '').toLowerCase(),
  phone:       m => (m.phone || '').toLowerCase(),
  tier:        m => TIER_ORDER[m.tier] || 0,
  points:      m => Number(m.points || 0),
  balance:     m => Number(m.balance || 0),
  creditLimit: m => Number(m.creditLimit || 0),
  joinDate:    m => m.joinDate || '',
};

function sortBy(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  renderTable();
}

function applySort(items) {
  const getter = sortCol ? MEM_SORT[sortCol] : null;
  if (!getter) return items;
  return [...items].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });
}

function updateMemHeaders() {
  document.querySelectorAll('.panel th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

const TIER_STYLE = {
  Bronze:   { bg: '#fbe9e7', color: '#bf360c', icon: '🥉' },
  Silver:   { bg: '#f5f5f5', color: '#616161', icon: '🥈' },
  Gold:     { bg: '#fff8e1', color: '#f57f17', icon: '🥇' },
  Platinum: { bg: '#e8eaf6', color: '#283593', icon: '💎' },
};

const PAY_LABEL = { cash: '💵 Cash', credit_card: '💳 Credit', debit_card: '🏦 Debit' };

function tierBadge(tier) {
  const t = TIER_STYLE[tier] || TIER_STYLE.Bronze;
  return `<span style="background:${t.bg};color:${t.color};padding:3px 9px;border-radius:20px;font-size:0.78rem;font-weight:700;">${t.icon} ${tier || 'Bronze'}</span>`;
}

async function loadMembers() {
  allMembers = await API.get('/api/members');
  renderTable();
}

function renderTable() {
  const items = applySort(allMembers);
  updateMemHeaders();
  const tbody = document.getElementById('mem-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center" style="padding:24px;color:#aaa;">No members registered</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(m => `
    <tr>
      <td><strong>${m.name}</strong>${m.phone ? `<br><small style="color:#888;">${m.phone}</small>` : ''}</td>
      <td>${m.phone || '—'}</td>
      <td>${tierBadge(m.tier)}</td>
      <td><strong>${Number(m.points || 0).toLocaleString()}</strong> pts</td>
      <td>${Number(m.balance) > 0 ? `<span style="color:#c62828;font-weight:600;">$${Number(m.balance).toFixed(2)}</span>` : '<span style="color:#2e7d32;">$0.00</span>'}</td>
      <td>$${Number(m.creditLimit || 0).toFixed(2)}</td>
      <td>${m.joinDate ? fmtDate(m.joinDate) : '—'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="viewHistory(${m.id},'${m.name.replace(/'/g,"\\'")}')">History</button>
        <button class="btn btn-outline btn-sm" onclick="editItem(${m.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${m.id},'${m.name.replace(/'/g,"\\'")}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

function openModal(item = null) {
  document.getElementById('mem-modal').classList.add('open');
  document.getElementById('modal-title').textContent = item ? 'Edit Member' : 'Add Member';
  document.getElementById('mem-id').value         = item ? item.id : '';
  document.getElementById('f-name').value         = item ? item.name : '';
  document.getElementById('f-phone').value        = item ? item.phone : '';
  document.getElementById('f-email').value        = item ? item.email : '';
  document.getElementById('f-address').value      = item ? item.address : '';
  document.getElementById('f-birthday').value     = item ? (item.birthday || '') : '';
  document.getElementById('f-credit-limit').value = item ? item.creditLimit : 0;
  document.getElementById('f-balance').value      = item ? item.balance : 0;
}

function closeModal() {
  document.getElementById('mem-modal').classList.remove('open');
  document.getElementById('mem-form').reset();
}

function editItem(id) {
  const item = allMembers.find(m => Number(m.id) === id);
  if (item) openModal(item);
}

async function deleteItem(id, name) {
  if (!confirm(`Delete member "${name}"?`)) return;
  try {
    await API.delete(`/api/members/${id}`);
    await loadMembers();
  } catch (err) { alert('Error: ' + err.message); }
}

document.getElementById('mem-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('mem-id').value;
  const body = {
    name:        document.getElementById('f-name').value,
    phone:       document.getElementById('f-phone').value,
    email:       document.getElementById('f-email').value,
    address:     document.getElementById('f-address').value,
    birthday:    document.getElementById('f-birthday').value,
    creditLimit: parseFloat(document.getElementById('f-credit-limit').value) || 0,
    balance:     parseFloat(document.getElementById('f-balance').value) || 0,
  };
  try {
    if (id) await API.put(`/api/members/${id}`, body);
    else await API.post('/api/members', body);
    closeModal();
    await loadMembers();
  } catch (err) { alert('Error: ' + err.message); }
});

// ── Purchase History ──────────────────────────────────────
async function viewHistory(id, name) {
  document.getElementById('history-modal').classList.add('open');
  document.getElementById('history-title').textContent = `📋 ${name} — Purchase History`;
  document.getElementById('history-tbody').innerHTML =
    '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">Loading...</td></tr>';
  document.getElementById('history-summary').innerHTML = '';

  const { transactions, totalSpent, count } = await API.get(`/api/members/${id}/history`);

  const member = allMembers.find(m => Number(m.id) === id);
  const tier = member ? (member.tier || 'Bronze') : 'Bronze';
  const points = member ? Number(member.points || 0) : 0;
  const nextTierPts = tier === 'Platinum' ? null
    : tier === 'Gold' ? 2000 : tier === 'Silver' ? 1000 : 500;

  document.getElementById('history-summary').innerHTML = `
    <div class="card" style="flex:1;padding:14px 16px;">
      <div class="card-label">Total Spent</div>
      <div class="card-value success" style="font-size:1.4rem;">$${totalSpent}</div>
    </div>
    <div class="card" style="flex:1;padding:14px 16px;">
      <div class="card-label">Transactions</div>
      <div class="card-value" style="font-size:1.4rem;">${count}</div>
    </div>
    <div class="card" style="flex:1;padding:14px 16px;">
      <div class="card-label">Loyalty Points</div>
      <div style="margin-top:4px;">${tierBadge(tier)}</div>
      <div style="font-size:1.1rem;font-weight:700;margin-top:4px;">${points.toLocaleString()} pts</div>
      ${nextTierPts ? `<div style="font-size:0.75rem;color:#888;margin-top:2px;">${nextTierPts - points} pts to next tier</div>` : '<div style="font-size:0.75rem;color:#283593;margin-top:2px;">Max tier reached!</div>'}
    </div>
  `;

  if (!transactions.length) {
    document.getElementById('history-tbody').innerHTML =
      '<tr><td colspan="6" class="text-center" style="padding:24px;color:#aaa;">No transactions yet</td></tr>';
    return;
  }

  document.getElementById('history-tbody').innerHTML = transactions.map(tx => `
    <tr>
      <td><strong>${tx.invoiceNo}</strong></td>
      <td>${fmtDate(tx.date)}</td>
      <td style="font-size:0.82rem;color:#555;">${tx.itemDetails.map(i => `${i.name} ×${i.qty}`).join(', ')}</td>
      <td><strong>${fmtCurrency(tx.total)}</strong></td>
      <td>${PAY_LABEL[tx.paymentMethod] || '💵 Cash'}</td>
      <td><a href="invoice.html?id=${tx.id}" class="btn btn-outline btn-sm" target="_blank">View</a></td>
    </tr>
  `).join('');
}

function closeHistory() {
  document.getElementById('history-modal').classList.remove('open');
}

loadMembers().catch(() => location.href = 'index.html');
