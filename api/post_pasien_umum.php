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

write_log("----------------------------------------");
write_log("[*] POST Registrasi Umum...");

// Base inputs
$u_nik = sanitize_input($_POST['u_nik'] ?? '');
$u_paspor = sanitize_input($_POST['u_paspor'] ?? '');
$u_kk = sanitize_input($_POST['u_kk'] ?? '');
$u_nama = sanitize_input($_POST['u_nama'] ?? '');
$u_tgl = sanitize_input($_POST['u_tgl'] ?? '');
$u_tempat = sanitize_input($_POST['u_tempat'] ?? '');
$u_jk = sanitize_input($_POST['u_jk'] ?? '');
$u_wn = sanitize_input($_POST['u_wn'] ?? 'WNI');
$u_marital = sanitize_input($_POST['u_marital'] ?? 'S'); // M, S, D, W
$u_phone_mobile = sanitize_input($_POST['u_phone_mobile'] ?? '');
$u_phone_home = sanitize_input($_POST['u_phone_home'] ?? '');
$u_email = sanitize_input($_POST['u_email'] ?? '');
$u_contact_name = sanitize_input($_POST['u_contact_name'] ?? '');
$u_contact_phone = sanitize_input($_POST['u_contact_phone'] ?? '');

$u_kembar = sanitize_input($_POST['u_kembar'] ?? 'Tunggal');
$u_urutan = sanitize_input($_POST['u_urutan'] ?? '');

$u_alamat = sanitize_input($_POST['u_alamat'] ?? '');
$u_prov = sanitize_input($_POST['u_prov'] ?? '');
$u_kota = sanitize_input($_POST['u_kota'] ?? '');
$u_kec = sanitize_input($_POST['u_kec'] ?? '');
$u_desa = sanitize_input($_POST['u_desa'] ?? '');
$u_rt = sanitize_input($_POST['u_rt'] ?? '');
$u_rw = sanitize_input($_POST['u_rw'] ?? '');

// Validate Kode Kemendagri
if (!empty($u_prov) && !preg_match('/^\d{2}$/', $u_prov)) json_response(400, ['error' => 'Kode Provinsi harus 2 digit angka']);
if (!empty($u_kota) && !preg_match('/^\d{4}$/', $u_kota)) json_response(400, ['error' => 'Kode Kota/Kab harus 4 digit angka']);
if (!empty($u_kec) && !preg_match('/^\d{6}$/', $u_kec)) json_response(400, ['error' => 'Kode Kecamatan harus 6 digit angka']);
if (!empty($u_desa) && !preg_match('/^\d{10}$/', $u_desa)) json_response(400, ['error' => 'Kode Desa harus 10 digit angka']);

// --- SEARCH NIK FIRST ---
write_log("[*] Verifikasi NIK ke SATUSEHAT sebelum POST...");
$search_result = satusehat_search_patient_by_nik($access_token, $u_nik, $env);
if ($search_result['success'] && isset($search_result['total']) && $search_result['total'] > 0) {
    $ihs_number = $search_result['response']['entry'][0]['resource']['id'] ?? 'Unknown';
    write_log("[i] Pasien sudah terdaftar. IHS: $ihs_number");
    json_response(200, [
        'success' => true,
        'message' => 'Pasien sudah terdaftar di SATUSEHAT (Data ditarik otomatis).',
        'id' => $ihs_number,
        'existing' => true,
        'response' => $search_result['response']
    ]);
}
write_log("[i] NIK belum terdaftar. Melanjutkan proses POST Create Patient...");

$jk = ($u_jk === 'Laki-laki') ? 'male' : 'female';

// Construct Marital Status Text
$maritalText = "Single";
if ($u_marital === "M") $maritalText = "Married";
if ($u_marital === "D") $maritalText = "Divorced";
if ($u_marital === "W") $maritalText = "Widowed";

