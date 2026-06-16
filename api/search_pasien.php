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
$type = sanitize_input($_POST['type'] ?? 'identitas');

write_log("----------------------------------------");
write_log("[*] GET Cari Pasien ($type)...");

if ($type === 'ihs') {
    $ihs = sanitize_input($_POST['s_ihs'] ?? '');
    if (empty($ihs)) json_response(400, ['error' => 'Nomor IHS harus diisi']);
    
    $result = satusehat_search_patient_by_id($access_token, $ihs, $env);
    if ($result['success']) {
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
} else if ($type === 'bayi') {
    $nik_ibu = sanitize_input($_POST['s_nik_ibu'] ?? '');
    $tgl_bayi = sanitize_input($_POST['s_tgl_bayi'] ?? '');
    if (empty($nik_ibu)) {
        json_response(400, ['error' => 'NIK Ibu harus diisi']);
    }
    $result = satusehat_search_patient_bayi($access_token, $nik_ibu, $tgl_bayi, $env);
    if ($result['success']) {
        json_response(200, ['success' => true, 'total' => $result['total'], 'response' => $result['response']]);
    } else {
        json_response(400, ['success' => false, 'error' => 'SEARCH PATIENT FAILED', 'details' => $result]);
    }
} else if ($type === 'identitas') {
    $nik = sanitize_input($_POST['s_nik'] ?? '');
    $nama = sanitize_input($_POST['s_nama'] ?? '');
    $tgl = sanitize_input($_POST['s_tgl'] ?? '');
    $jk = sanitize_input($_POST['s_jk'] ?? '');
    
    if (empty($nik) && (empty($nama) || empty($tgl) || empty($jk))) {
        json_response(400, ['error' => 'Kombinasi pencarian tidak valid. Harus NIK saja, atau (Nama + Tgl Lahir + Gender)']);
    }

    $jk_val = '';
    if (!empty($jk)) {
        $jk_val = ($jk === 'Laki-laki') ? 'male' : 'female';
    }

    $result = satusehat_search_patient_identitas($access_token, $nik, $nama, $tgl, $jk_val, $env);
    if ($result['success']) {
        json_response(200, ['success' => true, 'total' => $result['total'], 'response' => $result['response']]);
    } else {
        json_response(400, ['success' => false, 'error' => 'SEARCH PATIENT FAILED', 'details' => $result]);
    }
}
