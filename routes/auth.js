const express = require('express');
const router = express.Router();
const { readSheet } = require('../utils/excel');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = await readSheet('users');
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ success: true, user: req.session.user });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

router.get('/me', (req, res) => {
  if (req.session.user) return res.json(req.session.user);
  res.status(401).json({ error: 'Not logged in' });
});

module.exports = router;
