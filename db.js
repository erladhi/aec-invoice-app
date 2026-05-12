const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'invoices.db'));

db.prepare(`
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientName TEXT,
    date TEXT,
    items TEXT,
    discount REAL,
    tax REAL,
    total REAL
  )
`).run();

function saveInvoice(invoice) {
  const stmt = db.prepare(`
    INSERT INTO invoices (clientName, date, items, discount, tax, total)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    invoice.clientName,
    invoice.date,
    JSON.stringify(invoice.items),
    invoice.discount,
    invoice.tax,
    invoice.total
  );
  return { id: info.lastInsertRowid };
}

function getInvoices() {
  return db.prepare(`SELECT * FROM invoices ORDER BY date DESC`).all();
}

module.exports = { saveInvoice, getInvoices };
