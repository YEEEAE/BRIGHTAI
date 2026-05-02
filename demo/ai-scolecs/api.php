<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$ip = preg_replace('/[^0-9a-fA-F:\., ]/', '', (string) $ip);
$bucket = sys_get_temp_dir() . '/brightai_ai_scolecs_' . sha1($ip) . '.json';
$now = time();
$window = 60;
$limit = 10;
$hits = [];
// تحديد معدل بسيط لكل عنوان IP: عشرة طلبات في الدقيقة.
if (is_file($bucket)) {
    $hits = json_decode((string) file_get_contents($bucket), true) ?: [];
    $hits = array_values(array_filter($hits, fn($hit) => is_int($hit) && $hit > $now - $window));
}
if (count($hits) >= $limit) {
    http_response_code(429);
    echo json_encode(['error' => 'rate_limited', 'message' => 'تجاوزت الحد المسموح: 10 طلبات في الدقيقة.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$hits[] = $now;
file_put_contents($bucket, json_encode($hits));

$raw = file_get_contents('php://input') ?: '';
if (strlen($raw) > 120000) {
    http_response_code(413);
    echo json_encode(['error' => 'payload_too_large'], JSON_UNESCAPED_UNICODE);
    exit;
}

$payload = json_decode($raw, true);
if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_json'], JSON_UNESCAPED_UNICODE);
    exit;
}

// تنقية أولية للأنماط الحساسة قبل إرسال الطلب إلى Gemini.
function redact_pii(mixed $value): mixed {
    if (is_array($value)) {
        return array_map('redact_pii', $value);
    }
    if (!is_string($value)) {
        return $value;
    }
    $value = preg_replace('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/iu', '[REDACTED_EMAIL]', $value);
    $value = preg_replace('/(?:\+?966|0)?5\d{8}/u', '[REDACTED_PHONE]', $value);
    $value = preg_replace('/\b[12]\d{9}\b/u', '[REDACTED_NATIONAL_ID]', $value);
    return trim($value);
}

$payload = redact_pii($payload);
$persona = $payload['persona'] ?? 'student';
$mode = $payload['mode'] ?? 'tutor';
$allowedPersonas = ['student', 'teacher', 'admin'];
if (!in_array($persona, $allowedPersonas, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'invalid_persona'], JSON_UNESCAPED_UNICODE);
    exit;
}

$model = $payload['settings']['model'] ?? 'gemini-2.5-flash';
$allowedModels = ['gemini-2.5-flash', 'gemini-2.5-flash-thinking'];
if (!in_array($model, $allowedModels, true)) {
    $model = 'gemini-2.5-flash';
}

$apiKey = getenv('GEMINI_API_KEY');
if (!$apiKey) {
    http_response_code(503);
    echo json_encode(['error' => 'missing_gemini_api_key', 'message' => 'GEMINI_API_KEY غير مضبوط على الخادم.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// تعليمات نظام منفصلة لكل شخصية حتى يتغير السلوك التربوي فعلياً.
$studentPrompt = <<<'PROMPT'
أنت مرشد تعليمي سعودي للطلاب. لا تعط الإجابة مباشرة أبداً. استخدم الطريقة السقراطية: اسأل سؤالاً قائداً واحداً في كل مرة، وارفع مستوى التلميح تدريجياً حسب رد الطالب. اجعل اللغة عربية واضحة ومناسبة لعمر الطالب. اربط كل مخرج برمز تعلم سعودي مثل SCI-G7-LO-3.2. التزم بالقيم الثقافية السعودية، واستخدم أمثلة إسلامية أو محلية عندما تكون مناسبة تعليمياً دون مبالغة. لا تنتج صوراً أو أمثلة غير مناسبة. إذا وجدت بيانات شخصية، تجاهلها واطلب استخدام بيانات منزوعة الحساسية. أخرج JSON صالحاً فقط حسب المخطط.
PROMPT;

$teacherPrompt = <<<'PROMPT'
أنت مساعد معلم خبير في مناهج وزارة التعليم السعودية. أنشئ خطط دروس واختبارات وتصحيح واجبات وتواصل ولي أمر بصورة عملية قابلة للاعتماد. عند التصحيح من صورة أو نص واجب، أعط ملاحظات بنمط قلم أحمر بنّاء دون إهانة الطالب. وزع الأسئلة على تصنيف بلوم عند الطلب، واربط كل نشاط برمز تعلم سعودي. حافظ على الخصوصية ولا تذكر أسماء حقيقية. التزم بالثقافة السعودية والقيم الإسلامية عند اختيار الأمثلة. أخرج JSON صالحاً فقط حسب المخطط.
PROMPT;

$adminPrompt = <<<'PROMPT'
أنت محلل بيانات تعليمية لإدارة مدرسة في السعودية. اعرض المؤشرات بشكل تجميعي ومجهول الهوية، وحدد الفصول والمواد المعرضة للتعثر، وخريطة تغطية المنهج، ومؤشرات أداء معلمين تجميعية دون استهداف أفراد. اربط كل توصية بمخرج تعلم أو مؤشر تشغيلي. راع PDPL السعودي ومبدأ أقل قدر من البيانات وسجل التدقيق. أخرج JSON صالحاً فقط حسب المخطط.
PROMPT;

$prompts = [
    'student' => $studentPrompt,
    'teacher' => $teacherPrompt,
    'admin' => $adminPrompt,
];

// مخطط استجابة موحد يسمح للواجهة برسم مخرجات مرئية بدلاً من نص حر.
$schema = [
    'type' => 'OBJECT',
    'properties' => [
        'persona' => ['type' => 'STRING'],
        'curriculum_code' => ['type' => 'STRING'],
        'confidence' => ['type' => 'NUMBER'],
        'pedagogical_strategy' => ['type' => 'STRING'],
        'guiding_question' => ['type' => 'STRING'],
        'hint_level' => ['type' => 'INTEGER'],
        'scaffolding_visual' => ['type' => 'STRING'],
        'next_difficulty_recommendation' => ['type' => 'STRING', 'enum' => ['easier', 'same', 'harder']],
        'practice' => [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'question' => ['type' => 'STRING'],
                    'answer' => ['type' => 'STRING'],
                    'explanation' => ['type' => 'STRING']
                ]
            ]
        ],
        'weakness_detector' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
        'lesson_plan' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
        'bloom_distribution' => [
            'type' => 'OBJECT',
            'properties' => [
                'remember' => ['type' => 'INTEGER'],
                'understand' => ['type' => 'INTEGER'],
                'apply' => ['type' => 'INTEGER'],
                'analyze' => ['type' => 'INTEGER'],
                'evaluate' => ['type' => 'INTEGER']
            ]
        ],
        'grading_feedback' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
        'parent_draft' => ['type' => 'STRING'],
        'cohort_summary' => [
            'type' => 'OBJECT',
            'properties' => [
                'high_risk' => ['type' => 'INTEGER'],
                'medium_risk' => ['type' => 'INTEGER'],
                'low_risk' => ['type' => 'INTEGER'],
                'underperforming_subjects' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']]
            ]
        ],
        'early_warning' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']],
        'heatmap' => [
            'type' => 'ARRAY',
            'items' => [
                'type' => 'OBJECT',
                'properties' => [
                    'subject' => ['type' => 'STRING'],
                    'coverage' => ['type' => 'INTEGER'],
                    'risk' => ['type' => 'STRING']
                ]
            ]
        ],
        'teacher_insights' => ['type' => 'ARRAY', 'items' => ['type' => 'STRING']]
    ],
    'required' => ['persona', 'curriculum_code', 'confidence']
];

$request = [
    'systemInstruction' => [
        'parts' => [['text' => $prompts[$persona]]]
    ],
    'contents' => [[
        'role' => 'user',
        'parts' => [[
            'text' => json_encode([
                'persona' => $persona,
                'mode' => $mode,
                'input' => $payload['input'] ?? [],
                'curriculumMap' => $payload['curriculumMap'] ?? [],
                'classSeed' => $payload['classSeed'] ?? [],
                'instruction' => 'أعد مخرجاً تعليمياً منظماً ومختصراً صالحاً للعرض في واجهة عربية.'
            ], JSON_UNESCAPED_UNICODE)
        ]]
    ]],
    'generationConfig' => [
        'temperature' => (float) ($payload['settings']['temperature'] ?? 0.35),
        'maxOutputTokens' => (int) ($payload['settings']['maxTokens'] ?? 1800),
        'responseMimeType' => 'application/json',
        'responseSchema' => $schema
    ],
    'tools' => [[
        'functionDeclarations' => [[
            'name' => 'lookup_curriculum_outcome',
            'description' => 'يرجع مخرج التعلم السعودي الأقرب للموضوع والصف.',
            'parameters' => [
                'type' => 'OBJECT',
                'properties' => [
                    'subject' => ['type' => 'STRING'],
                    'grade' => ['type' => 'STRING'],
                    'topic' => ['type' => 'STRING']
                ],
                'required' => ['subject', 'grade', 'topic']
            ]
        ]]
    ]]
];

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' . rawurlencode($model) . ':streamGenerateContent?alt=sse&key=' . rawurlencode($apiKey);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($request, JSON_UNESCAPED_UNICODE),
    CURLOPT_WRITEFUNCTION => function ($ch, string $chunk): int {
        $lines = preg_split('/\R/', $chunk);
        foreach ($lines as $line) {
            if (str_starts_with($line, 'data: ')) {
                $json = json_decode(substr($line, 6), true);
                $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                if ($text !== '') {
                    echo $text;
                    @ob_flush();
                    flush();
                }
            }
        }
        return strlen($chunk);
    },
    CURLOPT_TIMEOUT => 45,
]);

$ok = curl_exec($ch);
if ($ok === false) {
    http_response_code(502);
    echo json_encode(['error' => 'gemini_proxy_failed', 'message' => curl_error($ch)], JSON_UNESCAPED_UNICODE);
}
curl_close($ch);
