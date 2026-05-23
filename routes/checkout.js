const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, nextId } = require('../utils/excel');

const VALID_PAYMENT_METHODS = ['cash', 'credit_card', 'debit_card'];

function calcTier(points) {
  if (points >= 2000) return 'Platinum';
  if (points >= 1000) return 'Gold';
  if (points >= 500)  return 'Silver';
  return 'Bronze';
}

router.post('/', async (req, res) => {
  const { memberId, items, discount = 0, tax = 0, amountPaid, paymentMethod = 'cash' } = req.body;

  if (!items || !items.length) return res.status(400).json({ error: 'No items in cart' });
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const inventory = await readSheet('inventory');
  let subtotal = 0;

  for (const cartItem of items) {
    const product = inventory.find(p => String(p.id) === String(cartItem.productId));
    if (!product) return res.status(400).json({ error: `Product ${cartItem.productId} not found` });
    if (Number(product.stock) < Number(cartItem.qty)) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
    subtotal += Number(product.price) * Number(cartItem.qty);
  }

  const discountAmt = Number(discount);
  const taxAmt = (subtotal - discountAmt) * (Number(tax) / 100);
  const total = subtotal - discountAmt + taxAmt;

  const isCard = paymentMethod === 'credit_card' || paymentMethod === 'debit_card';
  const finalAmountPaid = isCard ? total : Number(amountPaid);
  const change = isCard ? 0 : finalAmountPaid - total;

  if (!isCard && change < 0) return res.status(400).json({ error: 'Insufficient payment' });

  // Deduct stock
  for (const cartItem of items) {
    const product = inventory.find(p => String(p.id) === String(cartItem.productId));
    await updateRow('inventory', product.id, { stock: Number(product.stock) - Number(cartItem.qty) });
  }

  // Award loyalty points: 1 point per $1 spent (based on subtotal before tax)
  let earnedPoints = 0;
  if (memberId) {
    const members = await readSheet('members');
    const member = members.find(m => String(m.id) === String(memberId));
    if (member && member.name !== 'Walk-in Customer') {
      earnedPoints = Math.floor(subtotal - discountAmt);
      const newPoints = Number(member.points || 0) + earnedPoints;
      await updateRow('members', member.id, {
        points: newPoints,
        tier: calcTier(newPoints)
      });
    }
  }

  const transactions = await readSheet('transactions');
  const invoiceNo = 'INV-' + String(nextId(transactions)).padStart(5, '0');
  const transaction = {
    id: nextId(transactions),
    date: new Date().toISOString(),
    memberId: memberId || '',
    items: JSON.stringify(items),
    total: total.toFixed(2),
    discount: discountAmt.toFixed(2),
    tax: taxAmt.toFixed(2),
    amountPaid: finalAmountPaid.toFixed(2),
    change: change.toFixed(2),
    invoiceNo,
    paymentMethod
  };

  await appendRow('transactions', transaction);
  res.json({ success: true, transaction, earnedPoints });
});

module.exports = router;
