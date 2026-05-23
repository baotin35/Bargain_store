const express = require('express');
const router = express.Router();
const { readSheet } = require('../utils/excel');

// GET / — list all invoices
router.get('/', async (req, res) => {
  try {
    const [transactions, members] = await Promise.all([
      readSheet('transactions'),
      readSheet('members'),
    ]);
    const memberMap = {};
    members.forEach(m => { memberMap[String(m.id)] = m.name; });
    const list = transactions.map(t => ({
      id: t.id,
      invoiceNo: t.invoiceNo,
      date: t.date,
      memberName: t.memberId ? (memberMap[String(t.memberId)] || 'Walk-in') : 'Walk-in',
      total: Number(t.total || 0),
      discount: Number(t.discount || 0),
      tax: Number(t.tax || 0),
      paymentMethod: t.paymentMethod || 'cash',
    }));
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /:id — single invoice detail
router.get('/:id', async (req, res) => {
  const transactions = await readSheet('transactions');
  const tx = transactions.find(t => String(t.id) === req.params.id);
  if (!tx) return res.status(404).json({ error: 'Invoice not found' });

  let member = null;
  if (tx.memberId) {
    const members = await readSheet('members');
    member = members.find(m => String(m.id) === String(tx.memberId)) || null;
  }

  const inventory = await readSheet('inventory');
  let items = [];
  try {
    items = JSON.parse(tx.items).map(cartItem => {
      const product = inventory.find(p => String(p.id) === String(cartItem.productId));
      return {
        name: product ? product.name : 'Unknown',
        barcode: product ? product.barcode : '',
        price: product ? product.price : 0,
        qty: cartItem.qty,
        subtotal: (Number(product ? product.price : 0) * Number(cartItem.qty)).toFixed(2)
      };
    });
  } catch { items = []; }

  res.json({ transaction: tx, member, items });
});

module.exports = router;
