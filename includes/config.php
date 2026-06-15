<?php
session_start();

define('ENV_STAGING', 'Staging');
define('ENV_PRODUCTION', 'Production');

define('BASE_URL_STAGING', 'https://api-satusehat.stg.dto.kemkes.go.id');
define('BASE_URL_PRODUCTION', 'https://api-satusehat.kemkes.go.id');

// Directory for logs
define('LOG_DIR', __DIR__ . '/../logs');
if (!is_dir(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}
define('LOG_FILE', LOG_DIR . '/app.log');

// Load .env if exists
function load_env() {
    $env_file = __DIR__ . '/../.env';
    if (file_exists($env_file)) {
        $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            list($name, $value) = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
                putenv(sprintf('%s=%s', $name, $value));
                $_ENV[$name] = $value;
                $_SERVER[$name] = $value;
            }
        }
    }
}
load_env();

// Set secure session parameters if not running locally for real deployment
// but for localhost development we keep it relaxed.
// session_set_cookie_params([
//     'lifetime' => 3600,
//     'path' => '/',
//     'domain' => $_SERVER['HTTP_HOST'],
//     'secure' => isset($_SERVER['HTTPS']),
//     'httponly' => true,
//     'samesite' => 'Strict'
// ]);
