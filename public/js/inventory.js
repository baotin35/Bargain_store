let allItems = [];
let sortCol = null, sortDir = 1;

const INV_SORT = {
  barcode:  i => String(i.barcode || '').toLowerCase(),
  name:     i => (i.name || '').toLowerCase(),
  category: i => (i.category || '').toLowerCase(),
  price:    i => Number(i.price || 0),
  cost:     i => Number(i.cost || 0),
  margin:   i => { const p = Number(i.price), c = Number(i.cost); return (p && c) ? ((p - c) / p) * 100 : -1; },
  stock:    i => Number(i.stock || 0),
  unit:     i => (i.unit || '').toLowerCase(),
};

function sortBy(col) {
  if (sortCol === col) sortDir *= -1;
  else { sortCol = col; sortDir = 1; }
  const q = document.getElementById('search-input').value.toLowerCase();
  renderTable(q ? allItems.filter(i => i.name.toLowerCase().includes(q) || String(i.barcode).toLowerCase().includes(q)) : allItems);
}

function applySort(items) {
  const getter = sortCol ? INV_SORT[sortCol] : null;
  if (!getter) return items;
  return [...items].sort((a, b) => {
    const va = getter(a), vb = getter(b);
    if (typeof va === 'string') return va.localeCompare(vb) * sortDir;
    return (va - vb) * sortDir;
  });
}

function updateInvHeaders() {
  document.querySelectorAll('.panel th[data-sort]').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
    if (th.dataset.sort === sortCol) th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
  });
}

async function loadInventory() {
  allItems = await API.get('/api/inventory');
  renderTable(allItems);
}

function marginBadge(price, cost) {
  const p = Number(price), c = Number(cost);
  if (!p || !c) return '<span style="color:#aaa;">—</span>';
  const pct = Math.round(((p - c) / p) * 100);
  const color = pct >= 40 ? '#2e7d32' : pct >= 25 ? '#f57f17' : '#c62828';
  return `<span style="color:${color};font-weight:700;">${pct}%</span>`;
}

function renderTable(items) {
  items = applySort(items);
  updateInvHeaders();
  const tbody = document.getElementById('inv-tbody');
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding:24px;color:#aaa;">No products found</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(i => `
    <tr>
      <td><code>${i.barcode}</code></td>
      <td><strong>${i.name}</strong></td>
      <td>${i.category || '—'}</td>
      <td>${fmtCurrency(i.price)}</td>
      <td>${fmtCurrency(i.cost)}</td>
      <td>${marginBadge(i.price, i.cost)}</td>
      <td>
        <span class="badge ${Number(i.stock) <= 5 ? 'badge-danger' : Number(i.stock) <= 20 ? 'badge-warning' : 'badge-success'}">
          ${i.stock}
        </span>
      </td>
      <td>${i.unit || '—'}</td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="editItem(${i.id})">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteItem(${i.id},'${i.name}')">Delete</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('search-input').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderTable(allItems.filter(i =>
    i.name.toLowerCase().includes(q) || String(i.barcode).toLowerCase().includes(q)
  ));
});

function openModal(item = null) {
  document.getElementById('item-modal').classList.add('open');
  document.getElementById('modal-title').textContent = item ? 'Edit Product' : 'Add Product';
  document.getElementById('item-id').value = item ? item.id : '';
  document.getElementById('f-barcode').value = item ? item.barcode : '';
  document.getElementById('f-name').value = item ? item.name : '';
  document.getElementById('f-category').value = item ? item.category : '';
  document.getElementById('f-unit').value = item ? item.unit : '';
  document.getElementById('f-price').value = item ? item.price : '';
  document.getElementById('f-cost').value = item ? item.cost : '';
  document.getElementById('f-stock').value = item ? item.stock : '';
}

function closeModal() {
  document.getElementById('item-modal').classList.remove('open');
  document.getElementById('item-form').reset();
}

