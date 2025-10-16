<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        '*', // Allow all origins for development
        'http://172.20.10.2:8000',     // Mobile data IP (primary)
        'http://172.20.10.1:8000',     // Mobile hotspot gateway
        'http://192.168.100.197:8000', // WiFi IP (fallback)
        'http://localhost:8000',        // Local development
        'http://127.0.0.1:8000',       // Local development
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
