const ExcelJS = require('exceljs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

const FILES = {
  inventory:    path.join(DATA_DIR, 'inventory.xlsx'),
  transactions: path.join(DATA_DIR, 'transactions.xlsx'),
  members:      path.join(DATA_DIR, 'members.xlsx'),
  payables:     path.join(DATA_DIR, 'payables.xlsx'),
  receivables:  path.join(DATA_DIR, 'receivables.xlsx'),
  users:        path.join(DATA_DIR, 'users.xlsx'),
};

const SHEETS = {
  inventory:    { name: 'Inventory',    headers: ['id','barcode','name','category','price','cost','stock','unit'] },
  transactions: { name: 'Transactions', headers: ['id','date','memberId','items','total','discount','tax','amountPaid','change','invoiceNo','paymentMethod'] },
  members:      { name: 'Members',      headers: ['id','name','phone','email','address','creditLimit','balance','joinDate','points','tier','birthday'] },
  payables:     { name: 'Payables',     headers: ['id','supplier','description','amount','dueDate','paidDate','status'] },
  receivables:  { name: 'Receivables',  headers: ['id','memberId','memberName','description','amount','dueDate','paidDate','status'] },
  users:        { name: 'Users',        headers: ['id','username','password','role'] },
};

async function getWorkbook(file) {
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(file);
  } catch {
    // File doesn't exist yet — return empty workbook
  }
  return wb;
}

async function readSheet(type) {
  const { file, sheet } = resolve(type);
  const wb = await getWorkbook(file);
  let ws = wb.getWorksheet(sheet.name);
  if (!ws) return [];

  const rows = [];
  ws.eachRow((row, i) => {
    if (i === 1) return; // skip header
    const obj = {};
    sheet.headers.forEach((h, idx) => {
      obj[h] = row.getCell(idx + 1).value;
    });
    rows.push(obj);
  });
  return rows;
}

async function writeSheet(type, rows) {
  const { file, sheet } = resolve(type);
  const wb = await getWorkbook(file);
  wb.removeWorksheet(sheet.name);
  const ws = wb.addWorksheet(sheet.name);

  ws.addRow(sheet.headers);
  ws.getRow(1).font = { bold: true };

  rows.forEach(row => {
    ws.addRow(sheet.headers.map(h => row[h] ?? ''));
  });

  await wb.xlsx.writeFile(file);
}

async function appendRow(type, row) {
  const rows = await readSheet(type);
  rows.push(row);
  await writeSheet(type, rows);
}

async function updateRow(type, id, updates) {
  const rows = await readSheet(type);
  const idx = rows.findIndex(r => String(r.id) === String(id));
  if (idx === -1) throw new Error('Row not found');
  rows[idx] = { ...rows[idx], ...updates };
  await writeSheet(type, rows);
  return rows[idx];
}

async function deleteRow(type, id) {
  const rows = await readSheet(type);
  const filtered = rows.filter(r => String(r.id) !== String(id));
  await writeSheet(type, filtered);
}

function nextId(rows) {
  if (!rows.length) return 1;
  return Math.max(...rows.map(r => Number(r.id) || 0)) + 1;
}

function resolve(type) {
  return { file: FILES[type], sheet: SHEETS[type] };
}

module.exports = { readSheet, writeSheet, appendRow, updateRow, deleteRow, nextId };