<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/logger.php';

function get_base_url($env) {
    return ($env === ENV_STAGING) ? BASE_URL_STAGING : BASE_URL_PRODUCTION;
}

function satusehat_generate_token($client_id, $client_secret, $env) {
    write_log("----------------------------------------");
    write_log("[*] Requesting Token ({$env})...");

    $base_url = get_base_url($env);
    $url = $base_url . '/oauth2/v1/accesstoken?grant_type=client_credentials';

    $ch = curl_init();
    curl_setopt_array($ch, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => 'client_id=' . urlencode($client_id) . '&client_secret=' . urlencode($client_secret),
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/x-www-form-urlencoded'
      ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        write_log("[!] Error: cURL Error: " . $error);
        return ['success' => false, 'error' => $error];
    }

    $result = json_decode($response, true);

    if ($http_code == 200 && isset($result['access_token'])) {
        write_log("[✓] GENERATE TOKEN SUCCESS ✓");
        $token_preview = substr($result['access_token'], 0, 20) . '...';
        write_log("Token: " . $token_preview);
        return ['success' => true, 'access_token' => $result['access_token']];
    } else {
        write_log("[X] FAILED. Status: " . $http_code . "\n" . $response);
        return ['success' => false, 'status' => $http_code, 'response' => $response];
    }
}

function satusehat_post_patient($access_token, $payload, $env) {
    $base_url = get_base_url($env);
    $url = $base_url . '/fhir-r4/v1/Patient';

    $ch = curl_init();
    curl_setopt_array($ch, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'POST',
      CURLOPT_POSTFIELDS => json_encode($payload),
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $access_token
      ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        write_log("[!] Error: cURL Error: " . $error);
        return ['success' => false, 'error' => $error];
    }

    $result = json_decode($response, true);

    if ($http_code == 200 || $http_code == 201) {
        write_log("     ✓ POST PATIENT SUCCESS ✓");
        $ihs_number = isset($result['id']) ? $result['id'] : 'Unknown';
        write_log("IHS Number: " . $ihs_number);
        return ['success' => true, 'id' => $ihs_number, 'response' => $result];
    } else {
        write_log("[X] FAILED. HTTP " . $http_code . "\n" . $response);
        return ['success' => false, 'status' => $http_code, 'response' => $response];
    }
}

function satusehat_search_patient_by_nik($access_token, $nik, $env) {
    $base_url = get_base_url($env);
    $url = $base_url . '/fhir-r4/v1/Patient?identifier=https%3A%2F%2Ffhir.kemkes.go.id%2Fid%2Fnik%7C' . urlencode($nik);

    $ch = curl_init();
    curl_setopt_array($ch, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $access_token
      ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        write_log("[!] Error: cURL Error: " . $error);
        return ['success' => false, 'error' => $error];
    }

    $result = json_decode($response, true);

    if ($http_code == 200) {
        write_log("     ✓ SEARCH PATIENT SUCCESS ✓");
        $total = isset($result['total']) ? $result['total'] : 0;
        write_log("Found: " . $total . " patient(s).");
        return ['success' => true, 'total' => $total, 'response' => $result];
    } else {
        write_log("[X] FAILED. HTTP " . $http_code . "\n" . $response);
        return ['success' => false, 'status' => $http_code, 'response' => $response];
    }
}

function satusehat_patch_patient($access_token, $ihs_number, $patch_payload, $env) {
    $base_url = get_base_url($env);
    $url = $base_url . '/fhir-r4/v1/Patient/' . urlencode($ihs_number);

    $ch = curl_init();
    curl_setopt_array($ch, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'PATCH',
      CURLOPT_POSTFIELDS => json_encode($patch_payload),
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json-patch+json',
        'Authorization: Bearer ' . $access_token
      ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        write_log("[!] Error: cURL Error (PATCH): " . $error);
        return ['success' => false, 'error' => $error];
    }

    $result = json_decode($response, true);

    if ($http_code == 200 || $http_code == 201) {
        write_log("     ✓ PATCH PATIENT SUCCESS ✓");
        return ['success' => true, 'response' => $result];
    } else {
        write_log("[X] PATCH FAILED. HTTP " . $http_code . "\n" . $response);
        return ['success' => false, 'status' => $http_code, 'response' => $response];
    }
}

function satusehat_get_patient_by_id($access_token, $ihs_number, $env) {
    $base_url = get_base_url($env);
    $url = $base_url . '/fhir-r4/v1/Patient/' . urlencode($ihs_number);

    $ch = curl_init();
    curl_setopt_array($ch, array(
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_ENCODING => '',
      CURLOPT_MAXREDIRS => 10,
      CURLOPT_TIMEOUT => 0,
      CURLOPT_FOLLOWLOCATION => true,
      CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
      CURLOPT_CUSTOMREQUEST => 'GET',
      CURLOPT_HTTPHEADER => array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $access_token
      ),
    ));

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        write_log("[!] Error: cURL Error (GET Patient): " . $error);
        return ['success' => false, 'error' => $error];
    }

    $result = json_decode($response, true);

    if ($http_code == 200) {
        write_log("     ✓ GET PATIENT SUCCESS ✓");
        return ['success' => true, 'response' => $result];
    } else {
        write_log("[X] GET PATIENT FAILED. HTTP " . $http_code . "\n" . $response);
        return ['success' => false, 'status' => $http_code, 'response' => $response];
    }
}
