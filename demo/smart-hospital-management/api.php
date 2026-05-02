<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateDir = sys_get_temp_dir() . '/brightai_hospital_rate';
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
$hits = array_values(array_filter($hits, static fn ($stamp) => is_int($stamp) && $stamp > $now - $window));
if (count($hits) >= $limit) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'rate_limited', 'message' => 'تم تجاوز حد 10 طلبات في الدقيقة.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$hits[] = $now;
file_put_contents($rateFile, json_encode($hits));

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 120000) {
    http_response_code(413);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'payload_too_large'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean_text(string $text): string
{
    $text = strip_tags($text);
    $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text) ?? '';
    $text = preg_replace('/\s+/u', ' ', $text) ?? '';
    return trim(mb_substr($text, 0, 3000));
}

function redact_pii(string $text): string
{
    $patterns = [
        '/\b05\d{8}\b/u' => '[REDACTED_PHONE]',
        '/\b(?:\+966|00966)\s?5\d{8}\b/u' => '[REDACTED_PHONE]',
        '/\b1\d{9}\b/u' => '[REDACTED_NATIONAL_ID]',
        '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/iu' => '[REDACTED_EMAIL]',
        '/\b(?:MRN|رقم ملف|ملف)\s*[:#]?\s*\d{4,}\b/iu' => '[REDACTED_MEDICAL_RECORD]'
    ];
    return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? $text;
}

function sanitize_array(mixed $value): mixed
{
    if (is_string($value)) {
        return redact_pii(clean_text($value));
    }
    if (is_array($value)) {
        $safe = [];
        foreach ($value as $key => $item) {
            $safe[is_string($key) ? clean_text($key) : $key] = sanitize_array($item);
        }
        return $safe;
    }
    if (is_int($value) || is_float($value) || is_bool($value) || $value === null) {
        return $value;
    }
    return null;
}

$apiKey = getenv('GEMINI_API_KEY') ?: getenv('GOOGLE_API_KEY');
if (!$apiKey) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'missing_api_key', 'message' => 'مفتاح Gemini غير مضبوط في متغيرات البيئة.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$model = (string) ($payload['model'] ?? 'gemini-2.5-flash');
$allowedModels = ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'];
if (!in_array($model, $allowedModels, true)) {
    $model = 'gemini-2.5-flash';
}

$question = redact_pii(clean_text((string) ($payload['question'] ?? '')));
if (mb_strlen($question) < 8) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'question_too_short'], JSON_UNESCAPED_UNICODE);
    exit;
}

$snapshot = sanitize_array($payload['snapshot'] ?? []);
$persona = redact_pii(clean_text((string) ($payload['persona'] ?? 'مدير تشغيل مستشفى')));
$temperature = max(0, min(1, (float) ($payload['temperature'] ?? 0.25)));
$maxTokens = max(512, min(8192, (int) ($payload['maxTokens'] ?? 2048)));

$systemPrompt = <<<'PROMPT'
أنت مساعد تشغيل مستشفى مؤسسي يعمل لصالح BrightAI في السوق السعودي.
مهمتك دعم مدير مستشفى أو مدير تشغيل أو قائد جودة في قراءة مؤشرات تشغيلية لمستشفى 200 سرير.
التزم بالعربية الفصحى المهنية مع مصطلحات صحية مفهومة في السعودية.
لا تقدّم تشخيصاً طبياً ولا قراراً سريرياً ولا تعليمات علاجية.
كل توصية يجب أن تكون داعمة للقرار فقط وتطلب اعتماداً بشرياً عند وجود أثر على المرضى أو الكادر أو الميزانية.
استخدم الأرقام المتاحة فقط، وإذا لم توجد بيانات كافية فاذكر الافتراض بوضوح.
راعِ معايير سباهي CBAHI وJCI وممارسات الأمن السيبراني الصحي ونظام حماية البيانات الشخصية السعودي.
افترض أن التكاملات الممكنة تشمل نفيس، وصفتي، صحتي، أنا، HL7 FHIR، وDICOM دون الادعاء بوجود ربط فعلي.
استخدم الأدوات المتاحة عند الحاجة:
- query_kpi(metric, time_range, filter): للاستعلام عن مؤشر محدد.
- simulate_scenario(change, horizon): لمحاكاة أثر تغيير تشغيلي.
- generate_report(template, period): لإنتاج تقرير تنفيذي منسق.
- check_compliance(standard): لتحليل فجوات امتثال.
أعد المخرجات دائماً بصيغة JSON مطابقة للمخطط المطلوب دون نص خارج JSON.
PROMPT;

