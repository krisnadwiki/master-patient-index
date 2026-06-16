<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/logger.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['success' => false, 'error' => 'Method Not Allowed']);
}

$csrf_token = isset($_POST['csrf_token']) ? $_POST['csrf_token'] : '';
if (!verify_csrf_token($csrf_token)) {
    json_response(403, ['success' => false, 'error' => 'Invalid CSRF token']);
}

$url_simgos  = getenv('URL_SIMGOS') ?: '';
$x_username  = getenv('X_USERNAME') ?: '';
$x_password  = getenv('X_PASSWORD') ?: '';

if (empty($url_simgos) || empty($x_username) || empty($x_password)) {
    json_response(400, ['success' => false, 'error' => 'Kredensial SIMGos belum lengkap. Pastikan URL_SIMGOS, X_USERNAME, dan X_PASSWORD sudah diatur di file .env.']);
}

$norm       = sanitize_input($_POST['norm'] ?? '');
$tgl_lahir  = sanitize_input($_POST['tgl_lahir'] ?? '');

if (empty($norm) || empty($tgl_lahir)) {
    json_response(400, ['success' => false, 'error' => 'No. RM dan Tanggal Lahir wajib diisi.']);
}

// Strip leading zeros for the API call (SIMGos stores NORM without leading zeros)
$norm_clean = ltrim($norm, '0') ?: '0';

write_log("----------------------------------------");
write_log("[*] SIMGos Get Pasien...");
write_log("    NORM: {$norm_clean}, Tgl Lahir: {$tgl_lahir}");

// ─── Step 1: Get Token ───────────────────────────────────────────────────────
$token_url = rtrim($url_simgos, '/') . '/webservice/registrasionline/bpjs/getToken';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $token_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'GET',
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_HTTPHEADER     => [
        'x-username: ' . $x_username,
        'x-password: ' . $x_password,
        'Content-Type: application/json',
    ],
]);

$token_response = curl_exec($ch);
$token_http     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$token_error    = curl_error($ch);
curl_close($ch);

if ($token_response === false) {
    write_log("[!] SIMGos getToken cURL Error: " . $token_error);
    json_response(500, ['success' => false, 'error' => 'SIMGos getToken gagal: ' . $token_error]);
}

$token_data = json_decode($token_response, true);

if ($token_http !== 200
    || !isset($token_data['metadata']['code'])
    || $token_data['metadata']['code'] !== 200
    || empty($token_data['response']['token'])
) {
    write_log("[X] SIMGos getToken FAILED. HTTP {$token_http}\n{$token_response}");
    json_response(400, [
        'success' => false,
        'error'   => 'SIMGos getToken gagal.',
        'details' => $token_data ?: ['http_code' => $token_http, 'raw' => $token_response],
    ]);
}

$simgos_token = $token_data['response']['token'];
write_log("[✓] SIMGos Token obtained.");

// ─── Step 2: Get Pasien ──────────────────────────────────────────────────────
$pasien_url = rtrim($url_simgos, '/')
    . '/webservice/registrasionline/plugins/getPasien'
    . '?NORM=' . urlencode($norm_clean)
    . '&TANGGAL_LAHIR=' . urlencode($tgl_lahir);

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $pasien_url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING       => '',
    CURLOPT_MAXREDIRS      => 10,
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST  => 'GET',
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_HTTPHEADER     => [
        'x-token: '    . $simgos_token,
        'x-username: ' . $x_username,
    ],
]);

$pasien_response = curl_exec($ch);
$pasien_http     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$pasien_error    = curl_error($ch);
curl_close($ch);

if ($pasien_response === false) {
    write_log("[!] SIMGos getPasien cURL Error: " . $pasien_error);
    json_response(500, ['success' => false, 'error' => 'SIMGos getPasien gagal: ' . $pasien_error]);
}

$pasien_data = json_decode($pasien_response, true);

if ($pasien_http !== 200) {
    write_log("[X] SIMGos getPasien FAILED. HTTP {$pasien_http}\n{$pasien_response}");
    json_response(400, [
        'success' => false,
        'error'   => 'SIMGos getPasien gagal.',
        'details' => $pasien_data ?: ['http_code' => $pasien_http, 'raw' => $pasien_response],
    ]);
}

// Check if patient found
if (empty($pasien_data['success']) || empty($pasien_data['data']) || !is_array($pasien_data['data'])) {
    write_log("[X] SIMGos: Pasien tidak ditemukan untuk NORM {$norm_clean}.");
    json_response(404, [
        'success' => false,
        'error'   => 'Pasien tidak ditemukan di SIMGos untuk No. RM tersebut.',
        'raw'     => $pasien_data,
    ]);
}

$patient = $pasien_data['data'][0];

// ─── Extract fields ──────────────────────────────────────────────────────────
// NIK from KARTUIDENTITAS where JENIS=1
$nik = '';
if (!empty($patient['KARTUIDENTITAS']) && is_array($patient['KARTUIDENTITAS'])) {
    foreach ($patient['KARTUIDENTITAS'] as $kartu) {
        if (isset($kartu['JENIS']) && $kartu['JENIS'] === '1') {
            $nik = $kartu['NOMOR'] ?? '';
            break;
        }
    }
}

// Nama
$nama = $patient['NAMA'] ?? '';

// Tanggal Lahir — strip time portion (API returns "1999-11-26 00:00:00")
$tgl_lahir_raw = $patient['TANGGAL_LAHIR'] ?? '';
$tgl_lahir_formatted = '';
if (!empty($tgl_lahir_raw)) {
    $parts = explode(' ', trim($tgl_lahir_raw));
    $tgl_lahir_formatted = $parts[0]; // "1999-11-26"
}

// Jenis Kelamin: 1=Laki-laki, 2=Perempuan
$jk_raw = $patient['JENIS_KELAMIN'] ?? '';
$jk = '';
if ($jk_raw === '1') {
    $jk = 'Laki-laki';
} elseif ($jk_raw === '2') {
    $jk = 'Perempuan';
}

write_log("[✓] SIMGos Pasien ditemukan: {$nama}, NIK: {$nik}, JK: {$jk}, Tgl: {$tgl_lahir_formatted}");

json_response(200, [
    'success' => true,
    'data'    => [
        'nik'       => $nik,
        'nama'      => $nama,
        'tgl_lahir' => $tgl_lahir_formatted,
        'jk'        => $jk,
        'raw'       => $patient,
    ],
]);
