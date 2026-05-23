const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow, nextId } = require('../utils/excel');

router.get('/', async (req, res) => {
  res.json(await readSheet('members'));
});

router.get('/:id/history', async (req, res) => {
  const [transactions, inventory] = await Promise.all([
    readSheet('transactions'),
    readSheet('inventory')
  ]);

  const memberTx = transactions
    .filter(t => String(t.memberId) === req.params.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const enriched = memberTx.map(tx => {
    let items = [];
    try {
      items = JSON.parse(tx.items).map(ci => {
        const p = inventory.find(p => String(p.id) === String(ci.productId));
        return { name: p ? p.name : 'Unknown', qty: ci.qty, price: p ? p.price : 0 };
      });
    } catch { items = []; }
    return { ...tx, itemDetails: items };
  });

  const totalSpent = memberTx.reduce((s, t) => s + Number(t.total || 0), 0);
  res.json({ transactions: enriched, totalSpent: totalSpent.toFixed(2), count: memberTx.length });
});

router.post('/', async (req, res) => {
  const rows = await readSheet('members');
  const row = {
    id: nextId(rows),
    creditLimit: 0,
    balance: 0,
    joinDate: new Date().toISOString().slice(0, 10),
    points: 0,
    tier: 'Bronze',
    ...req.body
  };
  await appendRow('members', row);
  res.json(row);
});

router.put('/:id', async (req, res) => {
  const updated = await updateRow('members', req.params.id, req.body);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await deleteRow('members', req.params.id);
  res.json({ success: true });
});

module.exports = router;
