-- =============================================================================
-- Grocery Order Management — Inventory & Purchase Order Module
-- SQL Migration for cPanel Shared Hosting (MySQL 5.7+ / MySQL 8.0)
--
-- Run this entire script once in phpMyAdmin → SQL tab (or any MySQL client).
-- All statements use CREATE TABLE IF NOT EXISTS so it is safe to re-run.
-- Order matters: tables with foreign-key dependencies come after their parents.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- 1. suppliers
--    Master list of suppliers. Referenced by purchase_orders, inventory,
--    stock_movements, stock_returns, and purchase_bills.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(200)    NOT NULL,
  `contact_person` VARCHAR(200)    DEFAULT NULL,
  `phone`          VARCHAR(50)     DEFAULT NULL,
  `email`          VARCHAR(200)    DEFAULT NULL,
  `address`        TEXT            DEFAULT NULL,
  `notes`          TEXT            DEFAULT NULL,
  `is_active`      TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at`     TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`     TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. purchase_orders
--    PO header. Auto-generated PO numbers (e.g. PO-20260609-0001).
--    Depends on: suppliers, users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_orders` (
  `id`                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `po_number`            VARCHAR(50)     NOT NULL,
  `supplier_id`          BIGINT UNSIGNED NOT NULL,
  `purchase_date`        DATE            NOT NULL,
  `expected_receipt_date` DATE           DEFAULT NULL,
  `status`               ENUM('draft','confirmed','partially_received','received','cancelled')
                         NOT NULL DEFAULT 'draft',
  `total_cost`           DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  `remarks`              TEXT            DEFAULT NULL,
  `created_by`           BIGINT UNSIGNED NOT NULL,
  `confirmed_at`         TIMESTAMP       NULL DEFAULT NULL,
  `created_at`           TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`           TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_orders_po_number_unique` (`po_number`),
  KEY `purchase_orders_supplier_id_foreign` (`supplier_id`),
  KEY `purchase_orders_created_by_foreign` (`created_by`),
  CONSTRAINT `purchase_orders_supplier_id_foreign`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  CONSTRAINT `purchase_orders_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. purchase_order_lines
--    Line items for each PO. total_cost is a STORED GENERATED column
--    (quantity × unit_cost) — requires MySQL 5.7.6+.
--    Depends on: purchase_orders
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_order_lines` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_order_id`   BIGINT UNSIGNED NOT NULL,
  `item_code`           VARCHAR(100)    NOT NULL,
  `item_name_en`        VARCHAR(200)    DEFAULT NULL,
  `item_name_bn`        VARCHAR(200)    DEFAULT NULL,
  `quantity`            DECIMAL(14,3)   NOT NULL,
  `unit_cost`           DECIMAL(14,2)   NOT NULL,
  `total_cost`          DECIMAL(14,2)   AS (`quantity` * `unit_cost`) STORED,
  `received_quantity`   DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `created_at`          TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`          TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_order_lines_purchase_order_id_foreign` (`purchase_order_id`),
  CONSTRAINT `purchase_order_lines_purchase_order_id_foreign`
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. inventory
--    One row per catalog item. Tracks current stock, weighted average cost,
--    and minimum reorder threshold.
--    Depends on: suppliers (nullable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `inventory` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_code`        VARCHAR(100)    NOT NULL,
  `item_name_en`     VARCHAR(200)    DEFAULT NULL,
  `item_name_bn`     VARCHAR(200)    DEFAULT NULL,
  `quantity_on_hand` DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `avg_unit_cost`    DECIMAL(14,4)   NOT NULL DEFAULT 0.0000,
  `min_threshold`    DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `supplier_id`      BIGINT UNSIGNED DEFAULT NULL,
  `created_at`       TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`       TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `inventory_item_code_unique` (`item_code`),
  KEY `inventory_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `inventory_supplier_id_foreign`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. stock_movements
--    Immutable ledger of every inventory change.
--    transaction_type values:
--      purchase_receipt  — items received from a PO
--      order_fulfillment — items deducted for a "From Stock" customer order
--      stock_return      — items returned to supplier
--      damaged_stock     — items written off as damaged
--      manual_adjustment — admin correction
--    Depends on: suppliers (nullable), users (nullable)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id`               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_code`        VARCHAR(100)    NOT NULL,
  `item_name_en`     VARCHAR(200)    DEFAULT NULL,
  `item_name_bn`     VARCHAR(200)    DEFAULT NULL,
  `transaction_type` ENUM(
                       'purchase_receipt',
                       'order_fulfillment',
                       'stock_return',
                       'damaged_stock',
                       'manual_adjustment'
                     ) NOT NULL,
  `quantity_in`      DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `quantity_out`     DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `balance_after`    DECIMAL(14,3)   NOT NULL DEFAULT 0.000,
  `unit_cost`        DECIMAL(14,4)   DEFAULT NULL,
  `reference_type`   VARCHAR(80)     DEFAULT NULL,
  `reference_id`     BIGINT UNSIGNED DEFAULT NULL,
  `reference_no`     VARCHAR(100)    DEFAULT NULL,
  `supplier_id`      BIGINT UNSIGNED DEFAULT NULL,
  `user_id`          BIGINT UNSIGNED DEFAULT NULL,
  `notes`            TEXT            DEFAULT NULL,
  `created_at`       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `stock_movements_item_code_index` (`item_code`),
  KEY `stock_movements_transaction_type_index` (`transaction_type`),
  KEY `stock_movements_supplier_id_foreign` (`supplier_id`),
  KEY `stock_movements_user_id_foreign` (`user_id`),
  CONSTRAINT `stock_movements_supplier_id_foreign`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `stock_movements_user_id_foreign`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. purchase_bills
--    Auto-generated payable bill when a PO is fully received.
--    Bill number format: BILL-YYYYMM-0001
--    Depends on: purchase_orders, suppliers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_bills` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `bill_no`             VARCHAR(60)     NOT NULL,
  `purchase_order_id`   BIGINT UNSIGNED NOT NULL,
  `supplier_id`         BIGINT UNSIGNED NOT NULL,
  `amount`              DECIMAL(14,2)   NOT NULL,
  `paid_amount`         DECIMAL(14,2)   NOT NULL DEFAULT 0.00,
  `status`              ENUM('pending','partially_paid','fully_paid')
                        NOT NULL DEFAULT 'pending',
  `due_date`            DATE            DEFAULT NULL,
  `created_at`          TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`          TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `purchase_bills_bill_no_unique` (`bill_no`),
  KEY `purchase_bills_status_index` (`status`),
  KEY `purchase_bills_purchase_order_id_foreign` (`purchase_order_id`),
  KEY `purchase_bills_supplier_id_foreign` (`supplier_id`),
  CONSTRAINT `purchase_bills_purchase_order_id_foreign`
    FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`),
  CONSTRAINT `purchase_bills_supplier_id_foreign`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. purchase_bill_payments
