<?php

declare(strict_types=1);

/**
 * All /api/v1 route branches served from public/index.php (procedural router).
 */
function api_gateway_dispatch_routes(string $method, string $path): void
{

if ($path === '/api/v1/auth/login' && $method === 'POST') {
    $in = json_input();
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $password = (string)($in['password'] ?? '');
    if ($email === '' || $password === '') {
        json_response(422, ['message' => 'Email and password are required.']);
    }
    $stmt = db()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    $storedHash = $user ? (string)($user['password_hash'] ?? $user['password'] ?? '') : '';
    if (!$user || $storedHash === '' || !password_verify($password, $storedHash)) {
        json_response(401, ['message' => 'Invalid credentials.']);
    }
    $token = make_token((int)$user['id']);
    json_response(200, ['token' => $token, 'user' => public_user($user)]);
}

if ($path === '/api/v1/auth/register' && $method === 'POST') {
    $in = json_input();
    $name = trim((string)($in['name'] ?? ''));
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $password = (string)($in['password'] ?? '');
    if ($name === '' || $email === '' || strlen($password) < 6) {
        json_response(422, ['message' => 'Name, email and password (6+) are required.']);
    }
    $stmt = db()->prepare('SELECT 1 FROM users WHERE email = :email');
    $stmt->execute(['email' => $email]);
    if ($stmt->fetch()) {
        json_response(409, ['message' => 'Email already exists.']);
    }
    $passCol = users_password_column();
    $insert = db()->prepare("INSERT INTO users (name, email, {$passCol}, phone, role, billing_address, delivery_address) VALUES (:name, :email, :ph, :phone, :role, :billing, :delivery)");
    $insert->execute([
        'name' => $name,
        'email' => $email,
        'ph' => password_hash($password, PASSWORD_BCRYPT),
        'phone' => trim((string)($in['phone'] ?? '')),
        'role' => 'user',
        'billing' => trim((string)($in['billingAddress'] ?? '')),
        'delivery' => trim((string)($in['deliveryAddress'] ?? '')),
    ]);
    $uid = (int)db()->lastInsertId();
    $sel = db()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $sel->execute(['id' => $uid]);
    $user = $sel->fetch();
    if (!$user) {
        json_response(500, ['message' => 'User was not created.']);
    }
    $token = make_token((int)$user['id']);
    json_response(201, ['token' => $token, 'user' => public_user($user)]);
}

if ($path === '/api/v1/auth/logout' && $method === 'POST') {
    $token = bearer_token();
    if ($token) {
        $stmt = db()->prepare('DELETE FROM auth_tokens WHERE token_hash = :h');
        $stmt->execute(['h' => hash('sha256', $token)]);
    }
    json_response(200, ['ok' => true]);
}

if ($path === '/api/v1/auth/me' && $method === 'GET') {
    $user = require_auth();
    json_response(200, ['user' => public_user($user)]);
}

if ($path === '/api/v1/auth/profile' && $method === 'PUT') {
    $user = require_auth();
    $in = json_input();
    $name = trim((string)($in['name'] ?? ''));
    if ($name === '') {
        json_response(422, ['message' => 'Name is required.']);
    }
    $stmt = db()->prepare('UPDATE users SET name = :name, phone = :phone, billing_address = :billing, delivery_address = :delivery, updated_at = NOW() WHERE id = :id');
    $stmt->execute([
        'id' => $user['id'],
        'name' => $name,
        'phone' => trim((string)($in['phone'] ?? '')),
        'billing' => trim((string)($in['billingAddress'] ?? '')),
        'delivery' => trim((string)($in['deliveryAddress'] ?? '')),
    ]);
    $sel = db()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $sel->execute(['id' => $user['id']]);
    $updated = $sel->fetch();
    json_response(200, ['user' => public_user($updated)]);
}

if ($path === '/api/v1/catalog/items' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'user', 'moderator']);
    $query = strtolower(trim((string)($_GET['query'] ?? '')));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 10)));
    $offset = ($page - 1) * $perPage;
    $like = '%' . $query . '%';

    $count = db()->prepare('
        SELECT COUNT(*) AS total
        FROM catalog_items ci
        JOIN categories c ON c.id = ci.category_id
        WHERE ci.is_active = true
          AND c.is_active = true
          AND (
            :q = \'\'
            OR LOWER(ci.name_en) LIKE :like
            OR LOWER(ci.name_bn) LIKE :like
            OR LOWER(c.name_en) LIKE :like
            OR LOWER(c.name_bn) LIKE :like
          )
    ');
    $count->execute(['q' => $query, 'like' => $like]);
    $total = (int)(($count->fetch()['total'] ?? 0));

    $rowsStmt = db()->prepare('
        SELECT ci.code AS item_code, ci.name_bn AS item_name_bn, ci.name_en AS item_name_en, c.code AS category_code, c.name_bn AS category_name_bn, c.name_en AS category_name_en
        FROM catalog_items ci
        JOIN categories c ON c.id = ci.category_id
        WHERE ci.is_active = true
          AND c.is_active = true
          AND (
            :q = \'\'
            OR LOWER(ci.name_en) LIKE :like
            OR LOWER(ci.name_bn) LIKE :like
            OR LOWER(c.name_en) LIKE :like
            OR LOWER(c.name_bn) LIKE :like
          )
        ORDER BY ci.name_en ASC
        LIMIT :limit OFFSET :offset
    ');
    $rowsStmt->bindValue(':q', $query, PDO::PARAM_STR);
    $rowsStmt->bindValue(':like', $like, PDO::PARAM_STR);
    $rowsStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $rowsStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $rowsStmt->execute();
    $rows = $rowsStmt->fetchAll();

    $data = array_map(static fn(array $r): array => [
        'id' => (string)$r['item_code'],
        'categoryId' => (string)$r['category_code'],
        'nameBn' => (string)$r['item_name_bn'],
        'nameEn' => (string)$r['item_name_en'],
        'categoryNameBn' => (string)$r['category_name_bn'],
        'categoryNameEn' => (string)$r['category_name_en'],
    ], $rows);

    json_response(200, [
        'data' => $data,
        'meta' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
        ],
    ]);
}

