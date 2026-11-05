import getDb from './db';

export function getNextBillNumber(): string {
  const db = getDb();
  const prefix = (db.prepare(`SELECT value FROM settings WHERE key='bill_prefix'`).get() as any)?.value || 'BMT';
  const counterRow = db.prepare(`SELECT value FROM settings WHERE key='bill_counter'`).get() as any;
  const counter = parseInt(counterRow?.value || '1000') + 1;
  db.prepare(`UPDATE settings SET value=? WHERE key='bill_counter'`).run(String(counter));
  const today = new Date();
  const yy = String(today.getFullYear()).slice(2);
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  return `${prefix}/${yy}-${mm}/${counter}`;
}

export function getNextOrderNumber(): string {
  const db = getDb();
  const prefix = (db.prepare(`SELECT value FROM settings WHERE key='order_prefix'`).get() as any)?.value || 'ORD';
  const counterRow = db.prepare(`SELECT value FROM settings WHERE key='order_counter'`).get() as any;
  const counter = parseInt(counterRow?.value || '1000') + 1;
  db.prepare(`UPDATE settings SET value=? WHERE key='order_counter'`).run(String(counter));
  return `${prefix}-${counter}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}
