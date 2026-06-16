<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/satusehat.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, ['error' => 'Method Not Allowed']);
}

if (empty($_SESSION['access_token'])) {
    json_response(401, ['error' => 'Please generate token first']);
}

$access_token = $_SESSION['access_token'];
$env = isset($_SESSION['env']) ? $_SESSION['env'] : ENV_PRODUCTION;
$base_url = get_base_url($env); // e.g. https://api-satusehat.kemkes.go.id

$type = sanitize_input($_GET['type'] ?? '');
$parent_code = sanitize_input($_GET['parent'] ?? '');

$endpoint_base = '';
if ($type === 'provinces') {
    $endpoint_base = "/masterdata/v2/provinces?";
} else if ($type === 'cities' && !empty($parent_code)) {
    $endpoint_base = "/masterdata/v2/cities?province_codes={$parent_code}&";
} else if ($type === 'districts' && !empty($parent_code)) {
    $endpoint_base = "/masterdata/v2/districts?city_codes={$parent_code}&";
} else if ($type === 'sub-districts' && !empty($parent_code)) {
    $endpoint_base = "/masterdata/v2/sub-districts?district_codes={$parent_code}&";
} else {
    json_response(400, ['error' => 'Invalid type or missing parent code']);
}

$all_data = [];
$current_page = 1;
$total_page = 1; // Default
$ch = curl_init();

do {
    $url = $base_url . $endpoint_base . "current_page={$current_page}";

    curl_setopt_array($ch, array(
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => array(
            'Authorization: Bearer ' . $access_token
        ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);

    if ($response === false) {
        curl_close($ch);
        json_response(500, ['error' => 'cURL Error: ' . $error]);
    }

    $result = json_decode($response, true);

    if ($http_code == 200 && isset($result['data'])) {
        $all_data = array_merge($all_data, $result['data']);
        if (isset($result['meta']['page']['total_page'])) {
            // $total_page = (int)$result['meta']['page']['total_page'];
            $total_page = (int) ceil(
                $result['meta']['page']['total'] /
                $result['meta']['page']['limit']
            );
        } else {
            $total_page = 1;
        }
    } else {
        curl_close($ch);
        json_response($http_code, ['success' => false, 'error' => 'Failed to fetch Master Data', 'details' => $result]);
    }

    $current_page++;
} while ($current_page <= $total_page);

curl_close($ch);

json_response(200, ['success' => true, 'data' => $all_data]);
