<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip = preg_replace('/[^0-9a-fA-F:\., ]/', '', (string) $ip) ?: 'unknown';
$rateDir = sys_get_temp_dir() . '/brightai_ocr_demo_rate';
if (!is_dir($rateDir)) {
    mkdir($rateDir, 0700, true);
}

$rateFile = $rateDir . '/' . hash('sha256', $ip) . '.json';
$now = time();
$window = 60;
$limit = 10;
$hits = [];
if (is_file($rateFile)) {
    $hits = json_decode((string) file_get_contents($rateFile), true) ?: [];
}
$hits = array_values(array_filter($hits, static fn ($hit) => is_int($hit) && $hit > $now - $window));
if (count($hits) >= $limit) {
    http_response_code(429);
    echo json_encode(['error' => 'rate_limited', 'message' => 'تم تجاوز حد ١٠ طلبات في الدقيقة.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$hits[] = $now;
file_put_contents($rateFile, json_encode($hits));

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 5500000) {
    http_response_code(413);
    echo json_encode(['error' => 'payload_too_large', 'message' => 'حجم الطلب أكبر من الحد المسموح للتجربة العامة.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_text(string $text, int $limit = 4000): string
{
    $text = strip_tags($text);
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    $text = preg_replace('/\s+/u', ' ', $text) ?? '';
    return trim(mb_substr($text, 0, $limit));
}

function redact_pii(string $text): string
{
    $patterns = [
        '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/iu' => '[REDACTED_EMAIL]',
        '/(?:\+?966|00966|0)?5\d{8}/u' => '[REDACTED_PHONE]',
        '/\b[12]\d{9}\b/u' => '[REDACTED_NATIONAL_ID_OR_IQAMA]',
        '/\bSA\d{2}[0-9A-Z]{18}\b/iu' => '[REDACTED_IBAN]',
        '/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/u' => '[REDACTED_CARD]'
    ];
    return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? $text;
}

function sanitize_value(mixed $value): mixed
{
    if (is_string($value)) {
        return redact_pii(clean_text($value));
    }
    if (is_array($value)) {
        $safe = [];
        foreach ($value as $key => $item) {
            $safe[is_string($key) ? clean_text($key, 80) : $key] = sanitize_value($item);
        }
        return $safe;
    }
    if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
        return $value;
    }
    return null;
}

$payload = sanitize_value($payload);
$apiKey = getenv('GEMINI_API_KEY') ?: getenv('GOOGLE_API_KEY');
if (!$apiKey) {
    http_response_code(503);
    echo json_encode([
        'error' => 'missing_api_key',
        'message' => 'مفتاح Gemini غير مضبوط في متغيرات البيئة على الخادم.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$settings = is_array($payload['settings'] ?? null) ? $payload['settings'] : [];
$model = (string) ($settings['model'] ?? 'gemini-2.5-flash');
$allowedModels = ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'];
if (!in_array($model, $allowedModels, true)) {
    $model = 'gemini-2.5-flash';
}

$temperature = max(0, min(0.8, (float) ($settings['temperature'] ?? 0.15)));
$maxTokens = max(1024, min(8192, (int) ($settings['maxTokens'] ?? 4096)));
$mode = clean_text((string) ($settings['mode'] ?? 'mixed'), 40);
$outputLanguage = clean_text((string) ($settings['outputLanguage'] ?? 'ar'), 40);
$persona = clean_text((string) ($settings['persona'] ?? ''), 1200);

$systemPrompt = <<<'PROMPT'
أنت محرك فهم مستندات مؤسسي يعمل لصالح Bright AI في السوق السعودي.
استخدم نموذج Gemini 2.5 Flash بوصفه محركاً متعدد الوسائط لفهم المستندات.
مهمتك:
1. اكتشف نوع المستند أولاً من الأنواع التالية: فاتورة ضريبية سعودية، عقد توريد / خدمات، إيصال POS، أمر شراء، بوليصة شحن، شهادة بلدية / تراخيص، مستندات بنكية، هوية وطنية / إقامة، شهادات تعليمية، أو نوع آخر.
2. طبّق مخطط الاستخراج الأنسب لنوع المستند.
3. أعد JSON صارماً فقط دون أي نص خارجه.
4. اجعل كل حقل يحتوي قيمة قابلة للتصدير، وثقة رقمية، ومصدر إحداثي تقريبي داخل الصفحة عندما يمكن تقديره.
5. علّم أي حقل تقل ثقته عن 0.7 للمراجعة البشرية.
6. احجب البيانات الشخصية افتراضياً، خصوصاً الهوية، الإقامة، الهاتف، البريد، الحساب البنكي، وأرقام البطاقات.
7. لفواتير زاتكا السعودية افحص الرقم الضريبي، وجود رمز الاستجابة السريعة، رقم مرجع الفاتورة، والحقول المطلوبة للفاتورة الإلكترونية.
8. لا تفترض امتثالاً كاملاً عند غياب دليل من المستند. اكتب المشكلة في validation_results.
9. استخدم العربية المهنية المعيارية في الرسائل، وحافظ على أسماء الحقول التقنية كما في المخطط.
10. لا تحفظ ولا تطلب بيانات حساسة، ولا تقدّم نصائح قانونية ملزمة.
PROMPT;

if ($persona !== '') {
    $systemPrompt .= "\nتعليمات إضافية من الواجهة: " . $persona;
}

$responseSchema = [
    'type' => 'OBJECT',
    'properties' => [
        'request_id' => ['type' => 'STRING'],
        'document_type' => ['type' => 'STRING'],
        'confidence' => ['type' => 'NUMBER'],
        'language_detected' => ['type' => 'STRING', 'enum' => ['ar', 'en', 'mixed']],
        'extracted_fields' => [
            'type' => 'OBJECT',
            'properties' => [
                'invoice_number' => ['type' => 'STRING'],
                'invoice_date' => ['type' => 'STRING'],
                'seller_name' => ['type' => 'STRING'],
                'buyer_name' => ['type' => 'STRING'],
                'seller_vat_number' => ['type' => 'STRING'],
                'subtotal' => ['type' => 'STRING'],
                'vat_amount' => ['type' => 'STRING'],
                'total_amount' => ['type' => 'STRING'],
                'qr_code_present' => ['type' => 'STRING'],
                'irn' => ['type' => 'STRING'],
                'po_number' => ['type' => 'STRING'],
                'contract_number' => ['type' => 'STRING'],
                'contract_value' => ['type' => 'STRING'],
                'expiry_date' => ['type' => 'STRING'],
                'id_number' => ['type' => 'STRING'],
                'full_name' => ['type' => 'STRING'],
                'bank_account' => ['type' => 'STRING']
            ]
        ],
        'bounding_boxes' => [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'field' => ['type' => 'STRING'],
                    'x' => ['type' => 'NUMBER'],
                    'y' => ['type' => 'NUMBER'],
                    'w' => ['type' => 'NUMBER'],
                    'h' => ['type' => 'NUMBER'],
                    'page' => ['type' => 'INTEGER'],
                    'confidence' => ['type' => 'NUMBER']
                ],
                'required' => ['field', 'x', 'y', 'w', 'h', 'page', 'confidence']
            ]
        ],
        'validation_results' => [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'rule' => ['type' => 'STRING'],
                    'status' => ['type' => 'STRING', 'enum' => ['ok', 'fail', 'warning']],
                    'message' => ['type' => 'STRING']
                ],
                'required' => ['rule', 'status', 'message']
            ]
        ],
        'zatca_compliance' => [
            'type' => 'OBJECT',
            'properties' => [
                'valid' => ['type' => 'BOOLEAN'],
                'issues' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']]
            ],
            'required' => ['valid', 'issues']
        ],
        'pii_detected' => [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'type' => ['type' => 'STRING'],
                    'location' => ['type' => 'STRING'],
                    'redacted_value' => ['type' => 'STRING']
                ],
                'required' => ['type', 'location', 'redacted_value']
            ]
        ],
        'export_formats_ready' => [
            'type' => 'ARRAY',
            'items' => ['type' => 'STRING', 'enum' => ['json', 'xml', 'csv', 'edi']]
        ]
    ],
    'required' => [
        'document_type',
        'confidence',
        'language_detected',
        'extracted_fields',
        'bounding_boxes',
        'validation_results',
        'zatca_compliance',
        'pii_detected',
        'export_formats_ready'
    ]
];

$dynamicSchemas = [
    'saudi_tax_invoice' => ['invoice_number', 'invoice_date', 'seller_name', 'buyer_name', 'seller_vat_number', 'subtotal', 'vat_amount', 'total_amount', 'qr_code_present', 'irn'],
    'contract' => ['contract_number', 'seller_name', 'buyer_name', 'contract_value', 'expiry_date'],
    'pos_receipt' => ['invoice_number', 'invoice_date', 'seller_name', 'subtotal', 'vat_amount', 'total_amount'],
    'purchase_order' => ['po_number', 'buyer_name', 'seller_name', 'total_amount'],
    'bill_of_lading' => ['invoice_number', 'seller_name', 'buyer_name', 'total_amount'],
    'municipal_license' => ['invoice_number', 'seller_name', 'buyer_name', 'expiry_date'],
    'banking_document' => ['bank_account', 'full_name', 'total_amount'],
    'national_id_or_iqama' => ['full_name', 'id_number', 'expiry_date'],
    'education_certificate' => ['full_name', 'seller_name', 'invoice_date']
];

$requestId = bin2hex(random_bytes(8));
$userInstruction = [
    'request_id' => $requestId,
    'document_mode' => $mode,
    'output_language' => $outputLanguage,
    'notes' => $payload['notes'] ?? '',
    'sample_context' => $payload['sample'] ?? null,
    'dynamic_doctype_schemas' => $dynamicSchemas,
    'instruction' => 'حلل المستند أو سياق العينة وأعد JSON مطابقاً للمخطط. إذا لم تصل صورة فعلية، استخدم sample_context لتوليد نتيجة مماثلة لأغراض العرض.'
];

$request = [
    'systemInstruction' => [
        'parts' => [['text' => $systemPrompt]]
    ],
    'contents' => [[
        'role' => 'user',
        'parts' => [[
            'text' => json_encode($userInstruction, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]]
    ]],
    'generationConfig' => [
        'temperature' => $temperature,
        'maxOutputTokens' => $maxTokens,
        'responseMimeType' => 'application/json',
        'responseSchema' => $responseSchema
    ],
    'tools' => [[
        'functionDeclarations' => [
            [
                'name' => 'validate_zatca_invoice',
                'description' => 'يفحص قواعد زاتكا الأساسية للفاتورة السعودية.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'seller_vat_number' => ['type' => 'STRING'],
                        'subtotal' => ['type' => 'NUMBER'],
                        'vat_amount' => ['type' => 'NUMBER'],
                        'qr_code_present' => ['type' => 'BOOLEAN'],
                        'irn' => ['type' => 'STRING']
                    ],
                    'required' => ['seller_vat_number', 'subtotal', 'vat_amount', 'qr_code_present']
                ]
            ],
            [
                'name' => 'redact_detected_pii',
                'description' => 'يحجب البيانات الشخصية المكتشفة قبل العرض أو التصدير.',
                'parameters' => [
                    'type' => 'OBJECT',
                    'properties' => [
                        'pii_type' => ['type' => 'STRING'],
                        'raw_value' => ['type' => 'STRING']
                    ],
                    'required' => ['pii_type', 'raw_value']
                ]
            ]
        ]
    ]]
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':streamGenerateContent?alt=sse&key=' . rawurlencode($apiKey);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 35
]);

$response = curl_exec($ch);
$status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($response === false || $status >= 400) {
    http_response_code(502);
    echo json_encode([
        'error' => 'gemini_request_failed',
        'message' => 'تعذر إكمال طلب Gemini حالياً.',
        'details' => $error ?: ('HTTP ' . $status)
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$combinedText = '';
$lines = preg_split('/\R/', (string) $response) ?: [];
foreach ($lines as $line) {
    if (!str_starts_with($line, 'data: ')) {
        continue;
    }
    $event = json_decode(substr($line, 6), true);
    $text = $event['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (is_string($text)) {
        $combinedText .= $text;
    }
}

$parsed = json_decode($combinedText, true);
if (!is_array($parsed)) {
    http_response_code(502);
    echo json_encode([
        'error' => 'invalid_gemini_json',
        'message' => 'رجع النموذج مخرجاً غير قابل للتحويل إلى JSON.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$parsed['request_id'] = $parsed['request_id'] ?? $requestId;
echo json_encode($parsed, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
