<?php
declare(strict_types=1);

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
header('Content-Language: ar-SA');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateDir = sys_get_temp_dir() . '/brightai_marketing_rate';
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
if (strlen($raw) > 160000) {
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
        '/\b05\d{8}\b/u' => '[REDACTED_PHONE]',
        '/\b(?:\+966|00966)\s?5\d{8}\b/u' => '[REDACTED_PHONE]',
        '/\b1\d{9}\b/u' => '[REDACTED_NATIONAL_ID]',
        '/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/iu' => '[REDACTED_EMAIL]',
        '/\b(?:CR|سجل تجاري)\s*[:#]?\s*\d{6,}\b/iu' => '[REDACTED_COMMERCIAL_ID]'
    ];
    return preg_replace(array_keys($patterns), array_values($patterns), $text) ?? $text;
}

function safe_string(array $payload, string $key, string $fallback, int $limit = 4000): string
{
    $value = isset($payload[$key]) ? (string) $payload[$key] : $fallback;
    return redact_pii(clean_text($value, $limit));
}

$apiKey = getenv('GEMINI_API_KEY') ?: getenv('GOOGLE_API_KEY');
if (!$apiKey) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'missing_api_key', 'message' => 'مفتاح Gemini غير مضبوط في متغيرات البيئة.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$model = safe_string($payload, 'model', 'gemini-2.5-flash', 80);
$allowedModels = ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'];
if (!in_array($model, $allowedModels, true)) {
    $model = 'gemini-2.5-flash';
}

$brief = [
    'product' => safe_string($payload, 'product', '', 4000),
    'audience' => safe_string($payload, 'audience', '', 2500),
    'goal' => safe_string($payload, 'goal', 'زيادة العملاء المحتملين', 300),
    'budget' => max(1000, min(5000000, (float) ($payload['budget'] ?? 50000))),
    'timeline' => safe_string($payload, 'timeline', '30 يوم', 80),
    'language' => safe_string($payload, 'language', 'العربية الفصحى مع نسخة إنجليزية', 120),
    'persona' => safe_string($payload, 'persona', 'مدير نمو لشركة سعودية متوسطة', 180),
    'scenario' => safe_string($payload, 'scenario', 'حملة تسويق سعودية', 240)
];

