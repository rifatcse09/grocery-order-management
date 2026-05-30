/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;
DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `actor_user_id` bigint unsigned NOT NULL,
  `entity_type` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_id` bigint unsigned NOT NULL,
  `action` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `before_json` json DEFAULT NULL,
  `after_json` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_logs_actor_user_id_foreign` (`actor_user_id`),
  KEY `activity_logs_entity_type_index` (`entity_type`),
  KEY `activity_logs_entity_id_index` (`entity_id`),
  KEY `activity_logs_action_index` (`action`),
  CONSTRAINT `activity_logs_actor_user_id_foreign` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES
(1,2,'order',1,'challan_generated',NULL,'{\"orderNo\": \"ORD-20260503-9547\", \"challanGenerated\": true}',NULL,NULL),
(2,2,'invoice',1,'purchase_invoice_generated',NULL,'{\"orderId\": 1, \"orderNo\": \"ORD-20260503-9547\", \"invoiceId\": 1}',NULL,NULL),
(3,1,'order',1,'order_marked_delivered','{\"status\": \"processing\"}','{\"status\": \"completed\", \"orderNo\": \"ORD-20260503-9547\"}',NULL,NULL),
(4,1,'invoice',2,'billing_invoice_generated',NULL,'{\"orderId\": 1, \"orderNo\": \"ORD-20260503-9547\", \"invoiceId\": 2}',NULL,NULL);
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `adjustments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned DEFAULT NULL,
  `type` enum('purchase','billing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adjustments_order_id_foreign` (`order_id`),
  KEY `adjustments_created_by_foreign` (`created_by`),
  KEY `adjustments_type_index` (`type`),
  CONSTRAINT `adjustments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `adjustments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `adjustments` WRITE;
