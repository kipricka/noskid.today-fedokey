<?php
function getRequesterIp(): string {
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwardedIps = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $firstIp = trim($forwardedIps[0]);
        if (filter_var($firstIp, FILTER_VALIDATE_IP)) {
            return $firstIp;
        } //retuns the first valid IP from the X-Forwarded-For header, sometimes contains things like that: 84.75.114.12, 84.75.114.12, 152.53.236.228
    }

    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}
?>