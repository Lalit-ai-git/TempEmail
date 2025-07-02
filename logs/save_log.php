<?php
header('Content-Type: application/json');

// Configuration
$logFile = 'email_logs.csv';
$maxFileSize = 5 * 1024 * 1024; // 5MB max file size

// Get data from POST request
$data = isset($_POST['data']) ? $_POST['data'] : '';

// Validate data
if (empty($data)) {
    echo json_encode(['success' => false, 'error' => 'No data provided']);
    exit;
}

// Create log directory if it doesn't exist
if (!file_exists('logs')) {
    mkdir('logs', 0755, true);
}

// Rotate log file if it gets too large
if (file_exists('logs/' . $logFile) && filesize('logs/' . $logFile) > $maxFileSize) {
    $timestamp = date('Y-m-d_His');
    rename('logs/' . $logFile, 'logs/email_logs_' . $timestamp . '.csv');
}

// Write to log file
$filePath = 'logs/' . $logFile;
$writeSuccess = file_put_contents($filePath, $data, FILE_APPEND | LOCK_EX);

if ($writeSuccess === false) {
    echo json_encode(['success' => false, 'error' => 'Could not write to log file']);
    exit;
}

echo json_encode(['success' => true]);
?>