if ($path === '/api/v1/catalog/categories' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'user', 'moderator']);
    $query = strtolower(trim((string)($_GET['query'] ?? '')));
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(1, min(100, (int)($_GET['perPage'] ?? 10)));
    $offset = ($page - 1) * $perPage;
    $like = '%' . $query . '%';

    $countStmt = db()->prepare('
        SELECT COUNT(*) AS total
        FROM categories c
        WHERE c.is_active = true
          AND (
            :q = \'\'
            OR LOWER(c.name_en) LIKE :like
            OR LOWER(c.name_bn) LIKE :like
          )
    ');
    $countStmt->execute(['q' => $query, 'like' => $like]);
    $total = (int)(($countStmt->fetch()['total'] ?? 0));

    $rowsStmt = db()->prepare('
        SELECT c.code, c.name_bn, c.name_en, COALESCE(COUNT(ci.id), 0) AS items_count
        FROM categories c
        LEFT JOIN catalog_items ci ON ci.category_id = c.id AND ci.is_active = true
        WHERE c.is_active = true
          AND (
            :q = \'\'
            OR LOWER(c.name_en) LIKE :like
            OR LOWER(c.name_bn) LIKE :like
          )
        GROUP BY c.id, c.code, c.name_bn, c.name_en
        ORDER BY c.name_en ASC
        LIMIT :limit OFFSET :offset
    ');
    $rowsStmt->bindValue(':q', $query, PDO::PARAM_STR);
    $rowsStmt->bindValue(':like', $like, PDO::PARAM_STR);
    $rowsStmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $rowsStmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $rowsStmt->execute();
    $rows = $rowsStmt->fetchAll();

    $data = array_map(static fn(array $r): array => [
        'id' => (string)$r['code'],
        'nameBn' => (string)$r['name_bn'],
        'nameEn' => (string)$r['name_en'],
        'itemsCount' => (int)$r['items_count'],
    ], $rows);

    json_response(200, [
        'data' => $data,
        'meta' => [
            'page' => $page,
            'perPage' => $perPage,
            'total' => $total,
        ],
    ]);
}

if ($path === '/api/v1/catalog/categories' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    $in = json_input();
    $nameBn = trim((string)($in['nameBn'] ?? ''));
    $nameEn = trim((string)($in['nameEn'] ?? ''));
    if ($nameBn === '' || $nameEn === '') {
        json_response(422, ['message' => 'Category Bangla and English names are required.']);
    }
    $code = 'custom-cat-' . time() . '-' . random_int(100, 999);
    $stmt = db()->prepare('INSERT INTO categories (code, name_bn, name_en, markup_percent, is_active, created_at, updated_at) VALUES (:code, :bn, :en, 0, true, NOW(), NOW())');
    $stmt->execute(['code' => $code, 'bn' => $nameBn, 'en' => $nameEn]);
    $sel = db()->prepare('SELECT code, name_bn, name_en FROM categories WHERE code = :code LIMIT 1');
    $sel->execute(['code' => $code]);
    $row = $sel->fetch();
    json_response(201, ['data' => [
        'id' => (string)$row['code'],
        'nameBn' => (string)$row['name_bn'],
        'nameEn' => (string)$row['name_en'],
        'markupPercent' => 0,
        'items' => [],
    ]]);
}

if (preg_match('#^/api/v1/catalog/categories/([^/]+)$#', $path, $m) === 1 && $method === 'PUT') {
    $user = require_auth();
    require_role($user, ['admin']);
    $categoryCode = urldecode($m[1]);
    $in = json_input();
    $nameBn = trim((string)($in['nameBn'] ?? ''));
    $nameEn = trim((string)($in['nameEn'] ?? ''));
    if ($nameBn === '' || $nameEn === '') {
        json_response(422, ['message' => 'Category Bangla and English names are required.']);
    }
    $stmt = db()->prepare('UPDATE categories SET name_bn = :bn, name_en = :en, updated_at = NOW() WHERE code = :code AND is_active = true');
    $stmt->execute(['bn' => $nameBn, 'en' => $nameEn, 'code' => $categoryCode]);
    $sel = db()->prepare('SELECT code, name_bn, name_en, markup_percent FROM categories WHERE code = :code LIMIT 1');
    $sel->execute(['code' => $categoryCode]);
    $row = $sel->fetch();
    if (!$row) json_response(404, ['message' => 'Category not found']);
    json_response(200, ['data' => [
        'id' => (string)$row['code'],
        'nameBn' => (string)$row['name_bn'],
        'nameEn' => (string)$row['name_en'],
        'markupPercent' => (float)$row['markup_percent'],
        'items' => [],
    ]]);
}

if (preg_match('#^/api/v1/catalog/categories/([^/]+)$#', $path, $m) === 1 && $method === 'DELETE') {
    $user = require_auth();
    require_role($user, ['admin']);
    $categoryCode = urldecode($m[1]);
    $usedStmt = db()->prepare('SELECT 1 FROM order_lines WHERE category_code = :code LIMIT 1');
    $usedStmt->execute(['code' => $categoryCode]);
    if ($usedStmt->fetch()) {
        json_response(409, ['message' => 'Category is used in orders and cannot be deleted.']);
    }
    $stmt = db()->prepare('DELETE FROM categories WHERE code = :code');
    $stmt->execute(['code' => $categoryCode]);
    if ($stmt->rowCount() === 0) json_response(404, ['message' => 'Category not found']);
    json_response(200, ['ok' => true]);
}

if ($path === '/api/v1/catalog/items' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    $in = json_input();
    $categoryCode = trim((string)($in['categoryId'] ?? ''));
    $nameBn = trim((string)($in['nameBn'] ?? ''));
    $nameEn = trim((string)($in['nameEn'] ?? ''));
    if ($categoryCode === '' || $nameBn === '' || $nameEn === '') {
        json_response(422, ['message' => 'Category and item names are required.']);
    }
    $catStmt = db()->prepare('SELECT id, code FROM categories WHERE code = :code AND is_active = true LIMIT 1');
    $catStmt->execute(['code' => $categoryCode]);
    $cat = $catStmt->fetch();
    if (!$cat) json_response(404, ['message' => 'Category not found']);
    $code = 'custom-' . $categoryCode . '-' . time() . '-' . random_int(100, 999);
    $stmt = db()->prepare('INSERT INTO catalog_items (category_id, code, name_bn, name_en, is_active, created_at, updated_at) VALUES (:cid, :code, :bn, :en, true, NOW(), NOW())');
    $stmt->execute(['cid' => $cat['id'], 'code' => $code, 'bn' => $nameBn, 'en' => $nameEn]);
    $sel = db()->prepare('SELECT code, name_bn, name_en FROM catalog_items WHERE code = :code LIMIT 1');
    $sel->execute(['code' => $code]);
    $row = $sel->fetch();
    json_response(201, ['data' => [
        'id' => (string)$row['code'],
        'categoryId' => $categoryCode,
        'nameBn' => (string)$row['name_bn'],
        'nameEn' => (string)$row['name_en'],
    ]]);
}

if (preg_match('#^/api/v1/catalog/items/([^/]+)$#', $path, $m) === 1 && $method === 'PUT') {
    $user = require_auth();
    require_role($user, ['admin']);
    $itemCode = urldecode($m[1]);
    $in = json_input();
    $nameBn = trim((string)($in['nameBn'] ?? ''));
    $nameEn = trim((string)($in['nameEn'] ?? ''));
    if ($nameBn === '' || $nameEn === '') {
        json_response(422, ['message' => 'Item Bangla and English names are required.']);
    }
    $stmt = db()->prepare('UPDATE catalog_items SET name_bn = :bn, name_en = :en, updated_at = NOW() WHERE code = :code AND is_active = true');
    $stmt->execute(['bn' => $nameBn, 'en' => $nameEn, 'code' => $itemCode]);
    $sel = db()->prepare('SELECT code, name_bn, name_en, category_id FROM catalog_items WHERE code = :code LIMIT 1');
    $sel->execute(['code' => $itemCode]);
    $row = $sel->fetch();
    if (!$row) json_response(404, ['message' => 'Item not found']);
    $catStmt = db()->prepare('SELECT code FROM categories WHERE id = :id LIMIT 1');
    $catStmt->execute(['id' => $row['category_id']]);
    $cat = $catStmt->fetch();
    json_response(200, ['data' => [
        'id' => (string)$row['code'],
        'categoryId' => (string)($cat['code'] ?? ''),
        'nameBn' => (string)$row['name_bn'],
        'nameEn' => (string)$row['name_en'],
    ]]);
}

if (preg_match('#^/api/v1/catalog/items/([^/]+)$#', $path, $m) === 1 && $method === 'DELETE') {
    $user = require_auth();
    require_role($user, ['admin']);
    $itemCode = urldecode($m[1]);
    $usedStmt = db()->prepare('SELECT 1 FROM order_lines WHERE item_code = :code LIMIT 1');
    $usedStmt->execute(['code' => $itemCode]);
    if ($usedStmt->fetch()) {
        json_response(409, ['message' => 'Item is used in orders and cannot be deleted.']);
    }
    $stmt = db()->prepare('DELETE FROM catalog_items WHERE code = :code');
    $stmt->execute(['code' => $itemCode]);
    if ($stmt->rowCount() === 0) json_response(404, ['message' => 'Item not found']);
    json_response(200, ['ok' => true]);
}

if ($path === '/api/v1/admin/users' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin']);
    $rows = db()->query('SELECT * FROM users ORDER BY id DESC')->fetchAll();
    json_response(200, ['data' => array_map('public_user', $rows)]);
}

if ($path === '/api/v1/admin/users' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $name = trim((string)($in['name'] ?? ''));
    $email = strtolower(trim((string)($in['email'] ?? '')));
    $password = (string)($in['password'] ?? '');
    $role = (string)($in['role'] ?? 'user');
    if (!in_array($role, ['user', 'moderator', 'admin'], true)) {
        json_response(422, ['message' => 'Invalid role']);
    }
    if ($name === '' || $email === '' || strlen($password) < 6) {
        json_response(422, ['message' => 'Name, email and password (6+) are required.']);
    }
    $exists = db()->prepare('SELECT 1 FROM users WHERE email = :email LIMIT 1');
    $exists->execute(['email' => $email]);
    if ($exists->fetch()) {
        json_response(409, ['message' => 'Email already exists.']);
    }
    $passCol = users_password_column();
    $insert = db()->prepare("INSERT INTO users (name, email, {$passCol}, phone, role, billing_address, delivery_address) VALUES (:name, :email, :ph, :phone, :role, :billing, :delivery)");
    $insert->execute([
        'name' => $name,
        'email' => $email,
        'ph' => password_hash($password, PASSWORD_BCRYPT),
        'phone' => trim((string)($in['phone'] ?? '')),
        'role' => $role,
        'billing' => trim((string)($in['billingAddress'] ?? '')),
        'delivery' => trim((string)($in['deliveryAddress'] ?? '')),
    ]);
    $uid = (int)db()->lastInsertId();
    $sel = db()->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $sel->execute(['id' => $uid]);
    $created = $sel->fetch();
    if (!$created) {
        json_response(500, ['message' => 'User was not created.']);
    }
    json_response(201, ['data' => public_user($created)]);
}

if ($path === '/api/v1/orders' && $method === 'GET') {
    $user = require_auth();
    if ($user['role'] === 'user') {
        $stmt = db()->prepare('SELECT * FROM orders WHERE owner_id = :uid AND is_active = true ORDER BY id DESC');
        $stmt->execute(['uid' => $user['id']]);
    } else {
        $stmt = db()->query('SELECT * FROM orders WHERE is_active = true ORDER BY id DESC');
    }
    $rows = $stmt->fetchAll();
    json_response(200, ['data' => array_map('read_order', $rows)]);
}

if ($path === '/api/v1/orders' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['user']);
    $in = json_input();
    $deliveryDate = (string)($in['deliveryDate'] ?? date('Y-m-d'));
    [$startDate, $startTime, $window] = delivery_start_parts($deliveryDate, (string)($in['deliveryTime'] ?? ''));
    $deliveryTs = date('c', strtotime($startDate . ' ' . $startTime));
    $orderNo = 'ORD-' . date('Ymd') . '-' . random_int(1000, 9999);

    $signature = array_key_exists('signatureDataUrl', $in) ? persist_signature($in['signatureDataUrl']) : null;
    $q = db()->prepare('INSERT INTO orders (owner_id, order_no, order_date, delivery_datetime, delivery_time_window, status, billing_address, delivery_address, contact_person, phone, signature_data_url) VALUES (:owner, :order_no, :order_date, :delivery, :delivery_window, :status, :billing, :delivery_addr, :contact, :phone, :signature)');
    $q->execute([
        'owner' => $user['id'],
        'order_no' => $orderNo,
        'order_date' => (string)($in['orderDate'] ?? date('Y-m-d')),
        'delivery' => $deliveryTs,
        'delivery_window' => $window,
        'status' => (string)($in['status'] ?? 'draft'),
        'billing' => (string)($in['billingAddress'] ?? ''),
        'delivery_addr' => (string)($in['deliveryAddress'] ?? ''),
        'contact' => (string)($in['contactPerson'] ?? $user['name']),
        'phone' => (string)($in['phone'] ?? $user['phone']),
        'signature' => $signature,
    ]);
    $newOrderId = (int)db()->lastInsertId();
    replace_order_lines($newOrderId, is_array($in['lines'] ?? null) ? $in['lines'] : [], $user);
    $getCreated = db()->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
    $getCreated->execute(['id' => $newOrderId]);
    $order = $getCreated->fetch();
    if (!$order) {
        json_response(500, ['message' => 'Order was not created.']);
    }
    json_response(201, ['data' => read_order($order)]);
}

