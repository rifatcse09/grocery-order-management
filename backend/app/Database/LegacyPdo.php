<?php

declare(strict_types=1);

namespace App\Database;

use PDO;

/**
 * Single PDO connection used by the legacy API (same settings as former public/index.php db()).
 *
 * Reads DB_* from .env via LegacyEnv — keep the same values as Laravel's database config.
 * Default: MySQL. Use DB_CONNECTION=sqlite for a local file DB.
 */
final class LegacyPdo
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }
        $driver = strtolower(\App\Support\LegacyEnv::get('DB_CONNECTION', 'mysql'));
        if ($driver === 'sqlite') {
            $path = \App\Support\LegacyEnv::get('DB_DATABASE', dirname(__DIR__, 2).'/database/database.sqlite');
            $full = str_starts_with($path, '/') ? $path : dirname(__DIR__, 2).'/database/'.$path;
            self::$pdo = new PDO('sqlite:'.$full, null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);

            return self::$pdo;
        }

        // Inside Docker, backend/.env often has DB_HOST=127.0.0.1 for host-side dev; that points at this
        // container (nothing on 3306) → SQLSTATE[HY000] [2002] Connection refused. Compose service name is `mysql`.
        $host = \App\Support\LegacyEnv::get('DB_HOST', '127.0.0.1');
        if (is_file('/.dockerenv') && in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
            $host = 'mysql';
        }
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $host,
            \App\Support\LegacyEnv::get('DB_PORT', '3306'),
            \App\Support\LegacyEnv::get('DB_DATABASE', 'gom'),
        );
        self::$pdo = new PDO(
            $dsn,
            \App\Support\LegacyEnv::get('DB_USERNAME', 'gom'),
            \App\Support\LegacyEnv::get('DB_PASSWORD', ''),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
            ],
        );

        return self::$pdo;
    }
}
