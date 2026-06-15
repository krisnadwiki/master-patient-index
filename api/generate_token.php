<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/satusehat.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method Not Allowed']);
}

$csrf_token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
if (!verify_csrf_token($csrf_token)) {
    json_response(403, ['error' => 'Invalid CSRF token']);
}

$client_id = isset($_POST['client_id']) ? sanitize_input($_POST['client_id']) : '';
$client_secret = isset($_POST['client_secret']) ? sanitize_input($_POST['client_secret']) : '';
$env = isset($_POST['env']) ? sanitize_input($_POST['env']) : ENV_PRODUCTION;

if (empty($client_id) || empty($client_secret)) {
    json_response(400, ['error' => 'Client ID and Client Secret are required']);
}

$result = satusehat_generate_token($client_id, $client_secret, $env);

if ($result['success']) {
    $_SESSION['access_token'] = $result['access_token'];
    $_SESSION['env'] = $env;
    json_response(200, ['success' => true, 'message' => 'Token generated successfully', 'token_preview' => substr($result['access_token'], 0, 20) . '...', 'full_token' => $result['access_token']]);
} else {
    json_response(400, ['success' => false, 'error' => 'Failed to generate token', 'details' => $result]);
}