function editItem(id) {
  const item = allItems.find(i => Number(i.id) === id);
  if (item) openModal(item);
}

async function deleteItem(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    await API.delete(`/api/inventory/${id}`);
    await loadInventory();
  } catch (err) { alert('Error: ' + err.message); }
}

document.getElementById('item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  const body = {
    barcode: document.getElementById('f-barcode').value,
    name: document.getElementById('f-name').value,
    category: document.getElementById('f-category').value,
    unit: document.getElementById('f-unit').value,
    price: parseFloat(document.getElementById('f-price').value),
    cost: parseFloat(document.getElementById('f-cost').value) || 0,
    stock: parseInt(document.getElementById('f-stock').value),
  };
  try {
    if (id) await API.put(`/api/inventory/${id}`, body);
    else await API.post('/api/inventory', body);
    closeModal();
    await loadInventory();
  } catch (err) { alert('Error: ' + err.message); }
});

// ── Stock Audit ───────────────────────────────────────────
let auditItems = [];

function openAudit() {
  auditItems = [...allItems];
  document.getElementById('audit-modal').classList.add('open');
  showAuditStep1();

  // Populate category filter
  const cats = [...new Set(allItems.map(i => i.category).filter(Boolean))].sort();
  const sel = document.getElementById('audit-cat');
  sel.innerHTML = '<option value="">All Categories</option>' +
    cats.map(c => `<option value="${c}">${c}</option>`).join('');

  renderAuditTable(auditItems);
}

function closeAudit() {
  document.getElementById('audit-modal').classList.remove('open');
}

function showAuditStep1() {
  document.getElementById('audit-step1').style.display = '';
  document.getElementById('audit-step2').style.display = 'none';
}

function filterAuditRows() {
  const q = document.getElementById('audit-search').value.toLowerCase();
  const cat = document.getElementById('audit-cat').value;
  const filtered = allItems.filter(i =>
    (!q || i.name.toLowerCase().includes(q)) &&
    (!cat || i.category === cat)
  );
  renderAuditTable(filtered);
}

function renderAuditTable(items) {
  document.getElementById('audit-tbody').innerHTML = items.map(i => {
    const existing = document.getElementById(`audit-qty-${i.id}`);
    const val = existing ? existing.value : '';
    const variance = val !== '' ? (Number(val) - Number(i.stock)) : 0;
    const varColor = variance < 0 ? '#c62828' : variance > 0 ? '#f57f17' : '#888';
    return `
      <tr>
        <td><strong>${i.name}</strong></td>
        <td><span class="badge badge-info">${i.category || '—'}</span></td>
        <td><strong>${i.stock}</strong> ${i.unit || ''}</td>
        <td>
          <input type="number" id="audit-qty-${i.id}" min="0"
            style="width:80px;padding:4px 8px;border:1.5px solid #ddd;border-radius:6px;font-size:0.9rem;"
            placeholder="Count" value="${val}"
            oninput="updateAuditVariance(${i.id},${i.stock})">
        </td>
        <td id="audit-var-${i.id}" style="font-weight:700;color:${varColor};">
          ${val !== '' ? (variance >= 0 ? '+' : '') + variance : '—'}
        </td>
      </tr>`;
  }).join('');
}

function updateAuditVariance(id, systemCount) {
  const input = document.getElementById(`audit-qty-${id}`);
  const varCell = document.getElementById(`audit-var-${id}`);
  if (!input || !varCell) return;
  const val = input.value;
  if (val === '') { varCell.textContent = '—'; varCell.style.color = '#888'; return; }
  const variance = Number(val) - Number(systemCount);
  varCell.textContent = (variance >= 0 ? '+' : '') + variance;
  varCell.style.color = variance < 0 ? '#c62828' : variance > 0 ? '#f57f17' : '#2e7d32';
}

