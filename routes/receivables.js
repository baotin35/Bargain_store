const express = require('express');
const router = express.Router();
const { readSheet, appendRow, updateRow, deleteRow, nextId } = require('../utils/excel');

router.get('/', async (req, res) => {
  res.json(await readSheet('receivables'));
});

router.post('/', async (req, res) => {
  const rows = await readSheet('receivables');
  const row = { id: nextId(rows), status: 'unpaid', ...req.body };
  await appendRow('receivables', row);
  res.json(row);
});

router.put('/:id', async (req, res) => {
  const updated = await updateRow('receivables', req.params.id, req.body);
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await deleteRow('receivables', req.params.id);
  res.json({ success: true });
});

module.exports = router;
