<?php
// Обработчик заявок для обычного PHP-хостинга (PHP 7.4+).
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$cfg = require __DIR__ . '/config.php';
date_default_timezone_set($cfg['timezone'] ?? 'Asia/Yekaterinburg');
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) @mkdir($dataDir, 0700, true);

function out(int $status, array $body): void { http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
function clean($v, int $max): string {
    $s = is_scalar($v) ? (string)$v : '';
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    return mb_substr(trim($s), 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['ok' => false, 'error' => 'Method not allowed']);
$raw = file_get_contents('php://input', false, null, 0, 16384);
$data = json_decode($raw ?: '', true);
if (!is_array($data)) out(400, ['ok' => false, 'error' => 'Некорректный запрос.']);

// rate limit
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$rateFile = $dataDir . '/rate.json';
$rate = is_file($rateFile) ? (json_decode((string)file_get_contents($rateFile), true) ?: []) : [];
$now = time();
foreach ($rate as $k => $list) { $rate[$k] = array_values(array_filter($list, fn($t) => $now - $t < 600)); if (!$rate[$k]) unset($rate[$k]); }
$rate[$ip][] = $now;
@file_put_contents($rateFile, json_encode($rate), LOCK_EX);
if (count($rate[$ip]) > (int)($cfg['rate_limit'] ?? 6)) out(429, ['ok' => false, 'error' => 'Слишком много заявок подряд. Попробуйте позже.']);

if (clean($data['website'] ?? '', 200) !== '') out(200, ['ok' => true]); // honeypot

$labels = ['consult' => 'Консультация', 'callback' => 'Обратный звонок', 'price' => 'Узнать стоимость', 'corporate' => 'Корпоративное обучение', 'program' => 'Заявка со страницы программы', 'feedback' => 'Обратная связь'];
$digits = preg_replace('/\D/', '', (string)($data['phone'] ?? ''));
$phone = strlen($digits) === 11 ? '+7' . substr($digits, 1) : (strlen($digits) === 10 ? '+7' . $digits : '');
$formType = clean($data['formType'] ?? 'consult', 30);
$utm = [];
if (isset($data['utm']) && is_array($data['utm'])) foreach ($data['utm'] as $k => $v) if (preg_match('/^utm_\w+$/', (string)$k)) $utm[$k] = clean($v, 150);
$lead = [
    'id' => bin2hex(random_bytes(8)),
    'date' => date('c'),
    'formType' => $formType,
    'formLabel' => $labels[$formType] ?? 'Заявка с сайта',
    'name' => clean($data['name'] ?? '', 80),
    'phone' => $phone,
    'direction' => clean($data['direction'] ?? '', 150),
    'program' => clean($data['program'] ?? '', 200),
    'company' => clean($data['company'] ?? '', 150),
    'comment' => clean($data['comment'] ?? '', 1000),
    'page' => clean($data['page'] ?? '', 300),
    'utm' => $utm,
];
$errors = [];
if (mb_strlen($lead['name']) < 2) $errors[] = 'Укажите имя.';
if (!preg_match('/^\+7[3489]\d{9}$/', $lead['phone'])) $errors[] = 'Проверьте номер телефона.';
if (($data['consent'] ?? false) !== true) $errors[] = 'Нужно согласие на обработку персональных данных.';
if ($errors) out(422, ['ok' => false, 'error' => implode(' ', $errors)]);

function leadText(array $l, bool $html = false): string {
    $e = fn($s) => $html ? htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8') : (string)$s;
    $utm = implode(', ', array_map(fn($k, $v) => "$k=$v", array_keys($l['utm']), $l['utm']));
    $rows = [
        ($html ? '<b>' : '') . 'Новая заявка: ' . $e($l['formLabel']) . ($html ? '</b>' : ''),
        ['Имя', $l['name']], ['Телефон', $l['phone']], ['Организация', $l['company']], ['Направление', $l['direction']],
        ['Программа', $l['program']], ['Комментарий', $l['comment']], ['Страница', $l['page']], ['UTM', $utm], ['Время', date('d.m.Y H:i')],
    ];
    $out = [];
    foreach ($rows as $r) { if (is_string($r)) $out[] = $r; elseif ($r[1] !== '') $out[] = $r[0] . ': ' . $e($r[1]); }
    return implode("\n", $out);
}
function httpPostJson(string $url, array $body, array $headers = []): array {
    $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers)]);
        $resp = curl_exec($ch); $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
        return [$code, $resp === false ? '' : (string)$resp, $err];
    }
    $ctx = stream_context_create(['http' => ['method' => 'POST', 'header' => implode("\r\n", array_merge(['Content-Type: application/json'], $headers)), 'content' => $payload, 'timeout' => 15, 'ignore_errors' => true]]);
    $resp = @file_get_contents($url, false, $ctx);
    $code = 0; foreach ($http_response_header ?? [] as $h) if (preg_match('#^HTTP/\S+ (\d+)#', $h, $m)) $code = (int)$m[1];
    return [$code, (string)$resp, $resp === false ? 'connection failed' : ''];
}

