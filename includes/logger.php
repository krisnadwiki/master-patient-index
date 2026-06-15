<?php
require_once __DIR__ . '/config.php';

function write_log($message) {
    $date = date('Y-m-d H:i:s');
    $log_entry = "[$date] $message" . PHP_EOL;
    file_put_contents(LOG_FILE, $log_entry, FILE_APPEND);
}
