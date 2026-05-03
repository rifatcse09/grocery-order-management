-- Purge orders and related rows. Keeps: users, categories, catalog_items,
-- item_price_histories rows where order_id IS NULL (catalog-only history).
-- Run with your DB client (psql, sqlite3, etc.) after backup.
-- Laravel: prefer `php artisan db:purge-order-data --force`

BEGIN;

DELETE FROM payments;
DELETE FROM invoices;
DELETE FROM challans;
DELETE FROM order_lines;

DELETE FROM item_price_histories WHERE order_id IS NOT NULL;

DELETE FROM adjustments;
DELETE FROM ledger_entries;
DELETE FROM statement_cycles;
DELETE FROM activity_logs;
DELETE FROM notifications;
DELETE FROM orders;

COMMIT;
