const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const checkoutRoutes = require('./routes/checkout');
const invoiceRoutes = require('./routes/invoice');
const payablesRoutes = require('./routes/payables');
const receivablesRoutes = require('./routes/receivables');
const membersRoutes = require('./routes/members');
const dashboardRoutes = require('./routes/dashboard');
const marketingRoutes = require('./routes/marketing');
const notifyRoutes = require('./routes/notify');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'bookeeper-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 } // 8 hours
}));

// Auth middleware — protect all non-auth routes
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.redirect('/index.html');
}

app.use('/api/auth', authRoutes);
app.use('/api/inventory', requireAuth, inventoryRoutes);
app.use('/api/checkout', requireAuth, checkoutRoutes);
app.use('/api/invoice', requireAuth, invoiceRoutes);
app.use('/api/payables', requireAuth, payablesRoutes);
app.use('/api/receivables', requireAuth, receivablesRoutes);
app.use('/api/members', requireAuth, membersRoutes);
app.use('/api/dashboard', requireAuth, dashboardRoutes);
app.use('/api/marketing', requireAuth, marketingRoutes);
app.use('/api/notify', requireAuth, notifyRoutes);
app.use('/api/settings', requireAuth, settingsRoutes);

// Protect HTML pages (except login)
app.get(['dashboard.html', 'inventory.html', 'checkout.html', 'invoice.html',
  'payables.html', 'receivables.html', 'members.html', 'marketing.html', 'settings.html'].map(p => '/' + p),
  requireAuth,
  (req, res) => res.sendFile(path.join(__dirname, 'public', req.path))
);

app.listen(PORT, () => {
  console.log(`Mom and Pop app running at http://localhost:${PORT}`);
});