$payload = [
    "resourceType" => "Patient",
    "meta" => [
        "profile" => ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"]
    ],
    "identifier" => [
        [
            "use" => "official",
            "system" => "https://fhir.kemkes.go.id/id/nik",
            "value" => $u_nik
        ]
    ],
    "active" => true,
    "name" => [
        [
            "use" => "official",
            "text" => $u_nama
        ]
    ],
    "telecom" => [],
    "gender" => $jk,
    "birthDate" => $u_tgl,
    "deceasedBoolean" => false,
    "address" => [],
    "maritalStatus" => [
        "coding" => [
            [
                "system" => "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                "code" => $u_marital,
                "display" => $maritalText
            ]
        ],
        "text" => $maritalText
    ],
    "contact" => [],
    "communication" => [
        [
            "language" => [
                "coding" => [
                    [
                        "system" => "urn:ietf:bcp:47",
                        "code" => "id-ID",
                        "display" => "Indonesian"
                    ]
                ],
                "text" => "Indonesian"
            ],
            "preferred" => true
        ]
    ],
    "extension" => [
        [
            "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/citizenshipStatus",
            "valueCode" => $u_wn
        ]
    ]
];

// Address
$addressObj = [
    "use" => "home",
    "line" => [$u_alamat],
    "country" => "ID",
    "extension" => []
];

$adminCodeExt = [];
if (!empty($u_prov)) $adminCodeExt[] = ["url" => "province", "valueCode" => $u_prov];
if (!empty($u_kota)) $adminCodeExt[] = ["url" => "city", "valueCode" => $u_kota];
if (!empty($u_kec)) $adminCodeExt[] = ["url" => "district", "valueCode" => $u_kec];
if (!empty($u_desa)) $adminCodeExt[] = ["url" => "village", "valueCode" => $u_desa];
if (!empty($u_rt)) $adminCodeExt[] = ["url" => "rt", "valueCode" => $u_rt];
if (!empty($u_rw)) $adminCodeExt[] = ["url" => "rw", "valueCode" => $u_rw];

if (!empty($adminCodeExt)) {
    $addressObj["extension"][] = [
        "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
        "extension" => $adminCodeExt
    ];
}

if (empty($addressObj["extension"])) unset($addressObj["extension"]);
$payload["address"][] = $addressObj;

// Identifiers
if (!empty($u_paspor)) {
    $payload["identifier"][] = ["use" => "official", "system" => "https://fhir.kemkes.go.id/id/paspor", "value" => $u_paspor];
}
if (!empty($u_kk)) {
    $payload["identifier"][] = ["use" => "official", "system" => "https://fhir.kemkes.go.id/id/kk", "value" => $u_kk];
}

// Telecom
if (!empty($u_phone_mobile)) {
    $payload["telecom"][] = ["system" => "phone", "value" => $u_phone_mobile, "use" => "mobile"];
}
if (!empty($u_phone_home)) {
    $payload["telecom"][] = ["system" => "phone", "value" => $u_phone_home, "use" => "home"];
}
if (!empty($u_email)) {
    $payload["telecom"][] = ["system" => "email", "value" => $u_email, "use" => "home"];
}
if (empty($payload["telecom"])) unset($payload["telecom"]);

// Contact
if (!empty($u_contact_name) || !empty($u_contact_phone)) {
    $contactObj = [
        "relationship" => [
            ["coding" => [["system" => "http://terminology.hl7.org/CodeSystem/v2-0131", "code" => "C"]]]
        ],
        "name" => ["use" => "official", "text" => $u_contact_name ?: "Unknown"]
    ];
    if (!empty($u_contact_phone)) {
        $contactObj["telecom"] = [["system" => "phone", "value" => $u_contact_phone, "use" => "mobile"]];
    }
    $payload["contact"][] = $contactObj;
}
if (empty($payload["contact"])) unset($payload["contact"]);

// BirthPlace
if (!empty($u_tempat)) {
    array_unshift($payload["extension"], [
        "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace",
        "valueAddress" => ["city" => $u_tempat, "country" => "ID"]
    ]);
}

if ($u_kembar === "Tunggal") {
    $payload["multipleBirthInteger"] = 0; // Using 0 as shown in example instead of boolean false
} else {
    $urutan = intval($u_urutan);
    if ($urutan <= 0) $urutan = 1;
    $payload["multipleBirthInteger"] = $urutan;
}

$result = satusehat_post_patient($access_token, $payload, $env);

if ($result['success']) {
    json_response(200, ['success' => true, 'message' => 'POST PATIENT SUCCESS', 'id' => $result['id']]);
} else {
    json_response(400, ['success' => false, 'error' => 'POST PATIENT FAILED', 'details' => $result]);
}
