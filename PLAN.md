# Bagla Metal Traders — Build Plan

## Business
- Name: Bagla Metal Traders
- Address: Circular Road, Hathras
- Type: Wholesale + Retail SS Utensils

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- SQLite (better-sqlite3) — zero config, swap to PostgreSQL for prod
- JWT Auth (jose library)
- ExcelJS for billing export
- Vercel + Railway deployable

## Modules Built
1. Database schema + seed
2. Auth (JWT, roles: ADMIN, STAFF, CUSTOMER)
3. Billing module (primary module — create items on the fly)
4. Product/Item memory (auto-save from billing)
5. Orders management
6. Inventory / Godown
7. Workers attendance + pay
8. Reports + Excel export
9. Customer storefront