if (mb_strlen($brief['product']) < 12 || mb_strlen($brief['audience']) < 8) {
    http_response_code(422);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'brief_too_short', 'message' => 'أدخل وصف المنتج والجمهور المستهدف بتفاصيل كافية.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$temperature = max(0, min(1, (float) ($payload['temperature'] ?? 0.35)));
$maxTokens = max(2048, min(16384, (int) ($payload['maxTokens'] ?? 8192)));

$systemPrompt = <<<'PROMPT'
أنت مهندس نمو وتسويق مؤسسي يعمل لصالح BrightAI لبناء حملات تسويقية للسوق السعودي والشرق الأوسط.
مهمتك تحويل موجز قصير إلى حملة كاملة قابلة للتنفيذ خلال 30 يوماً: استراتيجية، شخصيات جمهور، منافسين، مزيج قنوات، محتوى متعدد القنوات، تقويم، توقعات أداء، وحلقة تحسين.
استخدم العربية الفصحى المهنية بلمسة سعودية خفيفة دون عبارات عامية مبالغ فيها ودون رموز تعبيرية.
التزم بالحساسية الثقافية والدينية في السعودية: لا تقترح صوراً أو رسائل غير لائقة، احترم القيم الإسلامية، راعِ اختلاف الشرائح المحافظة والحديثة، وتجنب ادعاءات صحية أو مالية غير مثبتة.
راعِ اختلاف المدن والمناطق: الرياض غالباً لقنوات B2B والفعاليات، جدة للتجارة ونمط الحياة، المنطقة الشرقية للصناعة والطاقة والأعمال العائلية، والمدن الأخرى حسب السياق.
استخدم مناسبات السعودية عند ملاءمتها: اليوم الوطني، يوم التأسيس، رمضان، العيد، الحج، والعودة للمدارس. لا تستغل المناسبات الدينية برسائل ضغط غير مناسبة.
لا تخترع ضمانات نتائج. كل أرقام الأداء تقديرية مع مجال ثقة، مبنية على الميزانية والقنوات والهدف.
أنتج أيضاً بدائل إنجليزية مختصرة داخل قطع المحتوى عند طلب المستخدم ذلك.
استخدم الأدوات المتاحة كتمثيل منطقي للتفكير دون الادعاء بوجود اتصال حقيقي:
- competitor_scan(brand): محاكاة فحص منافسين في السوق السعودي.
- keyword_research(seed): محاكاة بحث كلمات.
- audience_size(filters): محاكاة حجم جمهور.
- predict_performance(creative, audience, budget): نموذج توقع داخلي.
- schedule_post(content, channel, time): محاكاة جدولة محتوى.
أعد الناتج دائماً JSON صالحاً فقط مطابقاً للمخطط، دون Markdown ودون نص خارج JSON.
PROMPT;

$responseSchema = [
    'type' => 'object',
    'properties' => [
        'audience_personas' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'name' => ['type' => 'string'],
                    'age' => ['type' => 'string'],
                    'income_band' => ['type' => 'string'],
                    'location' => ['type' => 'string'],
                    'pain_points' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'channels' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'hooks' => ['type' => 'array', 'items' => ['type' => 'string']]
                ],
                'required' => ['name', 'age', 'income_band', 'location', 'pain_points', 'channels', 'hooks']
            ]
        ],
        'channel_mix' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'channel' => ['type' => 'string'],
                    'budget_pct' => ['type' => 'number'],
                    'expected_kpi' => ['type' => 'string']
                ],
                'required' => ['channel', 'budget_pct', 'expected_kpi']
            ]
        ],
        'competitive_landscape' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'name' => ['type' => 'string'],
                    'angle' => ['type' => 'string'],
                    'gap' => ['type' => 'string']
                ],
                'required' => ['name', 'angle', 'gap']
            ]
        ],
        'funnel_architecture' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'stage' => ['type' => 'string'],
                    'channels' => ['type' => 'string'],
                    'kpi' => ['type' => 'string']
                ],
                'required' => ['stage', 'channels', 'kpi']
            ]
        ],
        'content_pieces' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'type' => ['type' => 'string'],
                    'channel' => ['type' => 'string'],
                    'copy' => ['type' => 'string'],
                    'visual_brief' => ['type' => 'string'],
                    'cta' => ['type' => 'string'],
                    'hashtags' => ['type' => 'array', 'items' => ['type' => 'string']],
                    'posting_time' => ['type' => 'string']
                ],
                'required' => ['type', 'channel', 'copy', 'visual_brief', 'cta', 'hashtags', 'posting_time']
            ]
        ],
        'calendar' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'date' => ['type' => 'string'],
                    'hijri_date' => ['type' => 'string'],
                    'occasion' => ['type' => 'string'],
                    'content_id' => ['type' => 'string']
                ],
                'required' => ['date', 'hijri_date', 'occasion', 'content_id']
            ]
        ],
        'forecasts' => [
            'type' => 'object',
            'properties' => [
                'reach' => ['type' => 'number'],
                'impressions' => ['type' => 'number'],
                'clicks' => ['type' => 'number'],
                'conversions' => ['type' => 'number'],
                'ctr' => ['type' => 'number'],
                'cvr' => ['type' => 'number'],
                'cac' => ['type' => 'number'],
                'roas' => ['type' => 'number'],
                'confidence_interval' => ['type' => 'string'],
                'sensitivity_analysis' => ['type' => 'string']
            ],
            'required' => ['reach', 'impressions', 'clicks', 'conversions', 'ctr', 'cvr', 'cac', 'roas', 'confidence_interval', 'sensitivity_analysis']
        ],
        'optimization_loop' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'day' => ['type' => 'number'],
                    'action' => ['type' => 'string'],
                    'reason' => ['type' => 'string'],
                    'expected_impact' => ['type' => 'string']
                ],
                'required' => ['day', 'action', 'reason', 'expected_impact']
            ]
        ]
    ],
    'required' => ['audience_personas', 'channel_mix', 'competitive_landscape', 'funnel_architecture', 'content_pieces', 'calendar', 'forecasts', 'optimization_loop']
];

