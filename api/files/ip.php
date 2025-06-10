<?php
require_once '../files/getip.php';
$ip = getRequesterIp();
$r= file_get_contents("http://ip-api.com/json/$ip");
header('Content-Type: application/json');
echo $r;
?>
