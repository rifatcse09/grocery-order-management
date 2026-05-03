<?php

declare(strict_types=1);

function envv(string $key, string $default = ''): string {
    return \App\Support\LegacyEnv::get($key, $default);
}

function json_input(): array {
    $raw = file_get_contents('php://input') ?: '{}';
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function json_response(int $status, array $payload): void {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    \App\Http\Cors\CorsPolicy::sendNativeCorsHeaders();
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function app_debug(): bool {
    return strtolower(envv('APP_DEBUG', 'false')) === 'true';
}

function db(): PDO {
    return \App\Database\LegacyPdo::connection();
}

function bearer_token(): ?string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m) === 1) {
        return trim($m[1]);
    }
    return null;
}

function current_user(): ?array {
    $token = bearer_token();
    if (!$token) {
        return null;
    }
    $hash = hash('sha256', $token);
    $stmt = db()->prepare('SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = :h LIMIT 1');
    $stmt->execute(['h' => $hash]);
    $user = $stmt->fetch();
    return $user ?: null;
}

function require_auth(): array {
    $user = current_user();
    if (!$user) {
        json_response(401, ['message' => 'Unauthorized']);
    }
    if (!$user['is_active']) {
        json_response(403, ['message' => 'Account inactive']);
    }
    return $user;
}

function require_role(array $user, array $allowed): void {
    if (!in_array($user['role'], $allowed, true)) {
        json_response(403, ['message' => 'Forbidden']);
    }
}

function make_token(int $userId): string {
    $raw = bin2hex(random_bytes(32));
    $hash = hash('sha256', $raw);
    $stmt = db()->prepare('INSERT INTO auth_tokens (user_id, token_hash) VALUES (:uid, :h)');
    $stmt->execute(['uid' => $userId, 'h' => $hash]);
    return $raw;
}

function users_password_column(): string {
    static $column = null;
    if (is_string($column) && $column !== '') {
        return $column;
    }
    $stmt = db()->query("
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name IN ('password', 'password_hash')
        ORDER BY CASE WHEN column_name = 'password' THEN 0 ELSE 1 END
        LIMIT 1
    ");
    $row = $stmt->fetch();
    $column = (string)($row['column_name'] ?? 'password');
    return $column;
}

function ensure_table_exists(string $table, string $featureLabel): void {
    $stmt = db()->prepare("SELECT to_regclass(:name) AS t");
    $stmt->execute(['name' => 'public.' . $table]);
    $exists = (string)(($stmt->fetch()['t'] ?? ''));
    if ($exists === '') {
        json_response(503, [
            'message' => "{$featureLabel} is not ready. Missing database table: {$table}. Please run migrations.",
            'missingTable' => $table,
        ]);
    }
}

function table_has_column(string $table, string $column): bool {
    $stmt = db()->prepare("
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = :table
          AND column_name = :column
        LIMIT 1
    ");
    $stmt->execute(['table' => $table, 'column' => $column]);
    return (bool)$stmt->fetch();
}

function persist_signature(mixed $incoming): ?string {
    if ($incoming === null) {
        return null;
    }
    $value = trim((string)$incoming);
    if ($value === '') {
        return null;
    }

    if (!str_starts_with($value, 'data:image/')) {
        return $value;
    }

    if (!preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $value, $m)) {
        throw new RuntimeException('Invalid signature image format.');
    }

    $mimeExt = strtolower($m[1]);
    $ext = match ($mimeExt) {
        'jpeg' => 'jpg',
        'jpg', 'png', 'gif', 'webp' => $mimeExt,
        default => 'png',
    };
    $binary = base64_decode($m[2], true);
    if ($binary === false) {
        throw new RuntimeException('Invalid signature image content.');
    }

    // Store under Laravel web root: <app-root>/public/uploads/signatures → URL /uploads/signatures/<file>
    // (__DIR__ = …/app/Support/Api, three levels up = app root, same layout as backend/public in this repo.)
    $dir = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'signatures';
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('Failed to create signature storage directory.');
        }
    }
    @chmod($dir, 0775);

    $name = date('YmdHis') . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    $fullPath = $dir . '/' . $name;
    if (file_put_contents($fullPath, $binary, LOCK_EX) === false) {
        throw new RuntimeException('Failed to store signature image.');
    }
    @chmod($fullPath, 0644);

    return '/uploads/signatures/' . $name;
}

