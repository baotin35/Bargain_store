# Bookkeeper App — Claude Context

## Project Overview
A bookkeeping web application for a mom-and-pop store. Built with plain HTML/CSS/JS frontend, Node.js backend, and Excel files as the database layer.

## Stack
- Frontend: HTML, CSS, vanilla JavaScript (no frameworks)
- Backend: Node.js (Express)
- Database: Excel files (.xlsx) via a library like `exceljs` or `xlsx`
- Auth: Simple username/password authentication (session-based, no OAuth)

## Project Goals
Build a practical, lightweight bookkeeping system that a small store owner can use daily without technical knowledge.

## Key Features
1. **Dashboard** — Overview of sales, inventory status, payables, receivables
2. **Inventory Management** — Add, edit, delete products; track stock levels
3. **Barcode Support** — Scan or enter barcodes to identify and manage products
4. **Checkout / Point of Sale** — Process sales transactions using barcode scanning
5. **Invoice Generation** — Generate printable/downloadable invoices per transaction
6. **Accounts Payable** — Track money owed to suppliers
7. **Accounts Receivable** — Track member accounts and credit balances
8. **Member Accounts** — Register members, view transaction history, manage credit

## Conventions
- Vanilla JS only — no React, Vue, or other frameworks
- Separate files per feature/module (no monolithic scripts)
- REST API on the backend; JSON responses
- Excel sheets act as tables (one sheet per entity: products, transactions, members, etc.)
- Keep UI simple and readable — large buttons, clear labels for non-technical users
- Use consistent naming: camelCase for JS variables/functions, kebab-case for file names

## Folder Structure (planned)
```
bookeeper-app-claude/
├── CLAUDE.md
├── server.js          # Express entry point
├── package.json
├── data/              # Excel files (database)
│   ├── inventory.xlsx
│   ├── transactions.xlsx
│   ├── members.xlsx
│   ├── payables.xlsx
│   └── receivables.xlsx
├── routes/            # API route handlers
├── public/            # Static frontend files
│   ├── index.html     # Login / entry point
│   ├── dashboard.html
│   ├── inventory.html
│   ├── checkout.html
│   ├── invoice.html
│   ├── payables.html
│   ├── receivables.html
│   ├── members.html
│   ├── css/
│   └── js/
└── utils/             # Excel read/write helpers, barcode utils
```

## Notes
- Before every update: review existing code and logic thoroughly
- Compare new code against any attached or referenced files before writing
- Avoid breaking existing features when adding new ones
- Keep the Excel schema consistent — document any sheet/column changes here
- Invoice output should be print-friendly (CSS print media query)
- Barcode scanning should support both USB barcode scanners (keyboard input) and manual entry