$delivery = [];
$channels = 0;
if ($cfg['telegram_bot_token'] && $cfg['telegram_chat_id']) {
    $channels++; $ok = false; $err = '';
    foreach (array_filter(array_map('trim', explode(',', $cfg['telegram_chat_id']))) as $chat) {
        [$code, $resp, $e] = httpPostJson('https://api.telegram.org/bot' . $cfg['telegram_bot_token'] . '/sendMessage', ['chat_id' => $chat, 'text' => leadText($lead, true), 'parse_mode' => 'HTML', 'disable_web_page_preview' => true]);
        $j = json_decode($resp, true);
        if ($code === 200 && !empty($j['ok'])) $ok = true; else $err = $j['description'] ?? ($e ?: "HTTP $code");
    }
    $delivery[] = ['channel' => 'telegram', 'ok' => $ok, 'error' => $ok ? null : $err];
}
if ($cfg['mail_to']) {
    $channels++;
    $from = $cfg['mail_from'] ?: ('noreply@' . preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost'));
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $lead['formLabel'] . ' — ' . $lead['name']) . '?=';
    $headers = "From: =?UTF-8?B?" . base64_encode('Сайт учебного центра') . "?= <$from>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Transfer-Encoding: base64";
    $ok = @mail($cfg['mail_to'], $subject, chunk_split(base64_encode(leadText($lead))), $headers, '-f' . $from);
    $delivery[] = ['channel' => 'email', 'ok' => $ok, 'error' => $ok ? null : 'mail() вернула ошибку'];
}
if ($cfg['bitrix24_webhook_url']) {
    $channels++;
    $comments = implode("\n", array_filter([
        $lead['direction'] ? 'Направление: ' . $lead['direction'] : '', $lead['program'] ? 'Программа: ' . $lead['program'] : '',
        $lead['company'] ? 'Организация: ' . $lead['company'] : '', $lead['comment'] ? 'Комментарий: ' . $lead['comment'] : '']));
    $fields = ['TITLE' => $lead['formLabel'] . ': ' . ($lead['program'] ?: ($lead['direction'] ?: 'сайт')), 'NAME' => $lead['name'],
        'PHONE' => [['VALUE' => $lead['phone'], 'VALUE_TYPE' => 'WORK']], 'COMMENTS' => $comments, 'SOURCE_ID' => 'WEB', 'SOURCE_DESCRIPTION' => $lead['page']];
    if ($lead['company']) $fields['COMPANY_TITLE'] = $lead['company'];
    foreach ($lead['utm'] as $k => $v) $fields[strtoupper($k)] = $v;
    [$code, $resp, $e] = httpPostJson(rtrim($cfg['bitrix24_webhook_url'], '/') . '/crm.lead.add.json', ['fields' => $fields]);
    $j = json_decode($resp, true);
    $ok = $code === 200 && !empty($j['result']);
    $delivery[] = ['channel' => 'bitrix24', 'ok' => $ok, 'error' => $ok ? null : ($j['error_description'] ?? ($e ?: "HTTP $code"))];
}
if ($cfg['crm_webhook_url']) {
    $channels++;
    [$code, , $e] = httpPostJson($cfg['crm_webhook_url'], $lead, $cfg['crm_webhook_secret'] ? ['X-Webhook-Secret: ' . $cfg['crm_webhook_secret']] : []);
    $ok = $code >= 200 && $code < 300;
    $delivery[] = ['channel' => 'webhook', 'ok' => $ok, 'error' => $ok ? null : ($e ?: "HTTP $code")];
}

$delivered = (bool)array_filter($delivery, fn($d) => $d['ok']);
$status = $channels === 0 ? 'not_configured' : ($delivered ? 'delivered' : 'failed');
@file_put_contents($dataDir . '/leads.jsonl', json_encode($lead + ['ip' => $ip, 'delivery' => $delivery, 'status' => $status], JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

if ($channels === 0) out(503, ['ok' => false, 'error' => 'Онлайн-заявки временно не принимаются.']);
if (!$delivered) out(502, ['ok' => false, 'error' => 'Не удалось отправить заявку.']);
out(200, ['ok' => true, 'id' => $lead['id']]);