if (preg_match('#^/api/v1/orders/(\d+)$#', $path, $m) === 1 && $method === 'PUT') {
    $user = require_auth();
    $orderId = (int)$m[1];
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id AND is_active = true LIMIT 1');
    $get->execute(['id' => $orderId]);
    $order = $get->fetch();
    if (!$order) {
        json_response(404, ['message' => 'Order not found']);
    }
    if ($user['role'] === 'user' && (int)$order['owner_id'] !== (int)$user['id']) {
        json_response(403, ['message' => 'Forbidden']);
    }
    $editWindowHours = (int)envv('EDIT_WINDOW_HOURS', '24');
    $hoursLeft = (strtotime((string)$order['delivery_datetime']) - time()) / 3600;
    if ($user['role'] === 'user' && $hoursLeft < $editWindowHours) {
        json_response(422, ['message' => 'Cannot edit order within edit lock window.']);
    }
    $in = json_input();
    $deliveryDate = (string)($in['deliveryDate'] ?? substr((string)$order['delivery_datetime'], 0, 10));
    [$startDate, $startTime, $window] = delivery_start_parts($deliveryDate, (string)($in['deliveryTime'] ?? ($order['delivery_time_window'] ?? '')));
    $deliveryTs = date('c', strtotime($startDate . ' ' . $startTime));
    $signature = array_key_exists('signatureDataUrl', $in)
        ? persist_signature($in['signatureDataUrl'])
        : ($order['signature_data_url'] ?? null);
    $upd = db()->prepare('UPDATE orders SET order_date = :order_date, delivery_datetime = :delivery_dt, delivery_time_window = :delivery_window, status = :status, billing_address = :billing, delivery_address = :delivery, contact_person = :contact, phone = :phone, signature_data_url = :signature, updated_at = NOW() WHERE id = :id');
    $upd->execute([
        'id' => $orderId,
        'order_date' => (string)($in['orderDate'] ?? $order['order_date']),
        'delivery_dt' => $deliveryTs,
        'delivery_window' => $window,
        'status' => (string)($in['status'] ?? $order['status']),
        'billing' => (string)($in['billingAddress'] ?? $order['billing_address']),
        'delivery' => (string)($in['deliveryAddress'] ?? $order['delivery_address']),
        'contact' => (string)($in['contactPerson'] ?? $order['contact_person']),
        'phone' => (string)($in['phone'] ?? $order['phone']),
        'signature' => $signature,
    ]);
    if (array_key_exists('lines', $in) && is_array($in['lines']) && count($in['lines']) > 0) {
        replace_order_lines($orderId, $in['lines'], $user);
    }
    $get->execute(['id' => $orderId]);
    $after = $get->fetch();
    if (
        $after
        && in_array((string)($user['role'] ?? ''), ['admin', 'moderator'], true)
        && (string)$after['status'] !== 'invoiced'
        && order_has_invoice_type($orderId, 'purchase')
        && array_key_exists('lines', $in) && is_array($in['lines']) && count($in['lines']) > 0
    ) {
        sync_latest_purchase_invoice_from_order_lines($orderId);
    }
    $get->execute(['id' => $orderId]);
    $final = $get->fetch();
    if (!$final) {
        json_response(404, ['message' => 'Order not found']);
    }
    json_response(200, ['data' => read_order($final)]);
}

