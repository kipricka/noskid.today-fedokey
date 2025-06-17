<?php
// Certificate caching API for check.noskid.today
// This server caches valid certificates permanently and invalid ones for 24 hours

header('Content-Type: application/json');

define('DB_HOST', 'localhost');
define('DB_USER', 'username');
define('DB_PASS', 'pwd');
define('DB_NAME', 'name');

if (!isset($_GET['key']) || empty($_GET['key'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing verification key parameter',
        'cached' => false
    ], JSON_PRETTY_PRINT);
    exit;
}

$key = trim($_GET['key']);

$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($mysqli->connect_error) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error',
        'cached' => false
    ], JSON_PRETTY_PRINT);
    exit;
}

$stmt = $mysqli->prepare("SELECT * FROM cert_cache WHERE verification_key = ? AND (is_valid = 1 OR (is_valid = 0 AND cached_at > DATE_SUB(NOW(), INTERVAL 1 DAY)))");

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database query preparation failed',
        'cached' => false
    ], JSON_PRETTY_PRINT);
    exit;
}

$stmt->bind_param("s", $key);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $cached_cert = $result->fetch_assoc();
    $stmt->close();

    if ($cached_cert['is_valid'] == 1) {
        $response = [
            'success' => true,
            'message' => 'Certificate is valid and verified',
            'data' => [
                'certificate_number' => $cached_cert['certificate_number'],
                'username' => $cached_cert['username'],
                'percentage' => $cached_cert['percentage'],
                'creationDate' => $cached_cert['creation_date'],
                'country' => $cached_cert['country'],
                'countryCode' => $cached_cert['country_code']
            ],
            'cached' => true
        ];
        echo json_encode($response, JSON_PRETTY_PRINT);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Certificate not found or invalid verification key',
            'cached' => true
        ], JSON_PRETTY_PRINT);
    }
    $mysqli->close();
    exit;
}

$stmt->close();

$originalApi = "https://noskid.today/api/checkcert/?key=" . urlencode($key);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $originalApi);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'check.noskid.today/5.0');
curl_setopt($ch, CURLOPT_FAILONERROR, true);

$apiResponse = curl_exec($ch);

if (curl_errno($ch)) {
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $errorMessage = curl_error($ch);
    curl_close($ch);

    echo json_encode([
        'success' => false,
        'message' => 'API unavailable',
        'status_code' => $statusCode !== 0 ? $statusCode : null,
        'error' => $errorMessage,
        'cached' => false
    ], JSON_PRETTY_PRINT);
    $mysqli->close();
    exit;
}

curl_close($ch);

$apiData = json_decode($apiResponse, true);

if ($apiData === null) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid response from verification service',
        'cached' => false
    ], JSON_PRETTY_PRINT);
    $mysqli->close();
    exit;
}

if ($apiData['success']) {
    $data = $apiData['data'];
    $insertStmt = $mysqli->prepare("INSERT INTO cert_cache (verification_key, is_valid, certificate_number, username, percentage, creation_date, country, country_code, cached_at) VALUES (?, 1, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE cached_at = NOW()");

    if ($insertStmt) {
        $insertStmt->bind_param("sssssss",
            $key,
            $data['certificate_number'],
            $data['username'],
            $data['percentage'],
            $data['creationDate'],
            $data['country'],
            $data['countryCode']
        );
        $insertStmt->execute();
        $insertStmt->close();
    }

    $apiData['cached'] = false;
    echo json_encode($apiData, JSON_PRETTY_PRINT);
} else {
    $insertStmt = $mysqli->prepare("INSERT INTO cert_cache (verification_key, is_valid, cached_at) VALUES (?, 0, NOW()) ON DUPLICATE KEY UPDATE is_valid = 0, cached_at = NOW()");

    if ($insertStmt) {
        $insertStmt->bind_param("s", $key);
        $insertStmt->execute();
        $insertStmt->close();
    }

    $apiData['cached'] = false;
    echo json_encode($apiData, JSON_PRETTY_PRINT);
}

$mysqli->close();
?>