function runAudit() {
  const results = allItems.map(i => {
    const input = document.getElementById(`audit-qty-${i.id}`);
    const physical = input && input.value !== '' ? Number(input.value) : null;
    const system = Number(i.stock);
    const variance = physical !== null ? physical - system : 0;
    const lossValue = variance < 0 ? Math.abs(variance) * Number(i.cost || i.price) : 0;
    return { ...i, physical, system, variance, lossValue, counted: physical !== null };
  });

  const counted = results.filter(r => r.counted);
  const discrepancies = counted.filter(r => r.variance !== 0);
  const shrinkageItems = counted.filter(r => r.variance < 0);
  const totalLoss = shrinkageItems.reduce((s, r) => s + r.lossValue, 0);
  const totalItems = counted.length;

  document.getElementById('audit-summary').innerHTML = `
    <div class="card" style="padding:14px;text-align:center;">
      <div class="card-label">Items Counted</div>
      <div class="card-value" style="font-size:1.5rem;">${totalItems}</div>
    </div>
    <div class="card" style="padding:14px;text-align:center;">
      <div class="card-label">Discrepancies</div>
      <div class="card-value ${discrepancies.length ? 'danger' : 'success'}" style="font-size:1.5rem;">${discrepancies.length}</div>
    </div>
    <div class="card" style="padding:14px;text-align:center;">
      <div class="card-label">Missing Items</div>
      <div class="card-value ${shrinkageItems.length ? 'danger' : 'success'}" style="font-size:1.5rem;">${shrinkageItems.reduce((s,r)=>s+Math.abs(r.variance),0)}</div>
    </div>
    <div class="card" style="padding:14px;text-align:center;">
      <div class="card-label">Est. Shrinkage Loss</div>
      <div class="card-value danger" style="font-size:1.5rem;">${fmtCurrency(totalLoss)}</div>
    </div>
  `;

  const rows = counted.sort((a, b) => a.variance - b.variance);
  document.getElementById('audit-results').innerHTML = rows.length
    ? rows.map(r => {
        const varColor = r.variance < 0 ? '#c62828' : r.variance > 0 ? '#f57f17' : '#2e7d32';
        const rowBg = r.variance < 0 ? 'background:#fff5f5;' : '';
        return `
          <tr style="${rowBg}">
            <td><strong>${r.name}</strong><br><small style="color:#888;">${r.category || ''}</small></td>
            <td>${r.system} ${r.unit || ''}</td>
            <td>${r.physical} ${r.unit || ''}</td>
            <td style="font-weight:700;color:${varColor};">${r.variance >= 0 ? '+' : ''}${r.variance}</td>
            <td style="color:${r.lossValue > 0 ? '#c62828' : '#2e7d32'};font-weight:${r.lossValue > 0 ? '700' : '400'};">
              ${r.lossValue > 0 ? fmtCurrency(r.lossValue) : '✓'}
            </td>
          </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="text-center" style="padding:20px;color:#aaa;">No items counted yet</td></tr>';

  auditItems = results;
  document.getElementById('audit-step1').style.display = 'none';
  document.getElementById('audit-step2').style.display = '';
}

async function applyAuditCounts() {
  const toUpdate = auditItems.filter(r => r.counted && r.variance !== 0);
  if (!toUpdate.length) { closeAudit(); return; }
  if (!confirm(`Apply corrected counts for ${toUpdate.length} item(s)? This will update inventory to match your physical count.`)) return;

  try {
    for (const item of toUpdate) {
      await API.put(`/api/inventory/${item.id}`, {
        barcode: item.barcode, name: item.name, category: item.category,
        unit: item.unit, price: item.price, cost: item.cost, stock: item.physical,
      });
    }
    closeAudit();
    await loadInventory();
    alert(`✅ Inventory updated for ${toUpdate.length} item(s).`);
  } catch (err) {
    alert('Error updating inventory: ' + err.message);
  }
}

loadInventory().catch(() => location.href = 'index.html');
