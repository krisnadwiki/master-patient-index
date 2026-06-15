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

if (empty($_SESSION['access_token'])) {
    json_response(401, ['error' => 'Please generate token first']);
}

$access_token = $_SESSION['access_token'];
$env = isset($_SESSION['env']) ? $_SESSION['env'] : ENV_PRODUCTION;
$keyword = sanitize_input($_POST['keyword'] ?? '');
$type = sanitize_input($_POST['type'] ?? 'nik');

if (empty($keyword)) {
    json_response(400, ['error' => 'Keyword is required']);
}

write_log("----------------------------------------");
write_log("[*] GET Cari Pasien ($type: $keyword)...");

if ($type === 'ihs') {
    $result = satusehat_get_patient_by_id($access_token, $keyword, $env);
    if ($result['success']) {
        // Mock the bundle structure so main.js search renderer can parse it easily
        $bundle = [
            'total' => 1,
            'entry' => [
                ['resource' => $result['response']]
            ]
        ];
        json_response(200, ['success' => true, 'total' => 1, 'response' => $bundle]);
    } else {
        json_response(400, ['success' => false, 'error' => 'SEARCH PATIENT FAILED', 'details' => $result]);
    }
} else {
    $result = satusehat_search_patient_by_nik($access_token, $keyword, $env);
    if ($result['success']) {
        json_response(200, ['success' => true, 'total' => $result['total'], 'response' => $result['response']]);
    } else {
        json_response(400, ['success' => false, 'error' => 'SEARCH PATIENT FAILED', 'details' => $result]);
    }
}