--    Individual payment records against a purchase bill.
--    Depends on: purchase_bills, users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_bill_payments` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_bill_id`    BIGINT UNSIGNED NOT NULL,
  `amount`              DECIMAL(14,2)   NOT NULL,
  `payment_date`        DATE            NOT NULL,
  `note`                TEXT            DEFAULT NULL,
  `created_by`          BIGINT UNSIGNED NOT NULL,
  `created_at`          TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`          TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `purchase_bill_payments_purchase_bill_id_foreign` (`purchase_bill_id`),
  KEY `purchase_bill_payments_created_by_foreign` (`created_by`),
  CONSTRAINT `purchase_bill_payments_purchase_bill_id_foreign`
    FOREIGN KEY (`purchase_bill_id`) REFERENCES `purchase_bills` (`id`)
    ON DELETE CASCADE,
  CONSTRAINT `purchase_bill_payments_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. stock_returns
--    Records items returned to a supplier (reduces inventory).
--    Depends on: suppliers (nullable), users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `stock_returns` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_code`     VARCHAR(100)    NOT NULL,
  `item_name_en`  VARCHAR(200)    DEFAULT NULL,
  `item_name_bn`  VARCHAR(200)    DEFAULT NULL,
  `quantity`      DECIMAL(14,3)   NOT NULL,
  `supplier_id`   BIGINT UNSIGNED DEFAULT NULL,
  `return_reason` TEXT            NOT NULL,
  `return_date`   DATE            NOT NULL,
  `created_by`    BIGINT UNSIGNED NOT NULL,
  `created_at`    TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`    TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `stock_returns_item_code_index` (`item_code`),
  KEY `stock_returns_supplier_id_foreign` (`supplier_id`),
  KEY `stock_returns_created_by_foreign` (`created_by`),
  CONSTRAINT `stock_returns_supplier_id_foreign`
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `stock_returns_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. damaged_stock
--    Records items written off due to damage (reduces inventory).
--    Depends on: users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `damaged_stock` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_code`     VARCHAR(100)    NOT NULL,
  `item_name_en`  VARCHAR(200)    DEFAULT NULL,
  `item_name_bn`  VARCHAR(200)    DEFAULT NULL,
  `quantity`      DECIMAL(14,3)   NOT NULL,
  `damage_reason` TEXT            NOT NULL,
  `damage_date`   DATE            NOT NULL,
  `notes`         TEXT            DEFAULT NULL,
  `created_by`    BIGINT UNSIGNED NOT NULL,
  `created_at`    TIMESTAMP       NULL DEFAULT NULL,
  `updated_at`    TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `damaged_stock_item_code_index` (`item_code`),
  KEY `damaged_stock_created_by_foreign` (`created_by`),
  CONSTRAINT `damaged_stock_created_by_foreign`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Re-enable foreign key checks
-- -----------------------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- Done. 9 tables created:
--   suppliers, purchase_orders, purchase_order_lines,
--   inventory, stock_movements,
--   purchase_bills, purchase_bill_payments,
--   stock_returns, damaged_stock
-- =============================================================================
