const { writeSheet } = require('./excel');

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dateStr(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log('Seeding database...');

  // ── Users ────────────────────────────────────────────
  await writeSheet('users', [
    { id: 1, username: 'admin',    password: 'admin123', role: 'admin' },
    { id: 2, username: 'cashier1', password: 'cash123',  role: 'cashier' },
  ]);

  // ── Inventory (30 products — USD, California store) ──────
  await writeSheet('inventory', [
    // Beverages
    { id:  1, barcode: '049000028911', name: 'Coca-Cola 2L',           category: 'Beverages',  price:  2.49, cost:  1.40, stock: 48,  unit: 'btl' },
    { id:  2, barcode: '012000001413', name: 'Pepsi 2L',               category: 'Beverages',  price:  2.29, cost:  1.30, stock: 36,  unit: 'btl' },
    { id:  3, barcode: '078000113925', name: 'Gatorade Fruit Punch',   category: 'Beverages',  price:  1.99, cost:  1.10, stock: 60,  unit: 'btl' },
    { id:  4, barcode: '085239012055', name: 'Tropicana OJ 52oz',      category: 'Beverages',  price:  5.49, cost:  3.50, stock: 24,  unit: 'btl' },
    { id:  5, barcode: '076301120055', name: 'Dasani Water 24pk',      category: 'Beverages',  price:  4.99, cost:  2.80, stock: 30,  unit: 'pk'  },
    { id:  6, barcode: '014800002563', name: 'Red Bull 8.4oz',         category: 'Beverages',  price:  3.49, cost:  2.00, stock: 72,  unit: 'can' },
    // Snacks
    { id:  7, barcode: '028400090100', name: "Lay's Classic Chips 8oz",category: 'Snacks',     price:  4.29, cost:  2.50, stock: 55,  unit: 'bag' },
    { id:  8, barcode: '028400090117', name: 'Doritos Nacho 9.25oz',   category: 'Snacks',     price:  4.49, cost:  2.60, stock: 48,  unit: 'bag' },
    { id:  9, barcode: '016000275607', name: 'Cheez-It Crackers 21oz', category: 'Snacks',     price:  5.99, cost:  3.60, stock: 40,  unit: 'box' },
    { id: 10, barcode: '040000496465', name: 'Snickers Bar 1.86oz',    category: 'Snacks',     price:  1.79, cost:  0.95, stock: 80,  unit: 'pcs' },
    // Canned Goods
    { id: 11, barcode: '037600103145', name: 'Spam Classic 12oz',      category: 'Canned',     price:  4.29, cost:  2.80, stock: 30,  unit: 'can' },
    { id: 12, barcode: '000000018834', name: "Campbell's Chicken Soup",category: 'Canned',     price:  1.99, cost:  1.10, stock: 60,  unit: 'can' },
    { id: 13, barcode: '000000016434', name: 'Hunt\'s Diced Tomatoes', category: 'Canned',     price:  1.49, cost:  0.80, stock: 72,  unit: 'can' },
    { id: 14, barcode: '046000890845', name: 'Del Monte Corn 15.25oz', category: 'Canned',     price:  1.29, cost:  0.70, stock: 90,  unit: 'can' },
    // Condiments
    { id: 15, barcode: '013000006408', name: 'Heinz Ketchup 32oz',     category: 'Condiments', price:  4.49, cost:  2.70, stock: 24,  unit: 'btl' },
    { id: 16, barcode: '021500013512', name: 'French\'s Yellow Mustard',category:'Condiments', price:  2.99, cost:  1.70, stock: 20,  unit: 'btl' },
    { id: 17, barcode: '048001218957', name: 'Hellmann\'s Mayo 30oz',  category: 'Condiments', price:  5.79, cost:  3.50, stock: 18,  unit: 'jar' },
    // Personal Care
    { id: 18, barcode: '037000864240', name: 'Head & Shoulders 23.7oz',category: 'Personal',   price:  9.97, cost:  6.50, stock: 20,  unit: 'btl' },
    { id: 19, barcode: '037000864257', name: 'Dove Beauty Bar 6pk',    category: 'Personal',   price:  7.49, cost:  4.50, stock: 36,  unit: 'pk'  },
    { id: 20, barcode: '035000675346', name: 'Colgate Total 6oz',      category: 'Personal',   price:  4.99, cost:  3.00, stock: 40,  unit: 'pcs' },
    // Staples
    { id: 21, barcode: '074401200012', name: 'Mahatma Jasmine Rice 5lb',category:'Staples',    price:  6.49, cost:  4.20, stock: 20,  unit: 'bag' },
    { id: 22, barcode: '041196003025', name: 'Gold Medal Flour 5lb',   category: 'Staples',    price:  4.99, cost:  3.10, stock: 3,   unit: 'bag' },
    { id: 23, barcode: '016000443570', name: 'Quaker Oats 42oz',       category: 'Staples',    price:  5.49, cost:  3.30, stock: 30,  unit: 'box' },
    { id: 24, barcode: '070200009108', name: 'Barilla Spaghetti 16oz', category: 'Staples',    price:  1.99, cost:  1.10, stock: 60,  unit: 'box' },
    // Dairy
    { id: 25, barcode: '041130330087', name: 'Kraft Shredded Cheese 8oz',category:'Dairy',     price:  3.99, cost:  2.50, stock: 30,  unit: 'pcs' },
    { id: 26, barcode: '021000658947', name: 'Philadelphia Cream Cheese',category:'Dairy',     price:  3.49, cost:  2.10, stock: 24,  unit: 'pcs' },
    { id: 27, barcode: '041130333088', name: 'Dannon Vanilla Yogurt 6pk',category:'Dairy',     price:  5.29, cost:  3.20, stock: 18,  unit: 'pk'  },
    // Household
    { id: 28, barcode: '037000946618', name: 'Tide Pods 81ct',         category: 'Household',  price: 19.97, cost: 13.50, stock: 4,   unit: 'box' },
    { id: 29, barcode: '044600309132', name: 'Clorox Bleach 81oz',     category: 'Household',  price:  4.49, cost:  2.70, stock: 20,  unit: 'btl' },
    { id: 30, barcode: '037000862420', name: 'Dawn Dish Soap 75oz',    category: 'Household',  price:  7.49, cost:  4.50, stock: 16,  unit: 'btl' },
  ]);

  // ── Members / Customers (12) — California addresses ──────
  await writeSheet('members', [
    { id:  1, name: 'Walk-in Customer',  phone: '',               email: '',                     address: '',                              creditLimit:   0,    balance:   0,    joinDate: dateStr(-180), points:    0, tier: 'Bronze',   birthday: '' },
    { id:  2, name: 'Maria Johnson',     phone: '(310) 555-0101', email: 'maria.j@gmail.com',    address: '142 Oak St, Los Angeles, CA',   creditLimit: 200,    balance:  45.50, joinDate: dateStr(-120), points: 1240, tier: 'Gold',     birthday: '1988-05-15' },
    { id:  3, name: 'James Williams',    phone: '(323) 555-0102', email: 'jwilliams@outlook.com',address: '88 Maple Ave, Compton, CA',     creditLimit: 300,    balance: 120.75, joinDate: dateStr(-90),  points:  620, tier: 'Silver',   birthday: '1975-03-22' },
    { id:  4, name: 'Linda Garcia',      phone: '(818) 555-0103', email: 'lgarcia@yahoo.com',    address: '55 Pine Rd, Van Nuys, CA',      creditLimit: 150,    balance:   0,    joinDate: dateStr(-75),  points:  480, tier: 'Bronze',   birthday: '1992-07-04' },
    { id:  5, name: 'Robert Martinez',   phone: '(626) 555-0104', email: '',                     address: '210 Elm St, Pasadena, CA',      creditLimit: 250,    balance:  80.00, joinDate: dateStr(-60),  points: 2150, tier: 'Platinum', birthday: '1965-11-30' },
    { id:  6, name: 'Patricia Davis',    phone: '(562) 555-0105', email: 'pdavis@email.com',     address: '33 Cedar Ln, Long Beach, CA',   creditLimit: 100,    balance:  35.25, joinDate: dateStr(-45),  points:  310, tier: 'Bronze',   birthday: '1983-09-18' },
    { id:  7, name: 'Michael Brown',     phone: '(213) 555-0106', email: 'mbrown@gmail.com',     address: '77 Sunset Blvd, Hollywood, CA', creditLimit: 500,    balance: 210.00, joinDate: dateStr(-30),  points: 1850, tier: 'Gold',     birthday: '1979-12-05' },
    { id:  8, name: 'Barbara Wilson',    phone: '(310) 555-0107', email: '',                     address: '19 Harbor Dr, Torrance, CA',    creditLimit: 150,    balance:   0,    joinDate: dateStr(-20),  points:  890, tier: 'Silver',   birthday: '1995-02-14' },
    { id:  9, name: 'David Anderson',    phone: '(323) 555-0108', email: 'danderson@mail.com',   address: '401 Hill St, East LA, CA',      creditLimit: 200,    balance:  60.00, joinDate: dateStr(-15),  points: 1540, tier: 'Gold',     birthday: '1970-06-28' },
    { id: 10, name: 'Susan Thompson',    phone: '(818) 555-0109', email: '',                     address: '66 Valley Rd, Burbank, CA',     creditLimit: 100,    balance:   0,    joinDate: dateStr(-10),  points:  145, tier: 'Bronze',   birthday: '2000-08-11' },
    { id: 11, name: 'Charles Lee',       phone: '(626) 555-0110', email: 'charlee@email.com',    address: '28 Garden Ave, Alhambra, CA',   creditLimit: 350,    balance: 175.50, joinDate: dateStr(-7),   points: 2380, tier: 'Platinum', birthday: '1968-04-03' },
    { id: 12, name: 'Nancy White',       phone: '(562) 555-0111', email: 'nwhite@gmail.com',     address: '512 Beach Blvd, Anaheim, CA',   creditLimit: 200,    balance:  50.00, joinDate: dateStr(-3),   points:   75, tier: 'Bronze',   birthday: '1990-01-19' },
  ]);

  // ── Transactions / Invoices (15) — USD amounts + CA tax ──
  // items reference products by id; totals pre-calculated with 7.25% tax
  const transactions = [
    { id:  1, date: daysAgo(14), memberId: 2,  items: JSON.stringify([{productId:1,qty:2},{productId:7,qty:1},{productId:23,qty:3}]),  total: 20.37, discount: 0,    tax: 1.84, amountPaid: 25.00, change: 4.63,  invoiceNo: 'INV-00001', paymentMethod: 'cash'        },
    { id:  2, date: daysAgo(13), memberId: '',  items: JSON.stringify([{productId:5,qty:2},{productId:8,qty:1},{productId:14,qty:3}]),  total: 22.56, discount: 0,    tax: 2.05, amountPaid: 22.56, change: 0,     invoiceNo: 'INV-00002', paymentMethod: 'credit_card' },
    { id:  3, date: daysAgo(12), memberId: 3,  items: JSON.stringify([{productId:11,qty:1},{productId:12,qty:2},{productId:26,qty:1}]), total: 14.68, discount: 1.00, tax: 1.33, amountPaid: 15.00, change: 0.32,  invoiceNo: 'INV-00003', paymentMethod: 'cash'        },
    { id:  4, date: daysAgo(11), memberId: 4,  items: JSON.stringify([{productId:21,qty:1},{productId:24,qty:3},{productId:5,qty:2}]), total: 22.94, discount: 0,    tax: 2.09, amountPaid: 22.94, change: 0,     invoiceNo: 'INV-00004', paymentMethod: 'debit_card'  },
    { id:  5, date: daysAgo(10), memberId: '',  items: JSON.stringify([{productId:18,qty:1},{productId:19,qty:1},{productId:20,qty:1}]),total: 23.61, discount: 0,    tax: 2.15, amountPaid: 25.00, change: 1.39,  invoiceNo: 'INV-00005', paymentMethod: 'cash'        },
    { id:  6, date: daysAgo(8),  memberId: 5,  items: JSON.stringify([{productId:2,qty:2},{productId:9,qty:1},{productId:13,qty:1}]),  total: 16.49, discount: 0,    tax: 1.50, amountPaid: 16.49, change: 0,     invoiceNo: 'INV-00006', paymentMethod: 'credit_card' },
    { id:  7, date: daysAgo(7),  memberId: 6,  items: JSON.stringify([{productId:16,qty:1},{productId:15,qty:1},{productId:29,qty:1}]), total: 13.38, discount: 0.50, tax: 1.22, amountPaid: 15.00, change: 1.62,  invoiceNo: 'INV-00007', paymentMethod: 'cash'        },
    { id:  8, date: daysAgo(5),  memberId: 7,  items: JSON.stringify([{productId:22,qty:1},{productId:24,qty:2},{productId:27,qty:2}]), total: 21.17, discount: 1.00, tax: 1.93, amountPaid: 21.17, change: 0,     invoiceNo: 'INV-00008', paymentMethod: 'debit_card'  },
    { id:  9, date: daysAgo(4),  memberId: '',  items: JSON.stringify([{productId:3,qty:2},{productId:10,qty:3},{productId:25,qty:1}]), total: 21.03, discount: 0,    tax: 1.91, amountPaid: 25.00, change: 3.97,  invoiceNo: 'INV-00009', paymentMethod: 'cash'        },
    { id: 10, date: daysAgo(3),  memberId: 8,  items: JSON.stringify([{productId:6,qty:2},{productId:17,qty:1},{productId:30,qty:1}]),  total: 26.22, discount: 0,    tax: 2.39, amountPaid: 26.22, change: 0,     invoiceNo: 'INV-00010', paymentMethod: 'credit_card' },
    { id: 11, date: daysAgo(2),  memberId: 9,  items: JSON.stringify([{productId:4,qty:1},{productId:28,qty:1},{productId:5,qty:2}]),   total: 34.21, discount: 0,    tax: 3.11, amountPaid: 35.00, change: 0.79,  invoiceNo: 'INV-00011', paymentMethod: 'cash'        },
    { id: 12, date: daysAgo(1),  memberId: 10, items: JSON.stringify([{productId:1,qty:2},{productId:12,qty:2},{productId:23,qty:2}]),  total: 18.77, discount: 0,    tax: 1.71, amountPaid: 20.00, change: 1.23,  invoiceNo: 'INV-00012', paymentMethod: 'cash'        },
    { id: 13, date: daysAgo(0),  memberId: 11, items: JSON.stringify([{productId:21,qty:1},{productId:26,qty:2},{productId:27,qty:1}]), total: 24.20, discount: 2.00, tax: 2.20, amountPaid: 24.20, change: 0,     invoiceNo: 'INV-00013', paymentMethod: 'debit_card'  },
    { id: 14, date: daysAgo(0),  memberId: '',  items: JSON.stringify([{productId:8,qty:2},{productId:14,qty:2},{productId:19,qty:1}]), total: 21.03, discount: 0,    tax: 1.91, amountPaid: 25.00, change: 3.97,  invoiceNo: 'INV-00014', paymentMethod: 'cash'        },
    { id: 15, date: daysAgo(0),  memberId: 12, items: JSON.stringify([{productId:20,qty:1},{productId:25,qty:1},{productId:29,qty:1}]), total: 20.63, discount: 1.00, tax: 1.88, amountPaid: 20.63, change: 0,     invoiceNo: 'INV-00015', paymentMethod: 'credit_card' },
  ];

  await writeSheet('transactions', transactions.map(t => ({
    ...t,
    total:      Number(t.total).toFixed(2),
    discount:   Number(t.discount).toFixed(2),
    tax:        Number(t.tax).toFixed(2),
    amountPaid: Number(t.amountPaid).toFixed(2),
    change:     Number(t.change).toFixed(2),
  })));

  // ── Accounts Payable / Vendors (8) — US suppliers ─────
  await writeSheet('payables', [
    { id: 1, supplier: 'PepsiCo Beverages North America', description: 'Monthly beverage restock',  amount: 1250.00, dueDate: dateStr(-5),  paidDate: dateStr(-6),  status: 'paid'   },
    { id: 2, supplier: 'Frito-Lay North America',          description: 'Snacks & chips delivery',  amount:  840.00, dueDate: dateStr(3),   paidDate: '',           status: 'unpaid' },
    { id: 3, supplier: 'Kraft Heinz Company',              description: 'Condiments & sauces',      amount:  620.00, dueDate: dateStr(7),   paidDate: '',           status: 'unpaid' },
    { id: 4, supplier: "General Mills Inc.",               description: 'Cereals & staples restock', amount:  480.00, dueDate: dateStr(-2),  paidDate: dateStr(-3),  status: 'paid'   },
    { id: 5, supplier: 'Procter & Gamble Dist.',           description: 'Household & personal care', amount:  980.00, dueDate: dateStr(10),  paidDate: '',           status: 'unpaid' },
    { id: 6, supplier: 'Hormel Foods Corp.',               description: 'Canned meats & proteins',  amount:  390.00, dueDate: dateStr(-10), paidDate: dateStr(-11), status: 'paid'   },
    { id: 7, supplier: 'Del Monte Foods Inc.',             description: 'Canned vegetables & fruit', amount:  560.00, dueDate: dateStr(5),   paidDate: '',           status: 'unpaid' },
    { id: 8, supplier: 'Danone North America',             description: 'Dairy products restocking', amount:  410.00, dueDate: dateStr(-15), paidDate: dateStr(-14), status: 'paid'   },
  ]);

  // ── Accounts Receivable / Member Credits (8) ──────────
  await writeSheet('receivables', [
    { id: 1, memberId: 3,  memberName: 'James Williams',  description: 'Credit purchase — canned goods',  amount: 120.75, dueDate: dateStr(5),  paidDate: '', status: 'unpaid' },
    { id: 2, memberId: 5,  memberName: 'Robert Martinez', description: 'Credit purchase — groceries',     amount:  80.00, dueDate: dateStr(10), paidDate: '', status: 'unpaid' },
    { id: 3, memberId: 7,  memberName: 'Michael Brown',   description: 'Credit purchase — staples',       amount: 210.00, dueDate: dateStr(3),  paidDate: '', status: 'unpaid' },
    { id: 4, memberId: 2,  memberName: 'Maria Johnson',   description: 'Credit purchase — beverages',     amount:  45.50, dueDate: dateStr(7),  paidDate: '', status: 'unpaid' },
    { id: 5, memberId: 6,  memberName: 'Patricia Davis',  description: 'Credit purchase — condiments',    amount:  35.25, dueDate: dateStr(14), paidDate: '', status: 'unpaid' },
    { id: 6, memberId: 9,  memberName: 'David Anderson',  description: 'Credit purchase — household',     amount:  60.00, dueDate: dateStr(0),  paidDate: '', status: 'unpaid' },
    { id: 7, memberId: 11, memberName: 'Charles Lee',     description: 'Credit purchase — personal care', amount: 175.50, dueDate: dateStr(-5), paidDate: '', status: 'unpaid' },
    { id: 8, memberId: 12, memberName: 'Nancy White',     description: 'Credit purchase — snacks',        amount:  50.00, dueDate: dateStr(21), paidDate: '', status: 'unpaid' },
  ]);

  console.log('Done! Seeded: 30 products | 12 members | 15 invoices | 8 payables | 8 receivables');
  console.log('Login: admin / admin123');
}

seed().catch(console.error);
