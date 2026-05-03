<?php

declare(strict_types=1);

namespace App\Database;

use PDO;

/**
 * Single PDO connection used by the legacy API (same settings as former public/index.php db()).
 */
final class LegacyPdo
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        $dsn = sprintf(
            'pgsql:host=%s;port=%s;dbname=%s',
            \App\Support\LegacyEnv::get('DB_HOST', '127.0.0.1'),
            \App\Support\LegacyEnv::get('DB_PORT', '5432'),
            \App\Support\LegacyEnv::get('DB_DATABASE', 'gom'),
        );
        self::$pdo = new PDO(
            $dsn,
            \App\Support\LegacyEnv::get('DB_USERNAME', 'gom'),
            \App\Support\LegacyEnv::get('DB_PASSWORD', 'gom_secret'),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ],
        );

        return self::$pdo;
    }
}