function public_user(array $row): array {
    return [
        'id' => (string)$row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'role' => $row['role'],
        'billingAddress' => $row['billing_address'],
        'deliveryAddress' => $row['delivery_address'],
        'isActive' => (bool)$row['is_active'],
    ];
}

function map_catalog(): array {
    return (new \App\Services\Catalog\CatalogMapService(db()))->mapIndexed();
}

function read_order_lines(int $orderId): array {
    $stmt = db()->prepare('SELECT * FROM order_lines WHERE order_id = :id ORDER BY serial ASC');
    $stmt->execute(['id' => $orderId]);
    $rows = $stmt->fetchAll();
    return array_map(static fn(array $line) => [
        'id' => (string)$line['id'],
        'serial' => (int)$line['serial'],
        'categoryId' => $line['category_code'] ? (string)$line['category_code'] : '',
        'itemId' => $line['item_code'] ? (string)$line['item_code'] : '',
        'itemNameBn' => $line['item_name_bn'],
        'itemNameEn' => $line['item_name_en'],
        'kg' => ((float)($line['kg'] ?? 0)) > 0 ? (string)$line['kg'] : '',
        'gram' => ((float)($line['gram'] ?? 0)) > 0 ? (string)$line['gram'] : '',
        'piece' => ((float)($line['piece'] ?? 0)) > 0 ? (string)$line['piece'] : '',
        'instructions' => $line['instructions'] ?? '',
        'unitPrice' => $line['unit_price'] !== null ? (float)$line['unit_price'] : null,
        'lineTotal' => $line['line_total'] !== null ? (float)$line['line_total'] : null,
        'markupPercent' => $line['markup_percent'] !== null ? (float)$line['markup_percent'] : 0.0,
        'markupAmount' => $line['markup_amount'] !== null ? (float)$line['markup_amount'] : 0.0,
        'unitPriceAfterMarkup' => $line['unit_price_after_markup'] !== null ? (float)$line['unit_price_after_markup'] : null,
        'lineTotalAfterMarkup' => $line['line_total_after_markup'] !== null ? (float)$line['line_total_after_markup'] : null,
        'profitLossAmount' => $line['profit_loss_amount'] !== null ? (float)$line['profit_loss_amount'] : 0.0,
    ], $rows);
}

function order_has_challan(int $orderId): bool {
    $stmt = db()->prepare('SELECT 1 FROM challans WHERE order_id = :id LIMIT 1');
    $stmt->execute(['id' => $orderId]);
    return (bool)$stmt->fetchColumn();
}

function order_has_invoice_type(int $orderId, string $type): bool {
    $stmt = db()->prepare('SELECT 1 FROM invoices WHERE order_id = :id AND type = :type LIMIT 1');
    $stmt->execute(['id' => $orderId, 'type' => $type]);
    return (bool)$stmt->fetchColumn();
}

