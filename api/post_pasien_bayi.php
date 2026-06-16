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
write_log("[*] POST Registrasi Bayi Baru Lahir...");

// Base inputs
$b_nik_anak = sanitize_input($_POST['b_nik_anak'] ?? '');
$b_nama_anak = sanitize_input($_POST['b_nama_anak'] ?? '');
$b_nik_ibu = sanitize_input($_POST['b_nik_ibu'] ?? '');
$b_tgl = sanitize_input($_POST['b_tgl'] ?? '');
$b_tempat = sanitize_input($_POST['b_tempat'] ?? '');
$b_jk = sanitize_input($_POST['b_jk'] ?? '');
$b_wn = sanitize_input($_POST['b_wn'] ?? 'WNI');
$b_phone_mobile = sanitize_input($_POST['b_phone_mobile'] ?? '');
$b_contact_name = sanitize_input($_POST['b_contact_name'] ?? '');
$b_contact_phone = sanitize_input($_POST['b_contact_phone'] ?? '');
$b_kembar = sanitize_input($_POST['b_kembar'] ?? 'Tunggal');
$b_urutan = sanitize_input($_POST['b_urutan'] ?? '');

$b_alamat = sanitize_input($_POST['b_alamat'] ?? '');
$b_prov = sanitize_input($_POST['b_prov'] ?? '');
$b_kota = sanitize_input($_POST['b_kota'] ?? '');
$b_kec = sanitize_input($_POST['b_kec'] ?? '');
$b_desa = sanitize_input($_POST['b_desa'] ?? '');
$b_rt = sanitize_input($_POST['b_rt'] ?? '');
$b_rw = sanitize_input($_POST['b_rw'] ?? '');

// Validate Kode Kemendagri
if (!empty($b_prov) && !preg_match('/^\d{2}$/', $b_prov)) json_response(400, ['error' => 'Kode Provinsi harus 2 digit angka']);
if (!empty($b_kota) && !preg_match('/^\d{4}$/', $b_kota)) json_response(400, ['error' => 'Kode Kota/Kab harus 4 digit angka']);
if (!empty($b_kec) && !preg_match('/^\d{6}$/', $b_kec)) json_response(400, ['error' => 'Kode Kecamatan harus 6 digit angka']);
if (!empty($b_desa) && !preg_match('/^\d{10}$/', $b_desa)) json_response(400, ['error' => 'Kode Desa harus 10 digit angka']);

$jk = ($b_jk === 'Laki-laki') ? 'male' : 'female';

$payload = [
    "resourceType" => "Patient",
    "meta" => [
        "profile" => ["https://fhir.kemkes.go.id/r4/StructureDefinition/Patient"]
    ],
    "identifier" => [
        [
            "use" => "official",
            "system" => "https://fhir.kemkes.go.id/id/nik-ibu",
            "value" => $b_nik_ibu
        ]
    ],
    "active" => true,
    "name" => [
        [
            "use" => "official",
            "text" => $b_nama_anak
        ]
    ],
    "telecom" => [],
    "gender" => $jk,
    "birthDate" => $b_tgl,
    "deceasedBoolean" => false,
    "address" => [],
    "maritalStatus" => [
        "coding" => [
            [
                "system" => "http://terminology.hl7.org/CodeSystem/v3-MaritalStatus",
                "code" => "S",
                "display" => "Single" // Babies are single by default
            ]
        ],
        "text" => "Single"
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
            "valueCode" => $b_wn
        ]
    ]
];

// Address
$addressObj = [
    "use" => "home",
    "line" => [$b_alamat],
    "country" => "ID",
    "extension" => []
];

$adminCodeExt = [];
if (!empty($b_prov)) $adminCodeExt[] = ["url" => "province", "valueCode" => $b_prov];
if (!empty($b_kota)) $adminCodeExt[] = ["url" => "city", "valueCode" => $b_kota];
if (!empty($b_kec)) $adminCodeExt[] = ["url" => "district", "valueCode" => $b_kec];
if (!empty($b_desa)) $adminCodeExt[] = ["url" => "village", "valueCode" => $b_desa];
if (!empty($b_rt)) $adminCodeExt[] = ["url" => "rt", "valueCode" => $b_rt];
if (!empty($b_rw)) $adminCodeExt[] = ["url" => "rw", "valueCode" => $b_rw];

if (!empty($adminCodeExt)) {
    $addressObj["extension"][] = [
        "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/administrativeCode",
        "extension" => $adminCodeExt
    ];
}

if (empty($addressObj["extension"])) unset($addressObj["extension"]);
$payload["address"][] = $addressObj;

// If NIK anak exists
if (!empty($b_nik_anak)) {
    array_unshift($payload["identifier"], [
        "use" => "official",
        "system" => "https://fhir.kemkes.go.id/id/nik",
        "value" => $b_nik_anak
    ]);
}

// Telecom
if (!empty($b_phone_mobile)) {
    $payload["telecom"][] = ["system" => "phone", "value" => $b_phone_mobile, "use" => "mobile"];
}
if (empty($payload["telecom"])) unset($payload["telecom"]);

// Contact
if (!empty($b_contact_name) || !empty($b_contact_phone)) {
    $contactObj = [
        "relationship" => [
            ["coding" => [["system" => "http://terminology.hl7.org/CodeSystem/v2-0131", "code" => "C"]]]
        ],
        "name" => ["use" => "official", "text" => $b_contact_name ?: "Unknown"]
    ];
    if (!empty($b_contact_phone)) {
        $contactObj["telecom"] = [["system" => "phone", "value" => $b_contact_phone, "use" => "mobile"]];
    }
    $payload["contact"][] = $contactObj;
}
if (empty($payload["contact"])) unset($payload["contact"]);

// BirthPlace
if (!empty($b_tempat)) {
    array_unshift($payload["extension"], [
        "url" => "https://fhir.kemkes.go.id/r4/StructureDefinition/birthPlace",
        "valueAddress" => ["city" => $b_tempat, "country" => "ID"]
    ]);
}

if ($b_kembar === "Tunggal") {
    $payload["multipleBirthInteger"] = 0;
} else {
    $urutan = intval($b_urutan);
    if ($urutan <= 0) $urutan = 1;
    $payload["multipleBirthInteger"] = $urutan;
}

$result = satusehat_post_patient($access_token, $payload, $env);

if ($result['success']) {
    json_response(200, ['success' => true, 'message' => 'POST PATIENT SUCCESS', 'id' => $result['id'], 'request_body' => $payload]);
} else {
    json_response(400, ['success' => false, 'error' => 'POST PATIENT FAILED', 'details' => $result, 'request_body' => $payload]);
}
