const express = require('express');
const router = express.Router();
const { readSheet } = require('../utils/excel');

router.get('/', async (req, res) => {
  const [transactions, members, inventory] = await Promise.all([
    readSheet('transactions'),
    readSheet('members'),
    readSheet('inventory')
  ]);

  const today = new Date();

  // ── Top customers by total spend ──────────────────────
  const spendMap = {};
  transactions.forEach(tx => {
    if (!tx.memberId) return;
    spendMap[tx.memberId] = (spendMap[tx.memberId] || 0) + Number(tx.total || 0);
  });

  const topCustomers = members
    .filter(m => m.name !== 'Walk-in Customer' && spendMap[m.id])
    .map(m => ({ ...m, totalSpent: spendMap[m.id] || 0 }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  // ── Most popular products (by units sold) ────────────
  const productQty = {};
  transactions.forEach(tx => {
    try {
      JSON.parse(tx.items).forEach(ci => {
        productQty[ci.productId] = (productQty[ci.productId] || 0) + Number(ci.qty);
      });
    } catch {}
  });

  const topProducts = inventory
    .filter(p => productQty[p.id])
    .map(p => ({ ...p, unitsSold: productQty[p.id] || 0, revenue: (productQty[p.id] || 0) * Number(p.price) }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8);

  // ── At-risk customers (no purchase in 30+ days) ───────
  const lastVisit = {};
  transactions.forEach(tx => {
    if (!tx.memberId) return;
    const d = new Date(tx.date);
    if (!lastVisit[tx.memberId] || d > lastVisit[tx.memberId]) {
      lastVisit[tx.memberId] = d;
    }
  });

  const atRisk = members
    .filter(m => m.name !== 'Walk-in Customer')
    .map(m => {
      const last = lastVisit[m.id];
      const daysSince = last ? Math.floor((today - last) / 86400000) : null;
      return { ...m, lastVisit: last ? last.toISOString() : null, daysSince };
    })
    .filter(m => m.daysSince === null || m.daysSince >= 30)
    .sort((a, b) => (b.daysSince || 999) - (a.daysSince || 999))
    .slice(0, 8);

  // ── Revenue by category ───────────────────────────────
  const catRevenue = {};
  transactions.forEach(tx => {
    try {
      JSON.parse(tx.items).forEach(ci => {
        const p = inventory.find(p => String(p.id) === String(ci.productId));
        if (!p) return;
        const cat = p.category || 'Other';
        catRevenue[cat] = (catRevenue[cat] || 0) + Number(p.price) * Number(ci.qty);
      });
    } catch {}
  });

  const revenueByCategory = Object.entries(catRevenue)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── New members this month ────────────────────────────
  const thisMonth = today.toISOString().slice(0, 7);
  const newMembersCount = members.filter(m =>
    m.name !== 'Walk-in Customer' && (m.joinDate || '').startsWith(thisMonth)
  ).length;

  // ── Walk-in vs member sales ───────────────────────────
  const walkInTotal = transactions
    .filter(t => !t.memberId)
    .reduce((s, t) => s + Number(t.total || 0), 0);
  const memberTotal = transactions
    .filter(t => t.memberId)
    .reduce((s, t) => s + Number(t.total || 0), 0);

  // ── Slow movers: high stock, low sales in last 30 days ──
  const thirtyDaysAgo = new Date(today - 30 * 86400000);
  const recentQty = {};
  transactions
    .filter(t => new Date(t.date) >= thirtyDaysAgo)
    .forEach(tx => {
      try {
        JSON.parse(tx.items).forEach(ci => {
          recentQty[ci.productId] = (recentQty[ci.productId] || 0) + Number(ci.qty);
        });
      } catch {}
    });

  const slowMovers = inventory
    .filter(p => Number(p.stock) >= 10)
    .map(p => ({ ...p, soldLast30: recentQty[p.id] || 0 }))
    .filter(p => p.soldLast30 <= 2)
    .sort((a, b) => Number(b.stock) - Number(a.stock))
    .slice(0, 10);

  // ── Upcoming birthdays (members with birthday field) ───
  const todayMMDD = today.toISOString().slice(5, 10);
  const upcomingBirthdays = members.filter(m => {
    if (!m.birthday) return false;
    const mmdd = String(m.birthday).slice(5, 10);
    const diff = (new Date(`2000-${mmdd}`) - new Date(`2000-${todayMMDD}`));
    return diff >= 0 && diff <= 7 * 86400000;
  });

  res.json({
    topCustomers,
    topProducts,
    atRisk,
    revenueByCategory,
    newMembersCount,
    walkInTotal: walkInTotal.toFixed(2),
    memberTotal: memberTotal.toFixed(2),
    slowMovers,
    upcomingBirthdays,
  });
});

module.exports = router;
