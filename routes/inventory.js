const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow, nextId } = require('../utils/excel');

router.get('/', async (req, res) => {
  const items = await readSheet('inventory');
  res.json(items);
});

router.get('/barcode/:code', async (req, res) => {
  const items = await readSheet('inventory');
  const item = items.find(i => String(i.barcode) === req.params.code);
  if (!item) return res.status(404).json({ error: 'Product not found' });
  res.json(item);
});

router.post('/', async (req, res) => {
  const rows = await readSheet('inventory');
  const item = { id: nextId(rows), ...req.body };
  await appendRow('inventory', item);
  res.json(item);
});

router.put('/:id', async (req, res) => {
  const updated = await updateRow('inventory', req.params.id, req.body);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await deleteRow('inventory', req.params.id);
  res.json({ success: true });
});

module.exports = router;