function order_purchase_generated_by_role(int $orderId): ?string {
    $stmt = db()->prepare("
        SELECT u.role
        FROM invoices i
        LEFT JOIN users u ON u.id = i.generated_by
        WHERE i.order_id = :id AND i.type = 'purchase'
        ORDER BY i.id DESC
        LIMIT 1
    ");
    $stmt->execute(['id' => $orderId]);
    $role = $stmt->fetchColumn();
    if ($role === false || $role === null) return null;
    $role = (string)$role;
    return in_array($role, ['admin', 'moderator'], true) ? $role : null;
}

function order_latest_invoice_row(int $orderId, string $type): ?array {
    $stmt = db()->prepare('SELECT * FROM invoices WHERE order_id = :id AND type = :type ORDER BY id DESC LIMIT 1');
    $stmt->execute(['id' => $orderId, 'type' => $type]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function read_order(array $row): array {
    $deliveryWindow = trim((string)($row['delivery_time_window'] ?? ''));
    $orderId = (int)$row['id'];
    $challanGenerated = (bool)($row['challan_generated'] ?? false) || order_has_challan($orderId);
    $purchaseInvoiceGenerated = (bool)($row['purchase_invoice_generated'] ?? false) || order_has_invoice_type($orderId, 'purchase');
    $billingInvoiceGenerated = (bool)($row['billing_invoice_generated'] ?? false) || order_has_invoice_type($orderId, 'billing');
    $purchaseInvoiceGeneratedBy = order_purchase_generated_by_role($orderId);
    $purchaseInvoice = $purchaseInvoiceGenerated ? order_latest_invoice_row($orderId, 'purchase') : null;
    $billingInvoice = $billingInvoiceGenerated ? order_latest_invoice_row($orderId, 'billing') : null;
    $billingSnap = [];
    if ($billingInvoice && !empty($billingInvoice['snapshot'])) {
        $decoded = json_decode((string)$billingInvoice['snapshot'], true);
        if (is_array($decoded)) $billingSnap = $decoded;
    }
    $purchaseSubtotal = $purchaseInvoice && isset($purchaseInvoice['grand_total']) ? (float)$purchaseInvoice['grand_total'] : null;
    $billingSubtotal = $billingInvoice && isset($billingInvoice['grand_total']) ? (float)$billingInvoice['grand_total'] : null;
    $billingCategoryMarkups = is_array($billingSnap['markupByCategory'] ?? null) ? $billingSnap['markupByCategory'] : null;
    $billingMarkupPercent = isset($billingSnap['markupPercent']) ? (float)$billingSnap['markupPercent'] : null;
    $grandTotal = $billingSubtotal;
    return [
        'id' => (string)$orderId,
        'ownerId' => (string)$row['owner_id'],
        'orderNo' => $row['order_no'],
        'orderDate' => $row['order_date'],
        'submittedAt' => $row['submitted_at'],
        'deliveryDate' => substr((string)$row['delivery_datetime'], 0, 10),
        'deliveryTime' => $deliveryWindow !== '' ? $deliveryWindow : substr((string)$row['delivery_datetime'], 11, 5),
        'status' => $row['status'],
        'billingAddress' => $row['billing_address'],
        'deliveryAddress' => $row['delivery_address'],
        'contactPerson' => $row['contact_person'],
        'phone' => $row['phone'],
        'signatureDataUrl' => $row['signature_data_url'] ?? null,
        'challanGenerated' => $challanGenerated,
        'purchaseInvoiceGenerated' => $purchaseInvoiceGenerated,
        'purchaseInvoiceGeneratedBy' => $purchaseInvoiceGeneratedBy,
        'billingInvoiceGenerated' => $billingInvoiceGenerated,
        'purchaseSubtotal' => $purchaseSubtotal,
        'billingSubtotal' => $billingSubtotal,
        'markupPercent' => $billingMarkupPercent,
        'billingCategoryMarkups' => $billingCategoryMarkups,
        'grandTotal' => $grandTotal,
        'lines' => read_order_lines($orderId),
    ];
}

function log_activity(int $actorId, string $entityType, int $entityId, string $action, ?array $before = null, ?array $after = null): void {
    try {
        $stmt = db()->prepare('INSERT INTO activity_logs (actor_user_id, entity_type, entity_id, action, before_json, after_json) VALUES (:actor, :etype, :eid, :action, :before, :after)');
        $stmt->execute([
            'actor' => $actorId,
            'etype' => $entityType,
            'eid' => $entityId,
            'action' => $action,
            'before' => $before ? json_encode($before) : null,
            'after' => $after ? json_encode($after) : null,
        ]);
    } catch (\PDOException $e) {
        // Allow business flow to continue when audit table is missing.
        if ((string)$e->getCode() === '42P01') {
            return;
        }
        throw $e;
    }
}

function add_ledger(?int $orderId, string $entryType, float $amount, string $direction, string $refType, ?int $refId): void {
    $ts = date('Y-m-d H:i:s');
    $stmt = db()->prepare('INSERT INTO ledger_entries (order_id, entry_type, amount, direction, ref_type, ref_id, created_at, updated_at) VALUES (:order_id, :entry_type, :amount, :direction, :ref_type, :ref_id, :ts, :ts2)');
    $stmt->execute([
        'order_id' => $orderId,
        'entry_type' => $entryType,
        'amount' => $amount,
        'direction' => $direction,
        'ref_type' => $refType,
        'ref_id' => $refId,
        'ts' => $ts,
        'ts2' => $ts,
    ]);
}

/**
 * Resolve purchase vs billing for a stored payment row (must match GET /api/v1/payments).
 *
 * @param array<string, mixed> $r Row with payment_type or stored_payment_type, note, invoice_type
 */
function resolve_stored_payment_row_effective_type(array $r): string
{
    $stored = (string)($r['stored_payment_type'] ?? $r['payment_type'] ?? '');
    if (in_array($stored, ['purchase', 'billing'], true)) {
        return $stored;
    }
    $note = (string)($r['note'] ?? '');
    if (stripos($note, 'Purchase statement payment') !== false) {
        return 'purchase';
    }
    if (stripos($note, 'Billing statement payment') !== false) {
        return 'billing';
    }
    $resolved = (string)($r['invoice_type'] ?? 'billing');

    return in_array($resolved, ['purchase', 'billing'], true) ? $resolved : 'billing';
}

/**
 * @return array<int, array<string, mixed>>
 */
function payment_rows_for_order_with_invoice_type(int $orderId): array
{
    $paymentTypeSelect = table_has_column('payments', 'payment_type')
        ? 'p.payment_type'
        : 'NULL';
    $stmt = db()->prepare("
        SELECT
            p.*,
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
        WHERE p.order_id = :id
    ");
    $stmt->execute(['id' => $orderId]);
    $rows = $stmt->fetchAll();

    return is_array($rows) ? $rows : [];
}

/** Same as statement UI: purchase payments minus purchase adjustments for this order. */
function order_net_purchase_paid_applied(int $orderId): float
{
    if (!table_has_column('payments', 'payment_type')) {
        return 0.0;
    }
    $paid = 0.0;
    foreach (payment_rows_for_order_with_invoice_type($orderId) as $row) {
        if (resolve_stored_payment_row_effective_type($row) === 'purchase') {
            $paid += (float)($row['amount'] ?? 0);
        }
    }
    $a = db()->prepare("SELECT COALESCE(SUM(amount), 0) AS t FROM adjustments WHERE order_id = :id AND type = 'purchase'");
    $a->execute(['id' => $orderId]);
    $adj = (float)($a->fetch()['t'] ?? 0);

    return $paid - $adj;
}

function order_latest_purchase_invoice_grand(int $orderId): ?float
{
    $s = db()->prepare("SELECT grand_total FROM invoices WHERE order_id = :id AND type = 'purchase' ORDER BY id DESC LIMIT 1");
    $s->execute(['id' => $orderId]);
    $row = $s->fetch();
    if (!$row || !isset($row['grand_total'])) {
        return null;
    }

    return (float)$row['grand_total'];
}

/** Billing payments minus billing adjustments (customer collections). */
function order_net_billing_paid_applied(int $orderId): float
{
    if (!table_has_column('payments', 'payment_type')) {
        return 0.0;
    }
    $paid = 0.0;
    foreach (payment_rows_for_order_with_invoice_type($orderId) as $row) {
        if (resolve_stored_payment_row_effective_type($row) === 'billing') {
            $paid += (float)($row['amount'] ?? 0);
        }
    }
    $a = db()->prepare("SELECT COALESCE(SUM(amount), 0) AS t FROM adjustments WHERE order_id = :id AND type = 'billing'");
    $a->execute(['id' => $orderId]);
    $adj = (float)($a->fetch()['t'] ?? 0);

    return $paid - $adj;
}

function order_latest_billing_invoice_grand(int $orderId): ?float
{
    $s = db()->prepare("SELECT grand_total FROM invoices WHERE order_id = :id AND type = 'billing' ORDER BY id DESC LIMIT 1");
    $s->execute(['id' => $orderId]);
    $row = $s->fetch();
    if (!$row || !isset($row['grand_total'])) {
        return null;
    }

    return (float)$row['grand_total'];
}

function payment_or_order_type(array $input): string {
    $inputType = (string)($input['type'] ?? '');
    if (in_array($inputType, ['purchase', 'billing'], true)) {
        return $inputType;
    }

    $invoiceId = isset($input['invoiceId']) ? (int)$input['invoiceId'] : null;
    if ($invoiceId) {
        $stmt = db()->prepare('SELECT type FROM invoices WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $invoiceId]);
        $row = $stmt->fetch();
        $resolved = (string)($row['type'] ?? '');
        if (in_array($resolved, ['purchase', 'billing'], true)) {
            return $resolved;
        }
    }

    $orderId = isset($input['orderId']) ? (int)$input['orderId'] : null;
    if ($orderId) {
        $stmt = db()->prepare('SELECT type FROM invoices WHERE order_id = :id ORDER BY id DESC LIMIT 1');
        $stmt->execute(['id' => $orderId]);
        $row = $stmt->fetch();
        $resolved = (string)($row['type'] ?? '');
        if (in_array($resolved, ['purchase', 'billing'], true)) {
            return $resolved;
        }
    }

    return 'billing';
}

/**
 * Insert one payment + matching ledger row. Caller may wrap in a DB transaction.
 *
 * @return array<string, mixed> Payment row from RETURNING *
 */
function insert_payment_and_ledger_row(int $userId, ?int $orderId, ?int $invoiceId, string $paymentType, float $payAmount, string $note): array
{
    ensure_table_exists('payments', 'Payments');
    if (($orderId === null || $orderId <= 0) && ($invoiceId === null || $invoiceId <= 0)) {
        throw new InvalidArgumentException('orderId or invoiceId is required for payment entry.');
    }
    if ($payAmount <= 0.00001) {
        throw new InvalidArgumentException('Payment amount must be greater than zero.');
    }
    if ($orderId !== null && $paymentType === 'purchase' && table_has_column('payments', 'payment_type')) {
        $grand = order_latest_purchase_invoice_grand($orderId);
        if ($grand !== null) {
            $net = order_net_purchase_paid_applied($orderId);
            if ($net + $payAmount > $grand + 0.01) {
                $remain = max(0.0, $grand - $net);
                throw new InvalidArgumentException(
                    'Total purchase payments for this order cannot exceed the purchase invoice (৳ ' . (string)round($grand) . '). Already recorded (net): ৳ ' . (string)round($net) . '. You can pay at most ৳ ' . (string)round($remain) . ' more.',
                );
            }
        }
    }
    if ($orderId !== null && $paymentType === 'billing' && table_has_column('payments', 'payment_type')) {
        $grand = order_latest_billing_invoice_grand($orderId);
        if ($grand !== null) {
            $net = order_net_billing_paid_applied($orderId);
            if ($net + $payAmount > $grand + 0.01) {
                $remain = max(0.0, $grand - $net);
                throw new InvalidArgumentException(
                    'Total billing payments for this order cannot exceed the billing invoice (৳ ' . (string)round($grand) . '). Already recorded (net): ৳ ' . (string)round($net) . '. You can pay at most ৳ ' . (string)round($remain) . ' more.',
                );
            }
        }
    }
    if (table_has_column('payments', 'payment_type')) {
        $stmt = db()->prepare('INSERT INTO payments (order_id, invoice_id, payment_type, amount, note, created_by) VALUES (:order, :invoice, :ptype, :amount, :note, :uid) RETURNING *');
        $stmt->execute([
            'order' => $orderId,
            'invoice' => $invoiceId,
            'ptype' => $paymentType,
            'amount' => $payAmount,
            'note' => $note,
            'uid' => $userId,
        ]);
    } else {
        $stmt = db()->prepare('INSERT INTO payments (order_id, invoice_id, amount, note, created_by) VALUES (:order, :invoice, :amount, :note, :uid) RETURNING *');
        $stmt->execute([
            'order' => $orderId,
            'invoice' => $invoiceId,
            'amount' => $payAmount,
            'note' => $note,
            'uid' => $userId,
        ]);
    }
    $payment = $stmt->fetch();
    if (!$payment || !isset($payment['id'])) {
        throw new RuntimeException('Payment insert did not return a row.');
    }
    $paymentDirection = $paymentType === 'purchase' ? 'debit' : 'credit';
    add_ledger(
        $orderId,
        $paymentType . '_payment',
        (float)$payment['amount'],
        $paymentDirection,
        'payment',
        (int)$payment['id']
    );

    return $payment;
}

/**
 * @return array<string, mixed> Adjustment row from RETURNING *
 */
function insert_adjustment_and_ledger_row(int $userId, int $orderId, string $type, float $adjAmount, string $reason): array
{
    if ($orderId <= 0) {
        throw new InvalidArgumentException('orderId is required for adjustment entry.');
    }
    if (!in_array($type, ['purchase', 'billing'], true)) {
        throw new InvalidArgumentException('Invalid adjustment type');
    }
    if ($adjAmount <= 0.00001) {
        throw new InvalidArgumentException('Adjustment amount must be greater than zero.');
    }
    if ($type === 'purchase' && table_has_column('payments', 'payment_type')) {
        $net = order_net_purchase_paid_applied($orderId);
        if ($adjAmount > $net + 0.01) {
            throw new InvalidArgumentException(
                'Purchase adjustment cannot exceed net purchase payments already recorded for this order (৳ ' . (string)round($net) . ').',
            );
        }
    }
    if ($type === 'billing' && table_has_column('payments', 'payment_type')) {
        $net = order_net_billing_paid_applied($orderId);
        if ($adjAmount > $net + 0.01) {
            throw new InvalidArgumentException(
                'Billing adjustment cannot exceed net billing payments already recorded for this order (৳ ' . (string)round($net) . ').',
            );
        }
    }
    $stmt = db()->prepare('INSERT INTO adjustments (order_id, type, amount, reason, created_by) VALUES (:order, :type, :amount, :reason, :uid) RETURNING *');
    $stmt->execute([
        'order' => $orderId,
        'type' => $type,
        'amount' => $adjAmount,
        'reason' => $reason,
        'uid' => $userId,
    ]);
    $adj = $stmt->fetch();
    if (!$adj || !isset($adj['id'])) {
        throw new RuntimeException('Adjustment insert did not return a row.');
    }
    $adjDirection = $type === 'purchase' ? 'credit' : 'debit';
    add_ledger(
        $orderId,
        $type . '_adjustment',
        (float)$adj['amount'],
        $adjDirection,
        'adjustment',
        (int)$adj['id']
    );

    return $adj;
}

/**
 * Resolve purchase unit + line total from order line JSON (camelCase or snake_case).
 * If line total is missing but unit and qty exist, derive total (same rules as frontend).
 *
 * @return array{unit: ?float, total: ?float}
 */
function order_line_purchase_prices(array $line): array
{
    $u = null;
    foreach (['unitPrice', 'unit_price'] as $k) {
        if (!array_key_exists($k, $line) || $line[$k] === '' || $line[$k] === null) {
            continue;
        }
        if (is_numeric($line[$k])) {
            $u = (float)$line[$k];
            break;
        }
    }
    $t = null;
    foreach (['lineTotal', 'line_total'] as $k) {
        if (!array_key_exists($k, $line) || $line[$k] === '' || $line[$k] === null) {
            continue;
        }
        if (is_numeric($line[$k])) {
            $t = (float)$line[$k];
            break;
        }
    }
    if ($t === null && $u !== null && $u > 0) {
        $kg = (float)($line['kg'] ?? 0);
        $gram = (float)($line['gram'] ?? 0);
        $piece = (float)($line['piece'] ?? 0);
        if ($piece > 0) {
            $t = round($u * $piece, 2);
        } else {
            $w = $kg + $gram / 1000.0;
            if ($w > 0) {
                $t = round($u * $w, 2);
            }
        }
    }

    return ['unit' => $u, 'total' => $t];
}

function upsert_item_price_history(int $orderId, array $line, ?array $actorUser): void {
    if (!$actorUser) return;
    $role = (string)($actorUser['role'] ?? '');
    if (!in_array($role, ['admin', 'moderator'], true)) return;
    $itemCode = trim((string)($line['itemId'] ?? $line['item_code'] ?? ''));
    if ($itemCode === '') return;
    $pr = order_line_purchase_prices($line);
    $unitPrice = $pr['unit'];
    if ($unitPrice === null) {
        return;
    }
    $lineTotal = $pr['total'];

    $catItemStmt = db()->prepare('SELECT id FROM catalog_items WHERE code = :code LIMIT 1');
    $catItemStmt->execute(['code' => $itemCode]);
    $catalogItem = $catItemStmt->fetch();
    if (!$catalogItem || !isset($catalogItem['id'])) return;

    $existingStmt = db()->prepare('SELECT id, new_price FROM item_price_histories WHERE order_id = :order AND item_code = :item LIMIT 1');
    $existingStmt->execute(['order' => $orderId, 'item' => $itemCode]);
    $existing = $existingStmt->fetch();

    if ($existing) {
        $upd = db()->prepare('UPDATE item_price_histories SET old_price = :old_price, new_price = :new_price, unit_price = :unit_price, line_total = :line_total, changed_by = :changed_by, effective_from = NOW(), updated_at = NOW() WHERE id = :id');
        $upd->execute([
            'id' => $existing['id'],
            'old_price' => isset($existing['new_price']) ? (float)$existing['new_price'] : null,
            'new_price' => $unitPrice,
            'unit_price' => $unitPrice,
            'line_total' => $lineTotal,
            'changed_by' => $actorUser['id'] ?? null,
        ]);
        return;
    }

    $ins = db()->prepare('INSERT INTO item_price_histories (catalog_item_id, order_id, item_code, old_price, new_price, unit_price, line_total, changed_by, effective_from, created_at, updated_at) VALUES (:catalog_item_id, :order_id, :item_code, :old_price, :new_price, :unit_price, :line_total, :changed_by, NOW(), NOW(), NOW())');
    $ins->execute([
        'catalog_item_id' => $catalogItem['id'],
        'order_id' => $orderId,
        'item_code' => $itemCode,
        'old_price' => null,
        'new_price' => $unitPrice,
        'unit_price' => $unitPrice,
        'line_total' => $lineTotal,
        'changed_by' => $actorUser['id'] ?? null,
    ]);
}

function replace_order_lines(int $orderId, array $lines, ?array $actorUser = null): void {
    db()->prepare('DELETE FROM order_lines WHERE order_id = :id')->execute(['id' => $orderId]);
    if (!$lines) return;
    $ins = db()->prepare('INSERT INTO order_lines (order_id, serial, category_code, item_code, item_name_bn, item_name_en, kg, gram, piece, instructions, unit_price, line_total, created_at, updated_at) VALUES (:order_id, :serial, :category_code, :item_code, :item_name_bn, :item_name_en, :kg, :gram, :piece, :instructions, :unit_price, :line_total, NOW(), NOW())');
    foreach ($lines as $idx => $line) {
        if (!is_array($line)) continue;
        $pr = order_line_purchase_prices($line);
        $cat = (string)($line['categoryId'] ?? $line['category_code'] ?? '');
        $item = (string)($line['itemId'] ?? $line['item_code'] ?? '');
        $ins->execute([
            'order_id' => $orderId,
            'serial' => (int)($line['serial'] ?? ($idx + 1)),
            'category_code' => $cat,
            'item_code' => $item,
            'item_name_bn' => (string)($line['itemNameBn'] ?? $line['item_name_bn'] ?? ''),
            'item_name_en' => (string)($line['itemNameEn'] ?? $line['item_name_en'] ?? ''),
            'kg' => (float)($line['kg'] ?? 0),
            'gram' => (float)($line['gram'] ?? 0),
            'piece' => (float)($line['piece'] ?? 0),
            'instructions' => isset($line['instructions']) ? (string)$line['instructions'] : '',
            'unit_price' => $pr['unit'],
            'line_total' => $pr['total'],
        ]);
        $normLine = array_merge($line, [
            'categoryId' => $cat,
            'itemId' => $item,
            'unitPrice' => $pr['unit'],
            'lineTotal' => $pr['total'],
        ]);
        upsert_item_price_history($orderId, $normLine, $actorUser);
    }
}

function delivery_start_parts(string $fallbackDate, string $deliveryTimeField): array {
    $date = $fallbackDate;
    $time = '10:00';
    $window = trim($deliveryTimeField);
    if ($window === '') return [$date, $time, null];

    if (preg_match('/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})\s*(?:to|–|—|-)\s*/i', $window, $m) === 1) {
        return [$m[1], $m[2], $window];
    }
    if (preg_match('/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/', $window, $m) === 1) {
        return [$m[1], $m[2], $window];
    }
    if (preg_match('/^\d{2}:\d{2}$/', $window) === 1) {
        return [$date, $window, $window];
    }
    return [$date, $time, $window];
}

/**
 * Billing cycle for statement bucketing. Configure via .env (see backend/.env.example).
 *
 * @return array{cycleDays: int, weekStartDay: int, label: string}
 */
function billing_cycle_config(): array {
    return (new \App\Services\Billing\BillingCycleConfigService())->toArray();
}
/**
 * Build purchase invoice subtotal + snapshot payload from read_order_lines() rows.
 *
 * @param array<int, array<string, mixed>> $lines
 * @return array{subtotal: float, snapshotJson: string}
 */
function purchase_invoice_totals_snapshot(array $lines): array
{
    $subtotal = 0.0;
    $snapshotLines = [];
    foreach ($lines as $line) {
        $lineTotal = (float)($line['lineTotal'] ?? 0);
        $subtotal += $lineTotal;
        $snapshotLines[] = [
            'id' => (string)($line['id'] ?? ''),
            'serial' => (int)($line['serial'] ?? 0),
            'categoryId' => (string)($line['categoryId'] ?? ''),
            'itemId' => (string)($line['itemId'] ?? ''),
            'itemNameBn' => (string)($line['itemNameBn'] ?? ''),
            'itemNameEn' => (string)($line['itemNameEn'] ?? ''),
            'kg' => (string)($line['kg'] ?? ''),
            'gram' => (string)($line['gram'] ?? ''),
            'piece' => (string)($line['piece'] ?? ''),
            'unitPriceBeforeMarkup' => isset($line['unitPrice']) ? (float)$line['unitPrice'] : null,
            'lineTotalBeforeMarkup' => $lineTotal,
            'markupPercent' => 0,
            'markupAmount' => 0,
            'unitPriceAfterMarkup' => isset($line['unitPrice']) ? (float)$line['unitPrice'] : null,
            'lineTotalAfterMarkup' => $lineTotal,
            'profitLossAmount' => 0,
        ];
    }
    $snap = [
        'markupMode' => 'none',
        'markupPercent' => 0,
        'purchaseSubtotal' => $subtotal,
        'billingSubtotal' => $subtotal,
        'profitLossTotal' => 0,
        'lines' => $snapshotLines,
    ];

    return ['subtotal' => $subtotal, 'snapshotJson' => json_encode($snap)];
}

/** Refresh latest purchase invoice totals/snapshot after order line cost edits (before billing). */
function sync_latest_purchase_invoice_from_order_lines(int $orderId): void
{
    if (!order_has_invoice_type($orderId, 'purchase')) {
        return;
    }
    $stmt = db()->prepare("SELECT id FROM invoices WHERE order_id = :oid AND type = 'purchase' ORDER BY id DESC LIMIT 1");
    $stmt->execute(['oid' => $orderId]);
    $inv = $stmt->fetch();
    if (!$inv) {
        return;
    }
    $lines = read_order_lines($orderId);
    $pack = purchase_invoice_totals_snapshot($lines);
    $upd = db()->prepare('UPDATE invoices SET subtotal = :s, grand_total = :g, snapshot = :snap, updated_at = NOW() WHERE id = :id');
    $upd->execute([
        's' => $pack['subtotal'],
        'g' => $pack['subtotal'],
        'snap' => $pack['snapshotJson'],
        'id' => (int)$inv['id'],
    ]);
}
