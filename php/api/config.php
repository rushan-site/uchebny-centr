<?php
// Настройки приёма заявок для PHP-хостинга. Заполните хотя бы один канал.
// Этот файл выполняется сервером и не виден посетителям.
return [
    // Telegram: токен бота от @BotFather и ID чата (можно несколько через запятую)
    'telegram_bot_token' => '',
    'telegram_chat_id'   => '',

    // E-mail: адреса получателей через запятую. Используется функция mail() хостинга.
    'mail_to'   => '',
    'mail_from' => '', // например: noreply@ваш-домен.ru (адрес на вашем домене)

    // Битрикс24: входящий вебхук с правами CRM, вида https://xxx.bitrix24.ru/rest/1/abcdef/
    'bitrix24_webhook_url' => '',

    // Любая CRM / интегратор (amoCRM через Albato, Make и т.п.): POST JSON
    'crm_webhook_url'    => '',
    'crm_webhook_secret' => '',

    // Ограничение: не больше N заявок с одного IP за 10 минут
    'rate_limit' => 6,
    'timezone'   => 'Asia/Yekaterinburg',
];