$request = [
    'systemInstruction' => ['parts' => [['text' => $systemPrompt]]],
    'contents' => [[
        'role' => 'user',
        'parts' => [[
            'text' => json_encode([
                'campaign_brief' => $brief,
                'required_outputs' => [
                    '3 audience personas with Saudi-specific details',
                    'named likely competitor categories in Saudi context inside hooks or copy when useful',
                    'parallel creative content for Instagram, X, LinkedIn, TikTok, WhatsApp, SMS, Google Ads, Email, Landing Page',
                    '30-day content calendar considering Saudi dates when relevant',
                    'performance forecast with confidence-aware conservative estimates',
                    '7-day optimization loop with spend rebalancing recommendations'
                ]
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
        ]]
    ]],
    'tools' => [[
        'functionDeclarations' => [
            ['name' => 'competitor_scan', 'description' => 'محاكاة فحص منافسين في السوق السعودي', 'parameters' => ['type' => 'object', 'properties' => ['brand' => ['type' => 'string']], 'required' => ['brand']]],
            ['name' => 'keyword_research', 'description' => 'محاكاة بحث كلمات تسويقية', 'parameters' => ['type' => 'object', 'properties' => ['seed' => ['type' => 'string']], 'required' => ['seed']]],
            ['name' => 'audience_size', 'description' => 'محاكاة تقدير حجم جمهور إعلاني', 'parameters' => ['type' => 'object', 'properties' => ['filters' => ['type' => 'string']], 'required' => ['filters']]],
            ['name' => 'predict_performance', 'description' => 'نموذج توقع أداء داخلي', 'parameters' => ['type' => 'object', 'properties' => ['creative' => ['type' => 'string'], 'audience' => ['type' => 'string'], 'budget' => ['type' => 'number']], 'required' => ['creative', 'audience', 'budget']]],
            ['name' => 'schedule_post', 'description' => 'محاكاة جدولة منشور', 'parameters' => ['type' => 'object', 'properties' => ['content' => ['type' => 'string'], 'channel' => ['type' => 'string'], 'time' => ['type' => 'string']], 'required' => ['content', 'channel', 'time']]]
        ]
    ]],
    'generationConfig' => [
        'temperature' => $temperature,
        'maxOutputTokens' => $maxTokens,
        'responseMimeType' => 'application/json',
        'responseSchema' => $responseSchema
    ]
];

$stream = (bool) ($payload['stream'] ?? true);
$method = $stream ? ':streamGenerateContent?alt=sse&key=' : ':generateContent?key=';
$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . $method . rawurlencode($apiKey);
$ch = curl_init($url);

if ($stream) {
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Accel-Buffering: no');
    $sseBuffer = '';
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_WRITEFUNCTION => static function ($curl, string $chunk) use (&$sseBuffer): int {
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
    if ($ok === false || $status < 200 || $status >= 300) {
        echo json_encode(['error' => 'gemini_stream_failed'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 60
]);

$result = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($result === false || $status < 200 || $status >= 300) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'gemini_proxy_failed', 'status' => $status, 'message' => $curlError ?: 'تعذر إكمال طلب Gemini.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$gemini = json_decode($result, true);
$text = $gemini['candidates'][0]['content']['parts'][0]['text'] ?? '';
$decoded = json_decode((string) $text, true);
if (!is_array($decoded)) {
    http_response_code(502);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'invalid_model_json', 'raw' => mb_substr((string) $text, 0, 1000)], JSON_UNESCAPED_UNICODE);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
