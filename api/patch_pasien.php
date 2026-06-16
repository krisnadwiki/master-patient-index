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

$ihs = sanitize_input($_POST['p_ihs'] ?? '');
if (empty($ihs)) {
    json_response(400, ['error' => 'IHS Number target is required for PATCH']);
}

write_log("----------------------------------------");
write_log("[*] PATCH Update Data Pasien (IHS: $ihs)...");

// GET existing patient data for validation
$existing_patient_res = satusehat_search_patient_by_id($access_token, $ihs, $env);
if (!$existing_patient_res['success']) {
    json_response(400, ['error' => 'Gagal mengambil data pasien existing untuk validasi PATCH', 'details' => $existing_patient_res]);
}
$existing_patient = $existing_patient_res['response'];

$patches = [];

// Explicit Validations from User Input
$nama_existing = sanitize_input($_POST['p_nama_existing'] ?? '');
if (!empty($nama_existing)) {
    $patches[] = [
        "op" => "test",
        "path" => "/name",
        "value" => [
            [
                "use" => "official",
                "text" => $nama_existing
            ]
        ]
    ];
}

$tgl_existing = sanitize_input($_POST['p_tgl_existing'] ?? '');
if (!empty($tgl_existing)) {
    $patches[] = [
        "op" => "test",
        "path" => "/birthDate",
        "value" => $tgl_existing
    ];
}

$jk_existing = sanitize_input($_POST['p_jk_existing'] ?? '');
if (!empty($jk_existing)) {
    $jk_ext_val = ($jk_existing === 'Laki-laki') ? 'male' : 'female';
    $patches[] = [
        "op" => "test",
        "path" => "/gender",
        "value" => $jk_ext_val
    ];
}

// Helper function to add patch operation
function add_patch(&$patches, $path, $value, $test_value = null) {
    if ($test_value !== null) {
        $patches[] = [
            "op" => "test",
            "path" => $path,
            "value" => $test_value
        ];
    }
    $patches[] = [
        "op" => "replace",
        "path" => $path,
        "value" => $value
    ];
}

// 1. Name Update
$nama = sanitize_input($_POST['p_nama'] ?? '');
if (!empty($nama)) {
    add_patch($patches, "/name", [
        [
            "use" => "official",
            "text" => $nama
        ]
    ]);
}

// 2. Gender Update
$jk = sanitize_input($_POST['p_jk'] ?? '');
if (!empty($jk)) {
    $jk_val = ($jk === 'Laki-laki') ? 'male' : 'female';
    add_patch($patches, "/gender", $jk_val);
}

// 3. BirthDate Update
$tgl = sanitize_input($_POST['p_tgl'] ?? '');
if (!empty($tgl)) {
    add_patch($patches, "/birthDate", $tgl);
}

// 4. MaritalStatus
$marital = sanitize_input($_POST['p_marital'] ?? '');
if (!empty($marital)) {
    $maritalText = "Single";
    if ($marital === "M") $maritalText = "Married";
    if ($marital === "D") $maritalText = "Divorced";
    if ($marital === "W") $maritalText = "Widowed";
    
    // We can just replace MaritalStatus
    add_patch($patches, "/maritalStatus", [
        "coding" => [
            [
                "system" => "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                "code" => $marital,
                "display" => $maritalText
            ]
        ],
        "text" => $maritalText
    ]);
}

// 5. Identifier (NIK)
$nik = sanitize_input($_POST['p_nik'] ?? '');
if (!empty($nik)) {
    // We just replace identifier completely
    add_patch($patches, "/identifier", [
        [
            "system" => "https://fhir.kemkes.go.id/id/nik",
            "use" => "official",
            "value" => $nik
        ],
        [
            "system" => "https://fhir.kemkes.go.id/id/ihs-number",
            "use" => "official",
            "value" => $ihs
        ]
    ]);
}

// 6. Address
$alamat = sanitize_input($_POST['p_alamat'] ?? '');
$prov = sanitize_input($_POST['p_prov'] ?? '');
$kota = sanitize_input($_POST['p_kota'] ?? '');
$kec = sanitize_input($_POST['p_kec'] ?? '');
$desa = sanitize_input($_POST['p_desa'] ?? '');
$rt = sanitize_input($_POST['p_rt'] ?? '');
$rw = sanitize_input($_POST['p_rw'] ?? '');

if (!empty($alamat) || !empty($prov)) {
    $addressObj = [
        "use" => "home",
        "country" => "ID"
    ];
    
    if (!empty($alamat)) {
        $addressObj["line"] = [$alamat];
    }
    
    $adminCodeExt = [];
    if (!empty($prov)) $adminCodeExt[] = ["url" => "province", "valueCode" => $prov];
    if (!empty($kota)) $adminCodeExt[] = ["url" => "city", "valueCode" => $kota];
    if (!empty($kec)) $adminCodeExt[] = ["url" => "district", "valueCode" => $kec];
    if (!empty($desa)) $adminCodeExt[] = ["url" => "village", "valueCode" => $desa];
    if (!empty($rt)) $adminCodeExt[] = ["url" => "rt", "valueCode" => $rt];
    if (!empty($rw)) $adminCodeExt[] = ["url" => "rw", "valueCode" => $rw];

    if (!empty($adminCodeExt)) {
        $addressObj["extension"][] = [
            "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
            "extension" => $adminCodeExt
        ];
    }
    
    add_patch($patches, "/address", [$addressObj]);
}

// 7. Kewarganegaraan & Tempat Lahir
$wn = sanitize_input($_POST['p_wn'] ?? '');
$tempat = sanitize_input($_POST['p_tempat'] ?? '');

if (!empty($wn) || !empty($tempat)) {
    $extensions = [];
    
    // We will just replace the whole extension array for Patient if provided
    // To do this properly without deleting existing extensions, we should ideally fetch existing extensions
    // and merge them. But for simplicity, we'll append or just use what's provided.
    // Let's just merge with existing extensions from $existing_patient
    $existing_extensions = $existing_patient['extension'] ?? [];
    
    // Filter out old birthPlace and citizenshipStatus
    $new_extensions = [];
    foreach ($existing_extensions as $ext) {
        if ($ext['url'] !== 'https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace' && 
            $ext['url'] !== 'https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus') {
            $new_extensions[] = $ext;
        }
    }
    
    if (!empty($tempat)) {
        $new_extensions[] = [
            "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace",
            "valueAddress" => [
                "city" => $tempat,
                "country" => "ID"
            ]
        ];
    }
    
    if (!empty($wn)) {
        $new_extensions[] = [
            "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus",
            "valueCode" => $wn
        ];
    }
    
    if (!empty($new_extensions)) {
        add_patch($patches, "/extension", $new_extensions);
    }
}

if (empty($patches)) {
    json_response(400, ['error' => 'No data provided to patch.']);
}

$result = satusehat_patch_patient($access_token, $ihs, $patches, $env);

if ($result['success']) {
    json_response(200, ['success' => true, 'message' => 'PATIENT PATCH SUCCESS', 'response' => $result['response'], 'request_body' => $patches]);
} else {
    json_response(400, ['success' => false, 'error' => 'PATIENT PATCH FAILED', 'details' => $result, 'request_body' => $patches]);
}