$responseSchema = [
    'type' => 'object',
    'properties' => [
        'decision_summary' => ['type' => 'string'],
        'recommended_actions' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'action' => ['type' => 'string'],
                    'impact_estimate' => ['type' => 'string'],
                    'effort' => ['type' => 'string', 'enum' => ['منخفض', 'متوسط', 'مرتفع']],
                    'risk' => ['type' => 'string'],
                    'owner_role' => ['type' => 'string'],
                    'deadline' => ['type' => 'string']
                ],
                'required' => ['action', 'impact_estimate', 'effort', 'risk', 'owner_role', 'deadline']
            ]
        ],
        'trade_offs' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => ['benefit' => ['type' => 'string'], 'cost' => ['type' => 'string']],
                'required' => ['benefit', 'cost']
            ]
        ],
        'affected_kpis' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'kpi' => ['type' => 'string'],
                    'current' => ['type' => 'string'],
                    'projected' => ['type' => 'string'],
                    'delta' => ['type' => 'string']
                ],
                'required' => ['kpi', 'current', 'projected', 'delta']
            ]
        ],
        'compliance_notes' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'standard' => ['type' => 'string'],
                    'clause' => ['type' => 'string'],
                    'status' => ['type' => 'string']
                ],
                'required' => ['standard', 'clause', 'status']
            ]
        ],
        'human_approval_required' => ['type' => 'boolean']
    ],
    'required' => [
        'decision_summary',
        'recommended_actions',
        'trade_offs',
        'affected_kpis',
        'compliance_notes',
        'human_approval_required'
    ]
];

$request = [
    'systemInstruction' => [
        'parts' => [['text' => $systemPrompt]]
    ],
    'contents' => [[
        'role' => 'user',
        'parts' => [[
            'text' => json_encode([
                'persona' => $persona,
                'question' => $question,
                'snapshot' => $snapshot
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]]
    ]],
    'tools' => [[
        'functionDeclarations' => [
            [
                'name' => 'query_kpi',
                'description' => 'استعلام عن مؤشر تشغيلي محدد',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'metric' => ['type' => 'string'],
                        'time_range' => ['type' => 'string'],
                        'filter' => ['type' => 'string']
                    ],
                    'required' => ['metric', 'time_range']
                ]
            ],
            [
                'name' => 'simulate_scenario',
                'description' => 'محاكاة أثر تغيير تشغيلي',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'change' => ['type' => 'string'],
                        'horizon' => ['type' => 'string']
                    ],
                    'required' => ['change', 'horizon']
                ]
            ],
            [
                'name' => 'generate_report',
                'description' => 'توليد تقرير إداري منسق',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'template' => ['type' => 'string'],
                        'period' => ['type' => 'string']
                    ],
                    'required' => ['template', 'period']
                ]
            ],
            [
                'name' => 'check_compliance',
                'description' => 'تحليل فجوات امتثال لمعيار صحي',
                'parameters' => [
                    'type' => 'object',
                    'properties' => [
                        'standard' => ['type' => 'string', 'enum' => ['CBAHI', 'JCI', 'MOH']]
                    ],
                    'required' => ['standard']
                ]
            ]
        ]
    ]],
    'generationConfig' => [
        'temperature' => $temperature,
        'maxOutputTokens' => $maxTokens,
        'responseMimeType' => 'application/json',
        'responseSchema' => $responseSchema
    ]
];

$stream = (bool) ($payload['stream'] ?? false);
$method = $stream ? ':streamGenerateContent?alt=sse&key=' : ':generateContent?key=';
$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . $method . rawurlencode($apiKey);
$ch = curl_init($url);

if ($stream) {
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Accel-Buffering: no');
    $sseBuffer = '';
    $httpStatus = 0;
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT => 45,
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$sseBuffer, &$httpStatus): int {
            $httpStatus = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            $sseBuffer .= $chunk;
            while (($pos = strpos($sseBuffer, "\n\n")) !== false) {
                $event = substr($sseBuffer, 0, $pos);
                $sseBuffer = substr($sseBuffer, $pos + 2);
                foreach (explode("\n", $event) as $line) {
                    $line = trim($line);
                    if (!str_starts_with($line, 'data:')) {
                        continue;
                    }
                    $json = trim(substr($line, 5));
                    if ($json === '' || $json === '[DONE]') {
                        continue;
                    }
                    $decoded = json_decode($json, true);
                    $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    if (is_string($text) && $text !== '') {
                        echo $text;
                        @ob_flush();
                        flush();
                    }
                }
            }
            return strlen($chunk);
        }
    ]);
    $ok = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if ($ok === false || $status < 200 || $status >= 300 || $httpStatus >= 400) {
        echo json_encode(['error' => 'gemini_stream_failed'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 45
]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($result === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'error' => 'gemini_proxy_failed',
        'status' => $status,
        'message' => $curlError ?: 'تعذر إكمال طلب Gemini.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$gemini = json_decode($result, true);
$text = $gemini['candidates'][0]['content']['parts'][0]['text'] ?? '';
$decoded = json_decode($text, true);
if (!is_array($decoded)) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'invalid_model_json', 'raw' => mb_substr($text, 0, 1000)], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