/*!40000 ALTER TABLE `adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `adjustments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `auth_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_tokens_token_hash_unique` (`token_hash`),
  KEY `auth_tokens_user_id_foreign` (`user_id`),
  CONSTRAINT `auth_tokens_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `auth_tokens` WRITE;
/*!40000 ALTER TABLE `auth_tokens` DISABLE KEYS */;
INSERT INTO `auth_tokens` VALUES
(1,1,'26c27ab5d995909ee4f26578c37bf68bfaab7a03a2360943cf66d96302270073',NULL,NULL),
(2,3,'3f6122fd93cad25ee787ecf0cadc4dc93a25b7d397f36724ae711ce44febae22',NULL,NULL),
(3,2,'6fee185b75a5920148835a8c8f480b291a3dfa41476d519e9a99e0b2420c8461',NULL,NULL),
(4,1,'0f3dba61ba8122ff7bd9d9ce29221a4ea148f0427804cca1bbc41d2965883f4a',NULL,NULL);
/*!40000 ALTER TABLE `auth_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `catalog_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `catalog_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `code` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_bn` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `catalog_items_code_unique` (`code`),
  KEY `catalog_items_category_id_foreign` (`category_id`),
  KEY `catalog_items_is_active_index` (`is_active`),
  CONSTRAINT `catalog_items_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `catalog_items` WRITE;
/*!40000 ALTER TABLE `catalog_items` DISABLE KEYS */;
INSERT INTO `catalog_items` VALUES
(1,1,'fresh-1','ক্যাপসিকাম','Capsicum',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(2,1,'fresh-2','ধনিয়া পাতা','Coriander leaves',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(3,1,'fresh-3','টমেটো','Tomato',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(4,1,'fresh-4','বেগুন','Eggplant',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(5,1,'fresh-5','ফুলকপি','Cauliflower',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(6,1,'fresh-6','বাঁধাকপি','Cabbage',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(7,2,'dry-1','আলু','Potato',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(8,2,'dry-2','পিয়াজ','Onion',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(9,2,'dry-3','আদা','Ginger',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(10,2,'dry-4','রসুন','Garlic',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(11,3,'meat-1','ডিম','Eggs',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(12,3,'meat-2','মুরগি','Chicken',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(13,3,'meat-3','মাছ','Fish',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(14,4,'pantry-1','চাউল','Rice',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(15,4,'pantry-2','ডাল','Lentils',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(16,4,'pantry-3','আটা','Flour',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(17,4,'pantry-4','চিনি','Sugar',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(18,4,'pantry-5','লবণ','Salt',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(19,4,'pantry-6','তেল','Oil',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(20,4,'pantry-7','গুঁড়া দুধ','Powdered milk',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(21,5,'spice-1','মরিচ গুঁড়া','Chili powder',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(22,5,'spice-2','হলুদ গুঁড়া','Turmeric powder',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(23,5,'spice-3','ধনিয়া গুঁড়া','Coriander powder',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(24,5,'spice-4','মুরগির মসলা','Chicken spice mix',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(25,5,'spice-5','বিফের মসলা','Beef spice mix',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(26,5,'spice-6','মাছের মসলা','Fish spice mix',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(27,5,'spice-7','পাঁচফোড়ন মসলা','Panch phoron spice',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(28,5,'spice-8','এলাচ','Cardamom',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(29,5,'spice-9','লবঙ্গ','Clove',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(30,5,'spice-10','দারুচিনি','Cinnamon',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(31,5,'spice-11','জিরা','Cumin',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(32,5,'spice-12','শুকনা মরিচ','Dried Red Chili',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(33,5,'spice-13','তেজপাতা','Bay leaf',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(34,6,'hh-1','ভিম সাবান','Vim dishwashing soap',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(35,6,'hh-2','ছোট হ্যান্ড সাবান','Small hand soap',1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(36,6,'hh-3','হ্যান্ড টাওয়েল টিস্যু','Hand towel tissue',1,'2026-05-03 06:53:34','2026-05-03 06:53:34');
/*!40000 ALTER TABLE `catalog_items` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_bn` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `markup_percent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_code_unique` (`code`),
  KEY `categories_is_active_index` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'fresh','তাজা শাকসবজি','Fresh Produce',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(2,'dry','শুকনো খাদ্য সামগ্রী','Dry Store',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(3,'meat','ডিম, মাংস ও মাছ','Egg, Meat & Poultry',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(4,'pantry','রান্নার উপকরণ (মসলা ছাড়া)','Pantry Goods (Non-spice)',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(5,'spice','মসলা ও স্বাদবর্ধক উপকরণ','Spices & Seasonings',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34'),
(6,'household','প্রয়োজনীয় সামগ্রী','Household Essentials',0.00,1,'2026-05-03 06:53:34','2026-05-03 06:53:34');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `challans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `challans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `generated_by` bigint unsigned DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `challans_order_id_foreign` (`order_id`),
  KEY `challans_generated_by_foreign` (`generated_by`),
  CONSTRAINT `challans_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `challans_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `challans` WRITE;
/*!40000 ALTER TABLE `challans` DISABLE KEYS */;
INSERT INTO `challans` VALUES
(1,1,2,'{\"id\": \"1\", \"lines\": [{\"id\": \"3\", \"kg\": \"1.000\", \"gram\": \"\", \"piece\": \"\", \"itemId\": \"dry-4\", \"serial\": 1, \"lineTotal\": null, \"unitPrice\": null, \"categoryId\": \"dry\", \"itemNameBn\": \"রসুন\", \"itemNameEn\": \"Garlic\", \"instructions\": \"\", \"markupAmount\": 0, \"markupPercent\": 0, \"profitLossAmount\": 0, \"lineTotalAfterMarkup\": null, \"unitPriceAfterMarkup\": null}], \"phone\": \"+8801711000000\", \"status\": \"submitted\", \"orderNo\": \"ORD-20260503-9547\", \"ownerId\": \"3\", \"orderDate\": \"2026-05-03\", \"grandTotal\": null, \"submittedAt\": null, \"deliveryDate\": \"2026-05-08\", \"deliveryTime\": \"2026-05-08T13:09\", \"contactPerson\": \"Rafi Ahmed\", \"markupPercent\": null, \"billingAddress\": \"Dhanmondi, Dhaka-1209\", \"billingSubtotal\": null, \"deliveryAddress\": \"Gulshan-2, Dhaka-1212\", \"challanGenerated\": false, \"purchaseSubtotal\": null, \"signatureDataUrl\": \"http://localhost:8000/uploads/signatures/20260503071006-1edfbed2fff0.png\", \"billingCategoryMarkups\": null, \"billingInvoiceGenerated\": false, \"purchaseInvoiceGenerated\": false, \"purchaseInvoiceGeneratedBy\": null}',NULL,NULL);
/*!40000 ALTER TABLE `challans` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `type` enum('purchase','billing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_no` int unsigned NOT NULL DEFAULT '1',
  `generated_by` bigint unsigned DEFAULT NULL,
  `subtotal` decimal(14,2) NOT NULL DEFAULT '0.00',
  `grand_total` decimal(14,2) NOT NULL DEFAULT '0.00',
  `markup_percent` decimal(8,2) DEFAULT NULL,
  `snapshot` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoices_order_id_foreign` (`order_id`),
  KEY `invoices_generated_by_foreign` (`generated_by`),
  KEY `invoices_type_index` (`type`),
  CONSTRAINT `invoices_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
INSERT INTO `invoices` VALUES
(1,1,'purchase',1,2,122.00,122.00,NULL,'{\"lines\": [{\"id\": \"4\", \"kg\": \"1.000\", \"gram\": \"\", \"piece\": \"\", \"itemId\": \"dry-4\", \"serial\": 1, \"categoryId\": \"dry\", \"itemNameBn\": \"রসুন\", \"itemNameEn\": \"Garlic\", \"markupAmount\": 0, \"markupPercent\": 0, \"profitLossAmount\": 0, \"lineTotalAfterMarkup\": 122, \"unitPriceAfterMarkup\": 122, \"lineTotalBeforeMarkup\": 122, \"unitPriceBeforeMarkup\": 122}], \"markupMode\": \"none\", \"markupPercent\": 0, \"billingSubtotal\": 122, \"profitLossTotal\": 0, \"purchaseSubtotal\": 122}',NULL,NULL),
(2,1,'billing',1,1,128.10,128.10,NULL,'{\"lines\": [{\"id\": \"4\", \"kg\": \"1.000\", \"gram\": \"\", \"piece\": \"\", \"itemId\": \"dry-4\", \"serial\": 1, \"categoryId\": \"dry\", \"itemNameBn\": \"রসুন\", \"itemNameEn\": \"Garlic\", \"markupAmount\": 6.1, \"markupPercent\": 5, \"profitLossAmount\": 6.1, \"lineTotalAfterMarkup\": 128.1, \"unitPriceAfterMarkup\": 128.1, \"lineTotalBeforeMarkup\": 122, \"unitPriceBeforeMarkup\": 122}], \"markupMode\": \"category_wise\", \"markupPercent\": 0, \"billingSubtotal\": 128.1, \"profitLossTotal\": 6.1, \"markupByCategory\": {\"dry\": 5, \"meat\": 6, \"fresh\": 7, \"spice\": 9, \"pantry\": 7, \"household\": 7}, \"purchaseSubtotal\": 122}',NULL,NULL);
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `item_price_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_price_histories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `catalog_item_id` bigint unsigned NOT NULL,
  `order_id` bigint unsigned DEFAULT NULL,
  `item_code` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_price` decimal(12,2) DEFAULT NULL,
  `new_price` decimal(12,2) NOT NULL,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `line_total` decimal(12,2) DEFAULT NULL,
  `changed_by` bigint unsigned DEFAULT NULL,
  `effective_from` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_price_histories_order_item_unique` (`order_id`,`item_code`),
  KEY `item_price_histories_catalog_item_id_foreign` (`catalog_item_id`),
  KEY `item_price_histories_changed_by_foreign` (`changed_by`),
  KEY `item_price_histories_item_code_index` (`item_code`),
  CONSTRAINT `item_price_histories_catalog_item_id_foreign` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `item_price_histories_changed_by_foreign` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `item_price_histories_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `item_price_histories` WRITE;
/*!40000 ALTER TABLE `item_price_histories` DISABLE KEYS */;
INSERT INTO `item_price_histories` VALUES
(1,10,1,'dry-4',NULL,122.00,122.00,122.00,2,'2026-05-03 07:10:36','2026-05-03 07:10:36','2026-05-03 07:10:36');
/*!40000 ALTER TABLE `item_price_histories` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `ledger_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledger_entries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned DEFAULT NULL,
  `entry_type` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `direction` enum('debit','credit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(14,2) NOT NULL,
  `ref_type` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_id` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ledger_entries_order_id_foreign` (`order_id`),
  KEY `ledger_entries_entry_type_index` (`entry_type`),
  CONSTRAINT `ledger_entries_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `ledger_entries` WRITE;
/*!40000 ALTER TABLE `ledger_entries` DISABLE KEYS */;
INSERT INTO `ledger_entries` VALUES
(1,1,'purchase_invoice','credit',122.00,'invoice',1,NULL,'2026-05-03 07:10:36','2026-05-03 07:10:36'),
(2,1,'billing_invoice','debit',128.10,'invoice',2,NULL,'2026-05-03 07:11:03','2026-05-03 07:11:03'),
(3,1,'purchase_payment','debit',22.00,'payment',1,NULL,'2026-05-03 07:11:12','2026-05-03 07:11:12'),
(4,1,'purchase_payment','debit',100.00,'payment',2,NULL,'2026-05-03 07:11:17','2026-05-03 07:11:17');
/*!40000 ALTER TABLE `ledger_entries` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES
(1,'0001_01_01_000000_create_users_table',1),
(2,'0001_01_01_000001_create_cache_table',1),
(3,'0001_01_01_000002_create_jobs_table',1),
(4,'2026_04_29_131006_create_personal_access_tokens_table',1),
(5,'2026_04_29_131047_create_orders_table',1),
(6,'2026_04_29_131943_create_order_lines_table',1),
(7,'2026_04_29_131945_create_notifications_table',1),
(8,'2026_04_29_131946_create_invoices_table',1),
(9,'2026_04_29_131947_create_statement_cycles_table',1),
(10,'2026_04_29_131948_create_ledger_entries_table',1),
(11,'2026_04_29_131950_create_adjustments_table',1),
(12,'2026_04_29_131951_create_challans_table',1),
(13,'2026_04_29_131952_create_categories_table',1),
(14,'2026_04_29_131953_create_catalog_items_table',1),
(15,'2026_04_29_131954_create_item_price_histories_table',1),
(16,'2026_04_29_145500_create_auth_tokens_table',1),
(17,'2026_04_29_151500_add_signature_data_url_to_orders_table',1),
(18,'2026_04_30_001700_add_markup_profit_columns_to_order_lines_table',1),
(19,'2026_04_30_002200_extend_item_price_histories_for_order_tracking',1),
(20,'2026_05_01_121700_create_activity_logs_table',1),
(21,'2026_05_01_221800_create_payments_table',1),
(22,'2026_05_01_225500_add_payment_type_to_payments_table',1),
(23,'2026_05_03_000001_backfill_payment_type_on_payments',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `type` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(190) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_foreign` (`user_id`),
  KEY `notifications_type_index` (`type`),
  KEY `notifications_is_read_index` (`is_read`),
  CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `order_lines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_lines` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned NOT NULL,
  `serial` int unsigned NOT NULL DEFAULT '1',
  `category_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_code` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `item_name_bn` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_name_en` varchar(180) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kg` decimal(10,3) NOT NULL DEFAULT '0.000',
  `gram` decimal(10,3) NOT NULL DEFAULT '0.000',
  `piece` decimal(10,3) NOT NULL DEFAULT '0.000',
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `unit_price` decimal(12,2) DEFAULT NULL,
  `line_total` decimal(12,2) DEFAULT NULL,
  `markup_percent` decimal(8,2) NOT NULL DEFAULT '0.00',
  `markup_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit_price_after_markup` decimal(12,2) DEFAULT NULL,
  `line_total_after_markup` decimal(12,2) DEFAULT NULL,
  `profit_loss_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_lines_order_id_foreign` (`order_id`),
  KEY `order_lines_category_code_index` (`category_code`),
  KEY `order_lines_item_code_index` (`item_code`),
  CONSTRAINT `order_lines_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `order_lines` WRITE;
/*!40000 ALTER TABLE `order_lines` DISABLE KEYS */;
INSERT INTO `order_lines` VALUES
(4,1,1,'dry','dry-4','রসুন','Garlic',1.000,0.000,0.000,'',122.00,122.00,5.00,6.10,128.10,128.10,6.10,'2026-05-03 07:10:36','2026-05-03 07:11:03');
/*!40000 ALTER TABLE `order_lines` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned NOT NULL,
  `order_no` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_date` date NOT NULL,
  `delivery_datetime` datetime NOT NULL,
  `delivery_time_window` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `billing_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `signature_data_url` longtext COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_delayed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_order_no_unique` (`order_no`),
  KEY `orders_owner_id_foreign` (`owner_id`),
  KEY `orders_status_index` (`status`),
  KEY `orders_is_active_index` (`is_active`),
  KEY `orders_is_delayed_index` (`is_delayed`),
  CONSTRAINT `orders_owner_id_foreign` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(1,3,'ORD-20260503-9547','2026-05-03','2026-05-08 13:09:00','2026-05-08T13:09','invoiced','Dhanmondi, Dhaka-1209','Gulshan-2, Dhaka-1212','Rafi Ahmed','+8801711000000','http://localhost:8000/uploads/signatures/20260503071006-1edfbed2fff0.png',NULL,1,0,NULL,'2026-05-03 07:11:03');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint unsigned DEFAULT NULL,
  `invoice_id` bigint unsigned DEFAULT NULL,
  `payment_type` enum('purchase','billing') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(14,2) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_order_id_foreign` (`order_id`),
  KEY `payments_invoice_id_foreign` (`invoice_id`),
  KEY `payments_created_by_foreign` (`created_by`),
  KEY `payments_payment_type_index` (`payment_type`),
  CONSTRAINT `payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_order_id_foreign` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES
(1,1,NULL,'purchase',22.00,'Purchase statement payment (Rafi Ahmed)',1,NULL,NULL,NULL),
(2,1,NULL,'purchase',100.00,'Purchase statement payment (Rafi Ahmed)',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `personal_access_tokens` WRITE;
/*!40000 ALTER TABLE `personal_access_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `personal_access_tokens` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `statement_cycles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `statement_cycles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` enum('purchase','billing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_start` date NOT NULL,
  `cycle_end` date NOT NULL,
  `generated_by` bigint unsigned DEFAULT NULL,
  `meta` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `statement_cycles_generated_by_foreign` (`generated_by`),
  KEY `statement_cycles_type_index` (`type`),
  CONSTRAINT `statement_cycles_generated_by_foreign` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `statement_cycles` WRITE;
/*!40000 ALTER TABLE `statement_cycles` DISABLE KEYS */;
/*!40000 ALTER TABLE `statement_cycles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `billing_address` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `delivery_address` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'Demo Admin','admin@demo.local','+8801911000000','admin','Dhaka','Dhaka',1,NULL,'$2y$12$TjGERdk4J18GKPLy.hukx.7s1ca0HkcqaCrsiAnDMiaJ9EFE7HytK',NULL,'2026-05-03 06:53:34','2026-05-03 07:00:08'),
(2,'Demo Moderator','moderator@demo.local','+8801811000000','moderator','Dhaka','Dhaka',1,NULL,'$2y$12$91deN207dlOlfoLh.aP4/eUNGpjul0yNMZ2sj.QSgI/c6iAvdtFnG',NULL,'2026-05-03 06:53:34','2026-05-03 07:00:09'),
(3,'Rafi Ahmed','user@demo.local','+8801711000000','user','Dhanmondi, Dhaka-1209','Gulshan-2, Dhaka-1212',1,NULL,'$2y$12$tcZTcCvPvnk3unQyP75T6O5Sfjn0dxIvA1rJvVpklWtWqFWV/VSS2',NULL,'2026-05-03 06:53:34','2026-05-03 07:00:09');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

