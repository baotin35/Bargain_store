const express = require('express');
const router = express.Router();
const { readSheet } = require('../utils/excel');

router.get('/', async (req, res) => {
  const [transactions, inventory, payables, receivables] = await Promise.all([
    readSheet('transactions'),
    readSheet('inventory'),
    readSheet('payables'),
    readSheet('receivables')
  ]);

  const today = new Date().toISOString().slice(0, 10);

  const salesToday = transactions
    .filter(t => t.date && String(t.date).slice(0, 10) === today)
    .reduce((sum, t) => sum + Number(t.total || 0), 0);

  const totalSales = transactions.reduce((sum, t) => sum + Number(t.total || 0), 0);

  const lowStock = inventory.filter(i => Number(i.stock) <= 5);

  // Margin health
  const priced = inventory.filter(i => Number(i.price) > 0 && Number(i.cost) > 0);
  const avgMargin = priced.length
    ? Math.round(priced.reduce((s, i) => s + ((Number(i.price) - Number(i.cost)) / Number(i.price)) * 100, 0) / priced.length)
    : 0;
  const lowMargin = priced.filter(i => ((Number(i.price) - Number(i.cost)) / Number(i.price)) * 100 < 20);
  const inventoryValue = inventory.reduce((s, i) => s + Number(i.cost || 0) * Number(i.stock || 0), 0);

  const totalPayables = payables
    .filter(p => p.status !== 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalReceivables = receivables
    .filter(r => r.status !== 'paid')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const recentTransactions = transactions
    .slice(-10)
    .reverse();

  res.json({
    salesToday: salesToday.toFixed(2),
    totalSales: totalSales.toFixed(2),
    totalTransactions: transactions.length,
    lowStock,
    totalPayables: totalPayables.toFixed(2),
    totalReceivables: totalReceivables.toFixed(2),
    recentTransactions,
    avgMargin,
    lowMarginCount: lowMargin.length,
    inventoryValue: inventoryValue.toFixed(2),
  });
});

module.exports = router;