if (preg_match('#^/api/v1/orders/(\d+)$#', $path, $m) === 1 && $method === 'DELETE') {
    $user = require_auth();
    require_role($user, ['user']);
    $orderId = (int)$m[1];
    $stmt = db()->prepare('UPDATE orders SET is_active = false, updated_at = NOW() WHERE id = :id AND owner_id = :uid AND status = :status');
    $stmt->execute([
        'id' => $orderId,
        'uid' => $user['id'],
        'status' => 'draft',
    ]);
    if ($stmt->rowCount() === 0) {
        json_response(404, ['message' => 'Order not found or cannot be deleted']);
    }
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
    $get->execute(['id' => $orderId]);
    $order = $get->fetch();
    if (!$order) {
        json_response(404, ['message' => 'Order not found or cannot be deleted']);
    }
    json_response(200, ['data' => read_order($order)]);
}

if (preg_match('#^/api/v1/orders/(\d+)/confirm$#', $path, $m) === 1 && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['user']);
    $orderId = (int)$m[1];
    $stmt = db()->prepare('UPDATE orders SET status = :status, submitted_at = NOW(), updated_at = NOW() WHERE id = :id AND owner_id = :uid');
    $stmt->execute(['status' => 'submitted', 'id' => $orderId, 'uid' => $user['id']]);
    if ($stmt->rowCount() === 0) {
        json_response(404, ['message' => 'Order not found']);
    }
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id AND owner_id = :uid LIMIT 1');
    $get->execute(['id' => $orderId, 'uid' => $user['id']]);
    $order = $get->fetch();
    if (!$order) {
        json_response(404, ['message' => 'Order not found']);
    }
    $mods = db()->query("SELECT id FROM users WHERE role IN ('moderator','admin') AND is_active = true")->fetchAll();
    $n = db()->prepare('INSERT INTO notifications (user_id, type, title, body, data_json) VALUES (:uid, :type, :title, :body, :data)');
    foreach ($mods as $row) {
        $n->execute([
            'uid' => $row['id'],
            'type' => 'new_order_submitted',
            'title' => 'New submitted order',
            'body' => 'A user submitted a new order.',
            'data' => json_encode(['orderId' => $orderId]),
        ]);
    }
    json_response(200, ['data' => read_order($order)]);
}

if ($path === '/api/v1/notifications' && $method === 'GET') {
    $user = require_auth();
    $stmt = db()->prepare('SELECT * FROM notifications WHERE user_id = :uid ORDER BY id DESC LIMIT 100');
    $stmt->execute(['uid' => $user['id']]);
    $rows = $stmt->fetchAll();
    json_response(200, ['data' => $rows]);
}

if (preg_match('#^/api/v1/orders/(\d+)/challan$#', $path, $m) === 1 && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['moderator', 'admin']);
    $orderId = (int)$m[1];
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
    $get->execute(['id' => $orderId]);
    $order = $get->fetch();
    if (!$order) json_response(404, ['message' => 'Order not found']);
    $existingStmt = db()->prepare('SELECT id FROM challans WHERE order_id = :order ORDER BY id DESC LIMIT 1');
    $existingStmt->execute(['order' => $orderId]);
    if ($existingStmt->fetch()) {
        json_response(409, ['message' => 'Challan already exists for this order.']);
    }
    $snapshot = read_order($order);
    $q = db()->prepare('INSERT INTO challans (order_id, generated_by, snapshot) VALUES (:order, :user, :snap)');
    $q->execute(['order' => $orderId, 'user' => $user['id'], 'snap' => json_encode($snapshot)]);
    $challanId = (int)db()->lastInsertId();
    db()->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id')
        ->execute(['status' => 'processing', 'id' => $orderId]);
    log_activity((int)$user['id'], 'order', $orderId, 'challan_generated', null, [
        'orderNo' => (string)($order['order_no'] ?? ''),
        'challanGenerated' => true,
    ]);
    $chSel = db()->prepare('SELECT * FROM challans WHERE id = :id LIMIT 1');
    $chSel->execute(['id' => $challanId]);
    $chRow = $chSel->fetch();
    if (!$chRow) {
        json_response(500, ['message' => 'Challan was not created.']);
    }
    json_response(201, ['data' => $chRow]);
}
if (preg_match('#^/api/v1/orders/(\d+)/challan$#', $path, $m) === 1 && $method === 'GET') {
    $user = require_auth();
    $orderId = (int)$m[1];
    $stmt = db()->prepare('SELECT o.owner_id, c.* FROM challans c JOIN orders o ON o.id = c.order_id WHERE c.order_id = :order ORDER BY c.id DESC LIMIT 1');
    $stmt->execute(['order' => $orderId]);
    $row = $stmt->fetch();
    if (!$row) json_response(404, ['message' => 'Challan not found']);
    if ($user['role'] === 'user' && (int)$row['owner_id'] !== (int)$user['id']) json_response(403, ['message' => 'Forbidden']);
    json_response(200, ['data' => $row]);
}

