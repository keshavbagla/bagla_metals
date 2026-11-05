const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Clean old database if running fresh init
const dbPath = path.join(dbDir, 'bagla.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  email       TEXT    UNIQUE NOT NULL,
  phone       TEXT,
  password    TEXT    NOT NULL,
  role        TEXT    NOT NULL DEFAULT 'CUSTOMER' CHECK(role IN ('ADMIN','STAFF','CUSTOMER')),
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS customers (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id),
  name          TEXT    NOT NULL,
  phone         TEXT,
  address       TEXT,
  city          TEXT,
  customer_type TEXT    NOT NULL DEFAULT 'RETAIL',
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brands (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    UNIQUE NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS godowns (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    UNIQUE NOT NULL,
  address    TEXT,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Complete Products Master: Manufacturer purchase rate, customer sell rate, stock, godown location
CREATE TABLE IF NOT EXISTS products (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL,
  category          TEXT,
  size              TEXT,
  grade             TEXT    DEFAULT '202',
  brand             TEXT,
  manufacturer_name TEXT,
  godown_name       TEXT    DEFAULT 'Godown 1 (Circular Road)',
  stock_qty         REAL    DEFAULT 0,
  unit              TEXT    DEFAULT 'kg',
  purchase_price    REAL    DEFAULT 0,
  selling_price     REAL    DEFAULT 0,
  wholesale_price   REAL    DEFAULT 0,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(name, category, size, grade, brand, godown_name)
);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_godown ON products(godown_name);

-- Bills with explicit subtotal, bag cost, discount, grand total, paid, balance left
CREATE TABLE IF NOT EXISTS bills (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_number     TEXT    UNIQUE NOT NULL,
  customer_name   TEXT    NOT NULL,
  customer_phone  TEXT,
  customer_address TEXT,
  bill_date       TEXT    NOT NULL DEFAULT (date('now')),
  subtotal        REAL    NOT NULL DEFAULT 0,
  bag_cost        REAL    DEFAULT 0,
  discount        REAL    DEFAULT 0,
  total           REAL    NOT NULL DEFAULT 0,
  amount_paid     REAL    DEFAULT 0,
  balance_due     REAL    DEFAULT 0,
  payment_status  TEXT    NOT NULL DEFAULT 'PENDING',
  payment_method  TEXT    DEFAULT 'CASH',
  notes           TEXT,
  status          TEXT    NOT NULL DEFAULT 'FINAL',
  created_by      INTEGER REFERENCES users(id),
  last_saved_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_due ON bills(balance_due);

CREATE TABLE IF NOT EXISTS bill_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  bill_id     INTEGER NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  row_order   INTEGER DEFAULT 0,
  item_name   TEXT    NOT NULL,
  category    TEXT,
  size        TEXT,
  grade       TEXT,
  brand       TEXT,
  qty         REAL    NOT NULL DEFAULT 1,
  unit        TEXT    NOT NULL DEFAULT 'kg',
  rate        REAL    NOT NULL DEFAULT 0,
  labour      REAL    DEFAULT 0,
  amount      REAL    NOT NULL DEFAULT 0,
  notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_bill_items_item ON bill_items(item_name);

-- Offline Orders
CREATE TABLE IF NOT EXISTS orders (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number      TEXT    UNIQUE NOT NULL,
  customer_name     TEXT    NOT NULL,
  customer_phone    TEXT,
  customer_address  TEXT,
  order_type        TEXT    NOT NULL DEFAULT 'RETAIL',
  transport_mode    TEXT    DEFAULT 'OWN_VEHICLE',
  vehicle_details   TEXT,
  order_date        TEXT    NOT NULL DEFAULT (date('now')),
  status            TEXT    NOT NULL DEFAULT 'PENDING',
  subtotal          REAL    NOT NULL DEFAULT 0,
  discount          REAL    DEFAULT 0,
  total             REAL    NOT NULL DEFAULT 0,
  notes             TEXT,
  created_by        INTEGER REFERENCES users(id),
  created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id    INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name   TEXT    NOT NULL,
  category    TEXT,
  size        TEXT,
  grade       TEXT,
  brand       TEXT,
  qty         REAL    NOT NULL,
  unit        TEXT    NOT NULL DEFAULT 'kg',
  rate        REAL    NOT NULL DEFAULT 0,
  amount      REAL    NOT NULL
);

-- Workers Master
CREATE TABLE IF NOT EXISTS workers (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  phone           TEXT,
  worker_type     TEXT    NOT NULL DEFAULT 'FULL_TIME',
  monthly_salary  REAL    DEFAULT 0,
  bundle_rate     REAL    DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  joined_at       TEXT    NOT NULL DEFAULT (date('now')),
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key         TEXT    PRIMARY KEY,
  value       TEXT    NOT NULL,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
`;

db.exec(schema);

// 3 Godowns in Hathras
const godowns = [
  ['Godown 1 (Circular Road)', 'Main Stock Yard, Circular Road, Hathras'],
  ['Godown 2 (Mandi Gate)', 'Near Mandi Gate, Hathras'],
  ['Godown 3 (Industrial Area)', 'Plot 12, Industrial Area, Hathras']
];
const insertGodown = db.prepare(`INSERT OR IGNORE INTO godowns (name, address) VALUES (?, ?)`);
godowns.forEach(([name, addr]) => insertGodown.run(name, addr));

// Categories / Finishes
const categories = [
  'Silver Touch',
  'Ring',
  'Laser',
  'Laser + Ring',
  'Silver Touch + Laser',
  'PVD Coating'
];
const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, ?)`);
categories.forEach((c, idx) => insertCat.run(c, idx + 1));

// Brands
const brands = ['JPS','Mango','Apple','Lavi','Kwality','Baba','Kashvi','Ritu','Mukundham','Parul','Surya','Tanishq','Raja','Marvy','D.S'];
const insertBrand = db.prepare(`INSERT OR IGNORE INTO brands (name) VALUES (?)`);
brands.forEach(b => insertBrand.run(b));

// Admin user
const adminPass = bcrypt.hashSync('admin123', 10);
db.prepare(`INSERT OR IGNORE INTO users (id, name, email, phone, password, role) VALUES (1, 'Admin', 'admin@bagla.com', '9999999999', ?, 'ADMIN')`).run(adminPass);

const defaultSettings = [
  ['bill_prefix', 'BMT'],
  ['bill_counter', '1000'],
  ['order_prefix', 'ORD'],
  ['order_counter', '1000'],
  ['business_name', 'Bagla Metal Traders'],
  ['business_address', 'Circular Road, Hathras'],
];
const insertSetting = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
defaultSettings.forEach(([k, v]) => insertSetting.run(k, v));

console.log('✅ DB initialized: 3 Godowns, Manufacturer rates, Customer rates, and Balance Due tracking ready!');
db.close();
