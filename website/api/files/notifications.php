<?php

function sendNotification($type, $info) {
    $endpointUrl = NOTIFICATIONS_ENDPOINT;
    if (empty($endpointUrl)) {
        return;
    }

    $payload = json_encode([
        'type' => $type,
        'info' => $info
    ]);

    $ch = curl_init($endpointUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    // dont wait for the response
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, 100); // 100 ms max (enough to send the packet)

    curl_exec($ch);
    curl_close($ch);
}