if (preg_match('#^/api/v1/orders/(\d+)/purchase-invoice$#', $path, $m) === 1 && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['moderator', 'admin']);
    $orderId = (int)$m[1];
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id LIMIT 1');
    $get->execute(['id' => $orderId]);
    $order = $get->fetch();
    if (!$order) json_response(404, ['message' => 'Order not found']);
    $existingStmt = db()->prepare("SELECT id FROM invoices WHERE order_id = :order AND type = 'purchase' ORDER BY id DESC LIMIT 1");
    $existingStmt->execute(['order' => $orderId]);
    if ($existingStmt->fetch()) {
        json_response(409, ['message' => 'Purchase invoice already exists for this order.']);
    }
    $lines = read_order_lines($orderId);
    if ($lines === []) {
        json_response(422, ['message' => 'Order has no line items. Add lines and cost prices before generating a purchase invoice.']);
    }
    foreach ($lines as $line) {
        $pr = order_line_purchase_prices($line);
        if ($pr['unit'] === null || $pr['unit'] <= 0) {
            json_response(422, ['message' => 'Purchase invoice requires a supplier cost (unit) price greater than zero on every line.']);
        }
        if ($pr['total'] === null || $pr['total'] <= 0) {
            json_response(422, ['message' => 'Purchase invoice requires a positive line total on every line (quantity × cost unit price).']);
        }
    }
    $pack = purchase_invoice_totals_snapshot($lines);
    $subtotal = $pack['subtotal'];
    $verStmt = db()->prepare("SELECT COALESCE(MAX(version_no), 0) AS v FROM invoices WHERE order_id = :order AND type = 'purchase'");
    $verStmt->execute(['order' => $orderId]);
    $version = (int)$verStmt->fetch()['v'] + 1;
    $ins = db()->prepare("INSERT INTO invoices (order_id, type, version_no, generated_by, subtotal, grand_total, snapshot) VALUES (:order, 'purchase', :version, :uid, :subtotal, :grand, :snap)");
    $ins->execute([
        'order' => $orderId,
        'version' => $version,
        'uid' => $user['id'],
        'subtotal' => $subtotal,
        'grand' => $subtotal,
        'snap' => $pack['snapshotJson'],
    ]);
    $invId = (int)db()->lastInsertId();
    $invSel = db()->prepare('SELECT * FROM invoices WHERE id = :id LIMIT 1');
    $invSel->execute(['id' => $invId]);
    $invoice = $invSel->fetch();
    if (!$invoice) {
        json_response(500, ['message' => 'Invoice was not created.']);
    }
    // Do not set delivered/completed here — admin marks delivery complete separately.
    // Purchase invoice increases payable to supplier.
    add_ledger($orderId, 'purchase_invoice', $subtotal, 'credit', 'invoice', (int)$invoice['id']);
    log_activity((int)$user['id'], 'invoice', (int)$invoice['id'], 'purchase_invoice_generated', null, [
        'orderId' => $orderId,
        'orderNo' => (string)($order['order_no'] ?? ''),
        'invoiceId' => (int)$invoice['id'],
    ]);
    json_response(201, ['data' => $invoice]);
}

if (preg_match('#^/api/v1/orders/(\d+)/billing-invoice$#', $path, $m) === 1 && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $orderId = (int)$m[1];
    $stRow = db()->prepare('SELECT status, order_no FROM orders WHERE id = :id AND is_active = true LIMIT 1');
    $stRow->execute(['id' => $orderId]);
    $orderMetaRow = $stRow->fetch();
    if (!$orderMetaRow) {
        json_response(404, ['message' => 'Order not found']);
    }
    if ((string)$orderMetaRow['status'] !== 'completed') {
        json_response(422, ['message' => 'Mark delivery complete before generating the customer billing invoice.']);
    }
    $orderNoForLog = (string)($orderMetaRow['order_no'] ?? '');
    $in = json_input();
    $markupPercent = (float)($in['markupPercent'] ?? 0);
    $markupByCategory = is_array($in['markupByCategory'] ?? null) ? $in['markupByCategory'] : [];
    $existingStmt = db()->prepare("SELECT id FROM invoices WHERE order_id = :order AND type = 'billing' ORDER BY id DESC LIMIT 1");
    $existingStmt->execute(['order' => $orderId]);
    if ($existingStmt->fetch()) {
        json_response(409, ['message' => 'Billing invoice already exists for this order.']);
    }
    $lines = read_order_lines($orderId);
    $lineUpd = db()->prepare('
        UPDATE order_lines
        SET markup_percent = :markup_percent,
            markup_amount = :markup_amount,
            unit_price_after_markup = :unit_after,
            line_total_after_markup = :line_after,
            profit_loss_amount = :profit_loss,
            updated_at = NOW()
        WHERE id = :id AND order_id = :order_id
    ');
    $subtotal = 0.0;
    $purchaseSubtotal = 0.0;
    $profitLossTotal = 0.0;
    $snapshotLines = [];
    foreach ($lines as $line) {
        $base = (float)($line['lineTotal'] ?? 0);
        $purchaseSubtotal += $base;
        $lineCategory = (string)($line['categoryId'] ?? '');
        $lineMarkupPercent = $markupPercent;
        if ($lineCategory !== '' && array_key_exists($lineCategory, $markupByCategory)) {
            $lineMarkupPercent = (float)$markupByCategory[$lineCategory];
        }
        $markupAmount = round($base * ($lineMarkupPercent / 100), 2);
        $billedTotal = $base + $markupAmount;
        $subtotal += $billedTotal;
        $profitLossTotal += $markupAmount;
        $unitBefore = isset($line['unitPrice']) ? (float)$line['unitPrice'] : null;
        $unitAfter = $unitBefore !== null ? $unitBefore + round($unitBefore * ($lineMarkupPercent / 100), 2) : null;
        $snapshotLines[] = [
            'id' => (string)($line['id'] ?? ''),
            'serial' => (int)($line['serial'] ?? 0),
            'categoryId' => $lineCategory,
            'itemId' => (string)($line['itemId'] ?? ''),
            'itemNameBn' => (string)($line['itemNameBn'] ?? ''),
            'itemNameEn' => (string)($line['itemNameEn'] ?? ''),
            'kg' => (string)($line['kg'] ?? ''),
            'gram' => (string)($line['gram'] ?? ''),
            'piece' => (string)($line['piece'] ?? ''),
            'unitPriceBeforeMarkup' => $unitBefore,
            'lineTotalBeforeMarkup' => $base,
            'markupPercent' => $lineMarkupPercent,
            'markupAmount' => $markupAmount,
            'unitPriceAfterMarkup' => $unitAfter,
            'lineTotalAfterMarkup' => $billedTotal,
            'profitLossAmount' => $markupAmount,
        ];
        if (!empty($line['id'])) {
            $lineUpd->execute([
                'id' => (int)$line['id'],
                'order_id' => $orderId,
                'markup_percent' => $lineMarkupPercent,
                'markup_amount' => $markupAmount,
                'unit_after' => $unitAfter,
                'line_after' => $billedTotal,
                'profit_loss' => $markupAmount,
            ]);
        }
    }
    $verStmt = db()->prepare("SELECT COALESCE(MAX(version_no), 0) AS v FROM invoices WHERE order_id = :order AND type = 'billing'");
    $verStmt->execute(['order' => $orderId]);
    $version = (int)$verStmt->fetch()['v'] + 1;
    $ins = db()->prepare("INSERT INTO invoices (order_id, type, version_no, generated_by, subtotal, grand_total, snapshot) VALUES (:order, 'billing', :version, :uid, :subtotal, :grand, :snap)");
    $ins->execute([
        'order' => $orderId,
        'version' => $version,
        'uid' => $user['id'],
        'subtotal' => $subtotal,
        'grand' => $subtotal,
        'snap' => json_encode([
            'markupMode' => empty($markupByCategory) ? 'global' : 'category_wise',
            'markupPercent' => $markupPercent,
            'markupByCategory' => $markupByCategory,
            'purchaseSubtotal' => $purchaseSubtotal,
            'billingSubtotal' => $subtotal,
            'profitLossTotal' => $profitLossTotal,
            'lines' => $snapshotLines,
        ]),
    ]);
    $invId = (int)db()->lastInsertId();
    $invSel = db()->prepare('SELECT * FROM invoices WHERE id = :id LIMIT 1');
    $invSel->execute(['id' => $invId]);
    $invoice = $invSel->fetch();
    if (!$invoice) {
        json_response(500, ['message' => 'Invoice was not created.']);
    }
    db()->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id')
        ->execute(['status' => 'invoiced', 'id' => $orderId]);
    // Billing invoice increases receivable from customer.
    add_ledger($orderId, 'billing_invoice', $subtotal, 'debit', 'invoice', (int)$invoice['id']);
    log_activity((int)$user['id'], 'invoice', (int)$invoice['id'], 'billing_invoice_generated', null, [
        'orderId' => $orderId,
        'orderNo' => $orderNoForLog,
        'invoiceId' => (int)$invoice['id'],
    ]);
    json_response(201, ['data' => $invoice]);
}

if (preg_match('#^/api/v1/orders/(\d+)/mark-delivered$#', $path, $m) === 1 && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $orderId = (int)$m[1];
    $get = db()->prepare('SELECT * FROM orders WHERE id = :id AND is_active = true LIMIT 1');
    $get->execute(['id' => $orderId]);
    $order = $get->fetch();
    if (!$order) {
        json_response(404, ['message' => 'Order not found']);
    }
    $st = (string)$order['status'];
    if ($st === 'invoiced') {
        json_response(409, ['message' => 'Order is already invoiced; delivery is already recorded in the workflow.']);
    }
    if ($st === 'completed') {
        $get->execute(['id' => $orderId]);
        json_response(200, ['data' => read_order($get->fetch()), 'message' => 'Order was already marked delivered.']);
    }
    if (!in_array($st, ['submitted', 'processing'], true)) {
        json_response(422, ['message' => 'Order cannot be marked delivered from its current status.']);
    }
    $before = ['status' => $st];
    db()->prepare('UPDATE orders SET status = :status, updated_at = NOW() WHERE id = :id')
        ->execute(['status' => 'completed', 'id' => $orderId]);
    log_activity((int)$user['id'], 'order', $orderId, 'order_marked_delivered', $before, [
        'status' => 'completed',
        'orderNo' => (string)($order['order_no'] ?? ''),
    ]);
    $get->execute(['id' => $orderId]);
    json_response(200, ['data' => read_order($get->fetch())]);
}

if (preg_match('#^/api/v1/orders/(\d+)/invoices$#', $path, $m) === 1 && $method === 'GET') {
    $user = require_auth();
    $orderId = (int)$m[1];
    $ownerStmt = db()->prepare('SELECT owner_id FROM orders WHERE id = :id LIMIT 1');
    $ownerStmt->execute(['id' => $orderId]);
    $ownerRow = $ownerStmt->fetch();
    if (!$ownerRow) json_response(404, ['message' => 'Order not found']);
    if ($user['role'] === 'user' && (int)$ownerRow['owner_id'] !== (int)$user['id']) json_response(403, ['message' => 'Forbidden']);
    $stmt = db()->prepare("SELECT * FROM invoices WHERE order_id = :id ORDER BY id DESC");
    $stmt->execute(['id' => $orderId]);
    $rows = $stmt->fetchAll();
    if ($user['role'] === 'user') {
        // End users can access only final customer billing invoices.
        $rows = array_values(array_filter($rows, static fn(array $r) => (string)$r['type'] === 'billing'));
    } elseif ($user['role'] === 'moderator') {
        // Moderators can access only their own purchase invoices.
        $rows = array_values(array_filter(
            $rows,
            static fn(array $r) =>
                (string)$r['type'] === 'purchase' &&
                (int)($r['generated_by'] ?? 0) === (int)$user['id']
        ));
    }
    json_response(200, ['data' => $rows]);
}

if (preg_match('#^/api/v1/catalog/items/([^/]+)/price-history$#', $path, $m) === 1 && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    $itemCode = urldecode($m[1]);
    $stmt = db()->prepare("
        SELECT iph.*, o.order_no, o.order_date
        FROM item_price_histories iph
        LEFT JOIN orders o ON o.id = iph.order_id
        WHERE iph.item_code = :item_code
        ORDER BY COALESCE(iph.effective_from, iph.updated_at, iph.created_at) DESC, iph.id DESC
    ");
    $stmt->execute(['item_code' => $itemCode]);
    $rows = $stmt->fetchAll();
    json_response(200, ['data' => $rows]);
}

if ($path === '/api/v1/statements/generate' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $type = (string)($in['type'] ?? 'billing');
    if (!in_array($type, ['purchase', 'billing'], true)) json_response(422, ['message' => 'Invalid statement type']);
    $stmt = db()->prepare('INSERT INTO statement_cycles (type, cycle_start, cycle_end, generated_by) VALUES (:type, :start, :end, :uid)');
    $stmt->execute([
        'type' => $type,
        'start' => (string)($in['cycleStart'] ?? date('Y-m-01')),
        'end' => (string)($in['cycleEnd'] ?? date('Y-m-t')),
        'uid' => $user['id'],
    ]);
    $scId = (int)db()->lastInsertId();
    $scSel = db()->prepare('SELECT * FROM statement_cycles WHERE id = :id LIMIT 1');
    $scSel->execute(['id' => $scId]);
    $scRow = $scSel->fetch();
    if (!$scRow) {
        json_response(500, ['message' => 'Statement cycle was not created.']);
    }
    json_response(201, ['data' => $scRow]);
}

if ($path === '/api/v1/statements' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    $type = $_GET['type'] ?? null;
    if ($type && in_array($type, ['purchase', 'billing'], true)) {
        $stmt = db()->prepare('SELECT * FROM statement_cycles WHERE type = :type ORDER BY id DESC');
        $stmt->execute(['type' => $type]);
        $rows = $stmt->fetchAll();
    } else {
        $rows = db()->query('SELECT * FROM statement_cycles ORDER BY id DESC')->fetchAll();
    }
    if ($user['role'] === 'moderator') {
        $rows = array_values(array_filter($rows, static fn(array $r) => $r['type'] === 'purchase'));
    }
    json_response(200, ['data' => $rows]);
}

/**
 * One ACID unit for statement saves: optional payment chunk(s) + optional adjustment chunk(s).
 * Each row still hits payments/adjustments + ledger_entries via shared helpers (same rules as /batch).
 */
if ($path === '/api/v1/statement-bookings' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $paymentType = (string)($in['type'] ?? '');
    if (!in_array($paymentType, ['purchase', 'billing'], true)) {
        json_response(422, ['message' => 'type must be purchase or billing.']);
    }
    $paymentEntries = $in['payments'] ?? null;
    $adjustmentEntries = $in['adjustments'] ?? null;
    if (!is_array($paymentEntries)) {
        $paymentEntries = [];
    }
    if (!is_array($adjustmentEntries)) {
        $adjustmentEntries = [];
    }
    if (count($paymentEntries) === 0 && count($adjustmentEntries) === 0) {
        json_response(422, ['message' => 'Provide at least one payment or adjustment entry.']);
    }
    $paymentNote = (string)($in['paymentNote'] ?? '');
    $adjustmentReason = (string)($in['adjustmentReason'] ?? 'Statement correction');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $createdPayments = [];
        foreach ($paymentEntries as $ent) {
            if (!is_array($ent)) {
                continue;
            }
            $oid = isset($ent['orderId']) && is_numeric($ent['orderId']) ? (int)$ent['orderId'] : 0;
            $amt = (float)($ent['amount'] ?? 0);
            if ($oid <= 0 || $amt <= 0.00001) {
                throw new InvalidArgumentException('Each payment entry needs a positive orderId and amount.');
            }
            $createdPayments[] = insert_payment_and_ledger_row((int)$user['id'], $oid, null, $paymentType, $amt, $paymentNote);
        }
        $createdAdjustments = [];
        foreach ($adjustmentEntries as $ent) {
            if (!is_array($ent)) {
                continue;
            }
            $oid = isset($ent['orderId']) && is_numeric($ent['orderId']) ? (int)$ent['orderId'] : 0;
            $amt = (float)($ent['amount'] ?? 0);
            if ($oid <= 0 || $amt <= 0.00001) {
                throw new InvalidArgumentException('Each adjustment entry needs a positive orderId and amount.');
            }
            $createdAdjustments[] = insert_adjustment_and_ledger_row((int)$user['id'], $oid, $paymentType, $amt, $adjustmentReason);
        }
        if (count($createdPayments) === 0 && count($createdAdjustments) === 0) {
            throw new InvalidArgumentException('No valid payment or adjustment entries.');
        }
        $pdo->commit();
        $out = [
            'payments' => $createdPayments,
            'adjustments' => $createdAdjustments,
            'applied' => [
                'paymentRows' => count($createdPayments),
                'adjustmentRows' => count($createdAdjustments),
            ],
        ];
        if (count($createdPayments) > 0 && count($createdAdjustments) === 0) {
            $out['aboutAdjustments'] = 'Rows in `adjustments` are only created when you lower cumulative paid (statement correction). Raising paid inserts `payments` (+ ledger) only.';
        }
        if (count($createdAdjustments) > 0 && count($createdPayments) === 0) {
            $out['aboutPayments'] = 'No payment rows in this request; corrections were applied as adjustments (+ ledger) only.';
        }
        json_response(201, ['data' => $out]);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(422, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(500, ['message' => app_debug() ? $e->getMessage() : 'Statement booking failed.']);
    }
}

if ($path === '/api/v1/payments/batch' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $paymentType = (string)($in['type'] ?? '');
    if (!in_array($paymentType, ['purchase', 'billing'], true)) {
        json_response(422, ['message' => 'type must be purchase or billing.']);
    }
    $entries = $in['entries'] ?? null;
    if (!is_array($entries) || count($entries) === 0) {
        json_response(422, ['message' => 'entries must be a non-empty array of { orderId, amount }.']);
    }
    $note = (string)($in['note'] ?? '');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $created = [];
        foreach ($entries as $ent) {
            if (!is_array($ent)) {
                continue;
            }
            $oid = isset($ent['orderId']) && is_numeric($ent['orderId']) ? (int)$ent['orderId'] : 0;
            $amt = (float)($ent['amount'] ?? 0);
            if ($oid <= 0 || $amt <= 0.00001) {
                throw new InvalidArgumentException('Each entry needs a positive orderId and amount.');
            }
            $created[] = insert_payment_and_ledger_row((int)$user['id'], $oid, null, $paymentType, $amt, $note);
        }
        if (count($created) === 0) {
            throw new InvalidArgumentException('No valid payment entries.');
        }
        $pdo->commit();
        json_response(201, ['data' => $created]);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(422, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(500, ['message' => app_debug() ? $e->getMessage() : 'Batch payment failed.']);
    }
}

if ($path === '/api/v1/payments' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $orderId = isset($in['orderId']) && is_numeric($in['orderId']) ? (int)$in['orderId'] : null;
    $invoiceId = isset($in['invoiceId']) && is_numeric($in['invoiceId']) ? (int)$in['invoiceId'] : null;
    $paymentType = payment_or_order_type($in);
    $payAmount = (float)($in['amount'] ?? 0);
    $note = (string)($in['note'] ?? '');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $payment = insert_payment_and_ledger_row((int)$user['id'], $orderId, $invoiceId, $paymentType, $payAmount, $note);
        $pdo->commit();
        json_response(201, ['data' => $payment]);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(422, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(500, ['message' => app_debug() ? $e->getMessage() : 'Payment failed.']);
    }
}

if ($path === '/api/v1/payments' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    ensure_table_exists('payments', 'Payments');
    $paymentTypeSelect = table_has_column('payments', 'payment_type')
        ? 'p.payment_type'
        : "NULL";
    $rows = db()->query("
        SELECT
            p.*,
            o.order_no,
            o.order_date,
            o.contact_person,
            {$paymentTypeSelect} AS stored_payment_type,
            COALESCE(inv.type, (
                SELECT i2.type
                FROM invoices i2
                WHERE i2.order_id = o.id
                ORDER BY i2.id DESC
                LIMIT 1
            )) AS invoice_type
        FROM payments p
        LEFT JOIN invoices inv ON inv.id = p.invoice_id
        LEFT JOIN orders o ON o.id = COALESCE(p.order_id, inv.order_id)
        ORDER BY p.id DESC
    ")->fetchAll();
    $rows = array_map(static function (array $r): array {
        $r['payment_type'] = resolve_stored_payment_row_effective_type($r);

        return $r;
    }, $rows);
    if ($user['role'] === 'moderator') {
        $rows = array_values(array_filter($rows, static fn(array $r): bool => ($r['payment_type'] ?? '') === 'purchase'));
    }
    json_response(200, ['data' => $rows]);
}

if ($path === '/api/v1/adjustments/batch' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $type = (string)($in['type'] ?? '');
    if (!in_array($type, ['purchase', 'billing'], true)) {
        json_response(422, ['message' => 'type must be purchase or billing.']);
    }
    $entries = $in['entries'] ?? null;
    if (!is_array($entries) || count($entries) === 0) {
        json_response(422, ['message' => 'entries must be a non-empty array of { orderId, amount }.']);
    }
    $reason = (string)($in['reason'] ?? 'Manual adjustment');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $created = [];
        foreach ($entries as $ent) {
            if (!is_array($ent)) {
                continue;
            }
            $oid = isset($ent['orderId']) && is_numeric($ent['orderId']) ? (int)$ent['orderId'] : 0;
            $amt = (float)($ent['amount'] ?? 0);
            if ($oid <= 0 || $amt <= 0.00001) {
                throw new InvalidArgumentException('Each entry needs a positive orderId and amount.');
            }
            $created[] = insert_adjustment_and_ledger_row((int)$user['id'], $oid, $type, $amt, $reason);
        }
        if (count($created) === 0) {
            throw new InvalidArgumentException('No valid adjustment entries.');
        }
        $pdo->commit();
        json_response(201, ['data' => $created]);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(422, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(500, ['message' => app_debug() ? $e->getMessage() : 'Batch adjustment failed.']);
    }
}

if ($path === '/api/v1/adjustments' && $method === 'POST') {
    $user = require_auth();
    require_role($user, ['admin']);
    $in = json_input();
    $orderId = isset($in['orderId']) && is_numeric($in['orderId']) ? (int)$in['orderId'] : null;
    if ($orderId === null) {
        json_response(422, ['message' => 'orderId is required for adjustment entry.']);
    }
    $type = (string)($in['type'] ?? 'billing');
    $adjAmount = (float)($in['amount'] ?? 0);
    $reason = (string)($in['reason'] ?? 'Manual adjustment');
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $adj = insert_adjustment_and_ledger_row((int)$user['id'], $orderId, $type, $adjAmount, $reason);
        $pdo->commit();
        json_response(201, ['data' => $adj]);
    } catch (InvalidArgumentException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(422, ['message' => $e->getMessage()]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(500, ['message' => app_debug() ? $e->getMessage() : 'Adjustment failed.']);
    }
}

if ($path === '/api/v1/adjustments' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin', 'moderator']);
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    // Explicit columns so joined order_date / contact_person are never lost to a.* key collisions in PDO.
    $rows = db()->query("
        SELECT
            a.id,
            a.order_id,
            a.type,
            a.amount,
            a.reason,
            a.created_by,
            a.meta,
            a.created_at,
            a.updated_at,
            o.order_no AS order_no,
            o.order_date AS order_date,
            o.contact_person AS contact_person
        FROM adjustments a
        LEFT JOIN orders o ON o.id = a.order_id
        ORDER BY a.id DESC
    ")->fetchAll();
    if ($user['role'] === 'moderator') {
        $rows = array_values(array_filter($rows, static fn(array $r): bool => ($r['type'] ?? '') === 'purchase'));
    }
    json_response(200, ['data' => $rows]);
}

if ($path === '/api/v1/ledger' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin']);
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('Pragma: no-cache');
    $rows = db()->query("
        SELECT
            le.*,
            o.order_no,
            o.contact_person,
            o.order_date AS order_date
        FROM ledger_entries le
        LEFT JOIN orders o ON o.id = le.order_id
        ORDER BY le.id DESC
        LIMIT 500
    ")->fetchAll();
    json_response(200, ['data' => $rows]);
}

if ($path === '/api/v1/admin/activity-logs' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin']);
    $from = trim((string)($_GET['from'] ?? ''));
    $to = trim((string)($_GET['to'] ?? ''));
    if ($from === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $from)) {
        $from = date('Y-m-d', strtotime('-30 days'));
    }
    if ($to === '' || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
        $to = date('Y-m-d');
    }
    $limit = min(500, max(1, (int)($_GET['limit'] ?? 150)));
    $actionQ = trim((string)($_GET['action'] ?? ''));
    try {
        if ($actionQ !== '') {
            $stmt = db()->prepare('
                SELECT a.id, a.actor_user_id, a.entity_type, a.entity_id, a.action, a.before_json, a.after_json, a.created_at,
                       u.name AS actor_name, u.email AS actor_email, u.role AS actor_role
                FROM activity_logs a
                INNER JOIN users u ON u.id = a.actor_user_id
                WHERE CAST(a.created_at AS DATE) >= CAST(:from AS DATE) AND CAST(a.created_at AS DATE) <= CAST(:to AS DATE)
                  AND a.action = :action
                ORDER BY a.id DESC
                LIMIT ' . $limit);
            $stmt->execute(['from' => $from, 'to' => $to, 'action' => $actionQ]);
        } else {
            $stmt = db()->prepare('
                SELECT a.id, a.actor_user_id, a.entity_type, a.entity_id, a.action, a.before_json, a.after_json, a.created_at,
                       u.name AS actor_name, u.email AS actor_email, u.role AS actor_role
                FROM activity_logs a
                INNER JOIN users u ON u.id = a.actor_user_id
                WHERE CAST(a.created_at AS DATE) >= CAST(:from AS DATE) AND CAST(a.created_at AS DATE) <= CAST(:to AS DATE)
                ORDER BY a.id DESC
                LIMIT ' . $limit);
            $stmt->execute(['from' => $from, 'to' => $to]);
        }
        $rows = $stmt->fetchAll();
    } catch (\PDOException $e) {
        if (pdo_exception_is_missing_table($e) || str_contains((string)$e->getMessage(), 'activity_logs')) {
            json_response(200, ['data' => []]);
        }
        throw $e;
    }
    $out = [];
    foreach ($rows as $row) {
        $out[] = [
            'id' => (int)$row['id'],
            'actorUserId' => (int)$row['actor_user_id'],
            'entityType' => (string)$row['entity_type'],
            'entityId' => (int)$row['entity_id'],
            'action' => (string)$row['action'],
            'before' => isset($row['before_json']) && $row['before_json'] !== null && $row['before_json'] !== ''
                ? json_decode((string)$row['before_json'], true) : null,
            'after' => isset($row['after_json']) && $row['after_json'] !== null && $row['after_json'] !== ''
                ? json_decode((string)$row['after_json'], true) : null,
            'createdAt' => (string)$row['created_at'],
            'actorName' => (string)($row['actor_name'] ?? ''),
            'actorEmail' => (string)($row['actor_email'] ?? ''),
            'actorRole' => (string)($row['actor_role'] ?? ''),
        ];
    }
    json_response(200, ['data' => $out]);
}

if ($path === '/api/v1/admin/reports/summary' && $method === 'GET') {
    $user = require_auth();
    require_role($user, ['admin']);
    $invoicesCount = (int)db()->query('SELECT COUNT(*) AS c FROM invoices')->fetch()['c'];
    $billingSum = (float)db()->query("SELECT COALESCE(SUM(grand_total),0) AS s FROM invoices WHERE type = 'billing'")->fetch()['s'];
    $purchaseSum = (float)db()->query("SELECT COALESCE(SUM(grand_total),0) AS s FROM invoices WHERE type = 'purchase'")->fetch()['s'];
    $outstanding = $billingSum - (float)db()->query('SELECT COALESCE(SUM(amount),0) AS s FROM payments')->fetch()['s'];
    json_response(200, [
        'data' => [
            'totalInvoices' => $invoicesCount,
            'billingTotal' => $billingSum,
            'purchaseTotal' => $purchaseSum,
            'outstanding' => $outstanding,
        ],
    ]);
}

json_response(404, ['message' => 'Not found']);
}
