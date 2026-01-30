# وثيقة التصميم: تحسينات مشروع BrightAI

## نظرة عامة

هذا التصميم يغطي التحسينات الشاملة لمشروع BrightAI، بما في ذلك إصلاح الأخطاء الحرجة، تحسين جودة الكود، إضافة اختبارات شاملة، وإضافة ميزات جديدة. التصميم يركز على الحفاظ على البنية الحالية مع تحسين الموثوقية والأداء.

### الأهداف الرئيسية

1. **إصلاح الأخطاء الحرجة**: تصحيح أخطاء API endpoints وPrompts
2. **تحسين الجودة**: إضافة اختبارات شاملة ومعالجة أخطاء محسنة
3. **تحسين الوثائق**: توفير وثائق واضحة للمطورين والمستخدمين
4. **إضافة ميزات**: واجهة تجريبية، caching، دعم PDF

### نطاق التصميم

- إصلاحات في ملفات: `server/endpoints/medical.js`, `server/endpoints/summary.js`
- تحديثات في: `README.md`, `package.json`, `.gitignore`
- إضافة اختبارات: Unit tests و Property-based tests
- إضافة وثائق API: OpenAPI/Swagger specification
- إضافة ميزات جديدة: Demo UI, Caching, PDF support

## البنية المعمارية

### البنية الحالية

```
BrightAI/
├── server/
│   ├── config/          # إعدادات النظام
│   ├── endpoints/       # API endpoints
│   ├── middleware/      # Rate limiter, CORS
│   ├── utils/           # وظائف مساعدة
│   └── index.js         # نقطة الدخول الرئيسية
├── frontend/            # موقع الويب الثابت
├── tests/               # الاختبارات (سيتم إضافتها)
└── docs/                # الوثائق (سيتم إضافتها)
```

### التحسينات المعمارية

1. **فصل المسؤوليات**: الحفاظ على فصل واضح بين endpoints، middleware، config
2. **قابلية الاختبار**: إضافة طبقة اختبارات شاملة
3. **قابلية التوسع**: إضافة caching layer و storage abstraction
4. **الوثائق**: إضافة OpenAPI spec و demo UI

## المكونات والواجهات

### 1. إصلاح Medical Endpoint

**الملف**: `server/endpoints/medical.js`

**المشكلة الحالية**:

```javascript
// السطر 35 - خطأ
const response = await fetch(
  `${config.gemini.baseUrl}/models/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
  // ...
);
```

المتغير `config.gemini.baseUrl` غير موجود في Config_Object. الصحيح هو `config.gemini.endpoint`.

**الحل المقترح**:

```javascript
// التصحيح
const response = await fetch(
  `${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
);
```

**الواجهة**:
- **Input**: نفس المدخلات الحالية (textParts, inlineDataParts, config)
- **Output**: نفس المخرجات الحالية (text string)
- **التغيير**: فقط تصحيح اسم المتغير

### 2. إصلاح Summary Prompt

**الملف**: `server/endpoints/summary.js`

**المشكلة الحالية**:
```javascript
const prompt = `
  Lese the following text and provide a concise, engaging summary in Arabic. 
  The summary should be suitable for a Saudi audience and highlight key value propositions.
  Use bullet points if appropriate.
  
  Text to summarize:
  ${text ? text.substring(0, 5000) : 'No text provided'}
`;
```

النص يحتوي على كلمة ألمانية "Lese" وباقي التعليمات بالإنجليزية.

**الحل المقترح**:

```javascript
const prompt = `
اقرأ النص التالي وقدم ملخصاً موجزاً وجذاباً باللغة العربية.
يجب أن يكون الملخص مناسباً للجمهور السعودي ويبرز القيم الأساسية بما يتماشى مع رؤية المملكة 2030.
استخدم النقاط إذا كان ذلك مناسباً.

النص المراد تلخيصه:
${text ? text.substring(0, 5000) : 'لم يتم تقديم نص'}
`;
```

**التحسينات**:
- نص عربي كامل
- إشارة صريحة لرؤية 2030
- رسائل خطأ عربية

### 3. معالجة حقل URL في Summary

**القرار التصميمي**: إزالة معالجة URL مؤقتاً

**السبب**:
- الكود الحالي يتحقق من وجود `url` لكن لا يعالجه
- إضافة معالجة URL تتطلب:
  - جلب محتوى الصفحة (HTTP client)
  - استخراج النص من HTML (parser)
  - معالجة أخطاء الشبكة
  - تحديد timeout مناسب

**الحل المقترح للمرحلة الحالية**:

```javascript
async function summaryHandler(req, res) {
  try {
    if (!isApiKeyConfigured()) {
      return res.status(503).json({ 
        error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
        errorCode: 'API_NOT_CONFIGURED'
      });
    }

    const { text } = req.body;

    // إزالة التحقق من url مؤقتاً
    if (!text) {
      return res.status(400).json({ 
        error: 'يجب تقديم نص للتلخيص',
        errorCode: 'MISSING_TEXT'
      });
    }

    // باقي الكود...
  }
}
```

**ملاحظة**: يمكن إضافة دعم URL في المتطلب 14 (دعم PDF) كجزء من نظام رفع ملفات شامل.

### 4. تحديث README.md

**البنية المقترحة**:

```markdown
# BrightAI - منصة الذكاء الاصطناعي للسوق السعودي

## نظرة عامة
[وصف المشروع وأهدافه]

## الميزات
- محادثة ذكية
- بحث ذكي
- تحليل طبي
- تلخيص نصوص

## التثبيت

### المتطلبات
- Node.js 18+
- npm أو yarn

### خطوات التثبيت
1. استنساخ المشروع
2. تثبيت التبعيات
3. إعداد ملف .env
4. تشغيل الخادم

## الإعداد

### ملف .env
[شرح كل متغير بيئة]

## الاستخدام

### أمثلة API
[أمثلة curl لكل endpoint]

## البنية المعمارية
[مخطط البنية]

## الاختبارات
[كيفية تشغيل الاختبارات]

## المساهمة
[إرشادات المساهمة]

## الترخيص
[معلومات الترخيص]
```

### 5. تنظيف package.json

**التبعيات الحالية**:
```json
{
  "dependencies": {
    "dotenv": "^16.5.0",
    "pdfjs-dist": "^5.3.31"  // غير مستخدم - سيتم إزالته
  }
}
```

**التبعيات المقترحة بعد التنظيف**:
```json
{
  "dependencies": {
    "dotenv": "^16.5.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "fast-check": "^3.15.0",
    "jsdom": "^23.0.0",
    "glob": "^10.3.10"
  }
}
```

**ملاحظة**: سيتم إعادة إضافة `pdfjs-dist` في المتطلب 14 عند تنفيذ دعم PDF.

### 6. بنية الاختبارات

**المجلدات المقترحة**:
```
tests/
├── unit/
│   ├── endpoints/
│   │   ├── chat.test.js
│   │   ├── search.test.js
│   │   ├── medical.test.js
│   │   └── summary.test.js
│   ├── middleware/
│   │   └── rateLimiter.test.js
│   └── config/
│       └── index.test.js
├── property/
│   ├── input-validation.property.test.js
│   ├── rate-limiter.property.test.js
│   └── error-handling.property.test.js
└── helpers/
    ├── mockGeminiApi.js
    └── testUtils.js
```

**نمط الاختبار**:

```javascript
// Unit Test Example
import { describe, it, expect, vi } from 'vitest';
import { summaryHandler } from '../../server/endpoints/summary.js';

describe('Summary Endpoint', () => {
  it('should return 400 when text is missing', async () => {
    const req = { body: {} };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    
    await summaryHandler(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'MISSING_TEXT'
      })
    );
  });
});
```

```javascript
// Property Test Example
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

describe('Input Validation Properties', () => {
  it('should reject all empty or whitespace-only inputs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === ''),
        (emptyText) => {
          const result = validateInput(emptyText);
          return result.isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 7. معالجة الأخطاء المحسنة

**بنية رسالة الخطأ الموحدة**:

```typescript
interface ErrorResponse {
  error: string;           // رسالة عربية واضحة
  errorCode: string;       // كود فريد للخطأ
  timestamp?: number;      // وقت حدوث الخطأ
  details?: any;          // تفاصيل إضافية (فقط في development)
}
```

**أكواد الأخطاء المقترحة**:

```javascript
const ERROR_CODES = {
  // Client Errors (4xx)
  MISSING_TEXT: { code: 'MISSING_TEXT', status: 400, message: 'يجب تقديم نص' },
  INVALID_JSON: { code: 'INVALID_JSON', status: 400, message: 'طلب غير صالح' },
  INVALID_IMAGE_DATA: { code: 'INVALID_IMAGE_DATA', status: 400, message: 'بيانات الصورة غير صالحة' },
  UNSUPPORTED_FILE_TYPE: { code: 'UNSUPPORTED_FILE_TYPE', status: 400, message: 'نوع الملف غير مدعوم' },
  BODY_TOO_LARGE: { code: 'BODY_TOO_LARGE', status: 413, message: 'الطلب كبير جداً' },
  RATE_LIMIT_EXCEEDED: { code: 'RATE_LIMIT_EXCEEDED', status: 429, message: 'تم تجاوز الحد المسموح' },
  
  // Server Errors (5xx)
  API_NOT_CONFIGURED: { code: 'API_NOT_CONFIGURED', status: 503, message: 'الخدمة غير متاحة حالياً' },
  ANALYSIS_ERROR: { code: 'ANALYSIS_ERROR', status: 500, message: 'حدث خطأ أثناء التحليل' },
  SERVER_ERROR: { code: 'SERVER_ERROR', status: 500, message: 'حدث خطأ في الخادم' }
};
```

**وظيفة مساعدة لإرجاع الأخطاء**:

```javascript
// server/utils/errorHandler.js
function sendError(res, errorCode, additionalDetails = null) {
  const error = ERROR_CODES[errorCode];
  
  const response = {
    error: error.message,
    errorCode: error.code,
    timestamp: Date.now()
  };
  
  // إضافة تفاصيل فقط في بيئة التطوير
  if (process.env.NODE_ENV === 'development' && additionalDetails) {
    response.details = additionalDetails;
  }
  
  return res.status(error.status).json(response);
}

module.exports = { sendError, ERROR_CODES };
```

### 8. وثائق OpenAPI

**الملف المقترح**: `docs/openapi.yaml`

**البنية**:

```yaml
openapi: 3.0.0
info:
  title: BrightAI API
  description: واجهة برمجة تطبيقات الذكاء الاصطناعي للسوق السعودي
  version: 1.0.0
  contact:
    name: BrightAI Support

servers:
  - url: http://localhost:3000
    description: خادم التطوير
  - url: https://api.brightai.sa
    description: خادم الإنتاج

paths:
  /api/ai/chat:
    post:
      summary: محادثة ذكية
      description: إرسال رسالة والحصول على رد من الذكاء الاصطناعي
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - message
              properties:
                message:
                  type: string
                  description: الرسالة المراد إرسالها
                  example: "ما هي رؤية 2030؟"
      responses:
        '200':
          description: استجابة ناجحة
          content:
            application/json:
              schema:
                type: object
                properties:
                  response:
                    type: string
                    description: رد الذكاء الاصطناعي
        '400':
          $ref: '#/components/responses/BadRequest'
        '429':
          $ref: '#/components/responses/RateLimitExceeded'
        '503':
          $ref: '#/components/responses/ServiceUnavailable'

components:
  responses:
    BadRequest:
      description: طلب غير صالح
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    RateLimitExceeded:
      description: تم تجاوز الحد المسموح من الطلبات
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
    ServiceUnavailable:
      description: الخدمة غير متاحة حالياً
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  
  schemas:
    Error:
      type: object
      properties:
        error:
          type: string
          description: رسالة الخطأ
        errorCode:
          type: string
          description: كود الخطأ
        timestamp:
          type: integer
          description: وقت حدوث الخطأ
```

**إضافة Swagger UI**:

```javascript
// server/index.js - إضافة endpoint للوثائق
const fs = require('fs');
const path = require('path');

// في handleRequest function
if (url === '/api/docs') {
  const swaggerHtml = generateSwaggerUI();
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(swaggerHtml);
  return;
}

if (url === '/api/docs/openapi.yaml') {
  const yamlContent = fs.readFileSync(
    path.join(__dirname, '../docs/openapi.yaml'),
    'utf8'
  );
  res.writeHead(200, { 'Content-Type': 'text/yaml' });
  res.end(yamlContent);
  return;
}

function generateSwaggerUI() {
  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>BrightAI API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.yaml',
      dom_id: '#swagger-ui',
    });
  </script>
</body>
</html>
  `;
}
```

### 9. تحسين .gitignore

**الملف المقترح**:

```gitignore
# Environment Variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Build Output
dist/
build/
.cache/

# IDE & Editor Files
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Test Coverage
coverage/
.nyc_output/

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Temporary Files
tmp/
temp/
*.tmp

# OS Files
Thumbs.db
.DS_Store
```

### 10. واجهة تجريبية (Demo UI)

**الملف المقترح**: `frontend/demo.html`

**المكونات**:

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BrightAI - تجربة الخدمات</title>
  <style>
    /* تصميم بسيط ونظيف */
  </style>
</head>
<body>
  <div class="container">
    <h1>BrightAI - تجربة الخدمات</h1>
    
    <div class="service-selector">
      <button onclick="selectService('chat')">محادثة ذكية</button>
      <button onclick="selectService('search')">بحث ذكي</button>
      <button onclick="selectService('medical')">تحليل طبي</button>
      <button onclick="selectService('summary')">تلخيص نصوص</button>
    </div>
    
    <div id="chat-form" class="service-form">
      <textarea id="chat-message" placeholder="اكتب رسالتك هنا..."></textarea>
      <button onclick="sendChat()">إرسال</button>
    </div>
    
    <div id="response-area"></div>
  </div>
  
  <script>
    async function sendChat() {
      const message = document.getElementById('chat-message').value;
      const responseArea = document.getElementById('response-area');
      
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          responseArea.innerHTML = `<div class="success">${data.response}</div>`;
        } else {
          responseArea.innerHTML = `<div class="error">${data.error}</div>`;
        }
      } catch (error) {
        responseArea.innerHTML = `<div class="error">حدث خطأ في الاتصال</div>`;
      }
    }
  </script>
</body>
</html>
```

### 11. نظام Caching

**التصميم المقترح**:

```javascript
// server/utils/cache.js

class CacheManager {
  constructor(options = {}) {
    this.storage = options.storage || 'memory'; // 'memory' or 'redis'
    this.ttl = options.ttl || 300; // 5 minutes default
    
    if (this.storage === 'memory') {
      this.cache = new Map();
    } else if (this.storage === 'redis') {
      // سيتم إضافة دعم Redis لاحقاً
      this.redisClient = options.redisClient;
    }
  }
  
  generateKey(endpoint, body) {
    const normalized = JSON.stringify(body, Object.keys(body).sort());
    return `${endpoint}:${this.hash(normalized)}`;
  }
  
  hash(str) {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  async get(key) {
    if (this.storage === 'memory') {
      const item = this.cache.get(key);
      if (!item) return null;
      
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return null;
      }
      
      return item.value;
    }
    // Redis implementation
    return null;
  }
  
  async set(key, value) {
    if (this.storage === 'memory') {
      this.cache.set(key, {
        value,
        expiry: Date.now() + (this.ttl * 1000)
      });
      
      // Limit cache size
      if (this.cache.size > 1000) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }
    // Redis implementation
  }
  
  async clear() {
    if (this.storage === 'memory') {
      this.cache.clear();
    }
  }
}

module.exports = { CacheManager };
```

**استخدام Cache في Endpoints**:

```javascript
// server/endpoints/summary.js
const { CacheManager } = require('../utils/cache');
const cache = new CacheManager({ ttl: 600 }); // 10 minutes

async function summaryHandler(req, res) {
  // Generate cache key
  const cacheKey = cache.generateKey('summary', req.body);
  
  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(cached);
  }
  
  // Process request
  // ...
  
  // Store in cache
  await cache.set(cacheKey, result);
  res.setHeader('X-Cache', 'MISS');
  
  return res.status(200).json(result);
}
```

### 12. تحسين Rate Limiter

**التصميم المقترح**:

```javascript
// server/middleware/rateLimiter.js

class RateLimiter {
  constructor(options = {}) {
    this.storage = options.storage || 'memory';
    this.requestsPerMinute = options.requestsPerMinute || 30;
    this.windowMs = options.windowMs || 60000;
    
    if (this.storage === 'memory') {
      this.requests = new Map();
    } else if (this.storage === 'redis') {
      this.redisClient = options.redisClient;
    }
  }
  
  async checkLimit(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (this.storage === 'memory') {
      // Get or create request log
      let requestLog = this.requests.get(identifier) || [];
      
      // Remove old requests
      requestLog = requestLog.filter(timestamp => timestamp > windowStart);
      
      // Check limit
      if (requestLog.length >= this.requestsPerMinute) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: requestLog[0] + this.windowMs
        };
      }
      
      // Add new request
      requestLog.push(now);
      this.requests.set(identifier, requestLog);
      
      return {
        allowed: true,
        remaining: this.requestsPerMinute - requestLog.length,
        resetAt: now + this.windowMs
      };
    }
    
    // Redis implementation would go here
    return { allowed: true, remaining: this.requestsPerMinute };
  }
  
  async cleanup() {
    if (this.storage === 'memory') {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      
      for (const [identifier, requestLog] of this.requests.entries()) {
        const filtered = requestLog.filter(timestamp => timestamp > windowStart);
        if (filtered.length === 0) {
          this.requests.delete(identifier);
        } else {
          this.requests.set(identifier, filtered);
        }
      }
    }
  }
}

// Cleanup every minute
setInterval(() => {
  rateLimiter.cleanup();
}, 60000);

module.exports = { RateLimiter };
```

### 13. دعم رفع ملفات PDF

**التصميم المقترح**:

```javascript
// server/endpoints/pdf-summary.js
const { config } = require('../config');

async function pdfSummaryHandler(req, res) {
  try {
    // Validate file upload
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({
        error: 'يجب رفع ملف PDF',
        errorCode: 'INVALID_CONTENT_TYPE'
      });
    }
    
    // Parse multipart form data (simple implementation)
    const pdfData = await parseMultipartPDF(req);
    
    // Validate file size (max 10MB)
    if (pdfData.size > 10 * 1024 * 1024) {
      return res.status(413).json({
        error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)',
        errorCode: 'FILE_TOO_LARGE'
      });
    }
    
    // Extract text from PDF
    const text = await extractTextFromPDF(pdfData.buffer);
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'فشل استخراج النص من الملف',
        errorCode: 'PDF_EXTRACTION_FAILED'
      });
    }
    
    // Generate summary using existing summary logic
    const summary = await generateSummary(text);
    
    return res.status(200).json({
      summary,
      extractedTextLength: text.length,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('[PDF Summary] Error:', error);
    return res.status(500).json({
      error: 'حدث خطأ أثناء معالجة الملف',
      errorCode: 'PDF_PROCESSING_ERROR'
    });
  }
}

async function extractTextFromPDF(buffer) {
  // سيتم استخدام pdfjs-dist هنا
  const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
  
  const loadingTask = pdfjsLib.getDocument({ data: buffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  
  return fullText;
}

module.exports = { pdfSummaryHandler };
```

## نماذج البيانات

### 1. نموذج الطلب (Request)

```typescript
interface ChatRequest {
  message: string;
  config?: {
    temperature?: number;
    max_output_tokens?: number;
  };
}

interface SearchRequest {
  query: string;
  config?: {
    temperature?: number;
    max_output_tokens?: number;
  };
}

interface MedicalRequest {
  textParts: string[];
  inlineDataParts?: Array<{
    mimeType: string;
    data: string; // base64
  }>;
  config?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_output_tokens?: number;
  };
}

interface SummaryRequest {
  text: string;
  config?: {
    temperature?: number;
    max_output_tokens?: number;
  };
}
```

### 2. نموذج الاستجابة (Response)

```typescript
interface SuccessResponse {
  // Varies by endpoint
  response?: string;      // chat, search
  text?: string;          // medical
  summary?: string;       // summary
  timestamp?: number;
}

interface ErrorResponse {
  error: string;
  errorCode: string;
  timestamp: number;
  details?: any; // only in development
}
```

### 3. نموذج الإعدادات (Config)

```typescript
interface Config {
  gemini: {
    apiKey: string;
    model: string;
    endpoint: string;
  };
  server: {
    port: number;
    nodeEnv: string;
  };
  rateLimit: {
    requestsPerMinute: number;
    windowMs: number;
  };
  validation: {
    maxInputLength: number;
  };
  cache?: {
    enabled: boolean;
    storage: 'memory' | 'redis';
    ttl: number;
  };
}
```


## خصائص الصحة (Correctness Properties)

الخاصية هي سمة أو سلوك يجب أن يكون صحيحاً عبر جميع عمليات التنفيذ الصالحة للنظام - في الأساس، بيان رسمي حول ما يجب أن يفعله النظام. تعمل الخصائص كجسر بين المواصفات المقروءة للإنسان وضمانات الصحة القابلة للتحقق آلياً.

### الخاصية 1: اتساق بناء URL لـ Gemini API

*لأي* endpoint يستدعي Gemini API، يجب أن يستخدم `config.gemini.endpoint` لبناء URL، ويجب أن يتبع النمط:
`${config.gemini.endpoint}/${config.gemini.model}:generateContent?key=${config.gemini.apiKey}`

**يتحقق من: المتطلبات 1.2**

### الخاصية 2: بنية استجابة HTTP صحيحة

*لأي* استجابة من أي endpoint، يجب أن:
- تكون JSON صالح قابل للتحليل
- تحتوي على CORS headers الصحيحة (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`)
- تحتوي على `Content-Type: application/json`

**يتحقق من: المتطلبات 6.3، 6.4**

### الخاصية 3: رفض المدخلات غير الصالحة

*لأي* مدخل غير صالح (نص فارغ، JSON غير صالح، نوع ملف غير مدعوم، حجم ملف كبير جداً)، يجب أن يرفضه النظام ويرجع استجابة خطأ مناسبة مع status code 400 أو 413.

**يتحقق من: المتطلبات 7.2**

### الخاصية 4: احترام حدود Rate Limiter

*لأي* تسلسل من الطلبات من نفس المعرّف (IP address)، إذا تجاوز عدد الطلبات `requestsPerMinute` خلال نافذة زمنية `windowMs`، يجب أن يرفض النظام الطلبات الإضافية مع status code 429.

**يتحقق من: المتطلبات 7.3**

### الخاصية 5: بنية استجابة الخطأ الموحدة

*لأي* خطأ يحدث في النظام، يجب أن تحتوي استجابة الخطأ على:
- رسالة خطأ عربية واضحة في حقل `error`
- كود خطأ فريد في حقل `errorCode`
- HTTP status code مناسب (400 للأخطاء في المدخلات، 429 لتجاوز الحد، 500 لأخطاء الخادم، 503 للخدمة غير متاحة)
- timestamp في حقل `timestamp`

**يتحقق من: المتطلبات 8.1، 8.2، 8.4**

### الخاصية 6: استمرارية بيانات Rate Limiter

*لأي* تسلسل من الطلبات، إذا تم إعادة تشغيل الخادم في منتصف النافذة الزمنية، يجب أن يحتفظ النظام بعدد الطلبات السابقة (عند استخدام Redis storage) ويستمر في تطبيق الحدود بشكل صحيح.

**يتحقق من: المتطلبات 12.1**

### الخاصية 7: Cache يخدم الطلبات المتطابقة

*لأي* طلبين متطابقين (نفس endpoint ونفس body) يتم إرسالهما خلال فترة TTL، يجب أن:
- يعالج الطلب الأول ويخزن النتيجة في cache
- يخدم الطلب الثاني من cache دون استدعاء Gemini API
- يضيف header `X-Cache: HIT` للطلب الثاني
- يضيف header `X-Cache: MISS` للطلب الأول

**يتحقق من: المتطلبات 13.1، 13.3**

### الخاصية 8: استخراج نص من PDF صالح

*لأي* ملف PDF صالح يتم رفعه، يجب أن يستخرج النظام نصاً غير فارغ من الملف، أو يرجع خطأ واضح إذا فشل الاستخراج.

**يتحقق من: المتطلبات 14.1**

### الخاصية 9: التحقق من نوع وحجم الملف

*لأي* ملف يتم رفعه، يجب أن:
- يتحقق النظام من أن نوع الملف هو `application/pdf`
- يتحقق من أن حجم الملف لا يتجاوز 10MB
- يرفض الملف مع رسالة خطأ واضحة إذا فشل أي من الشرطين

**يتحقق من: المتطلبات 14.3**

### الخاصية 10: حذف الملفات المؤقتة

*لأي* ملف مؤقت يتم إنشاؤه أثناء معالجة PDF، يجب أن يحذفه النظام بعد اكتمال المعالجة (سواء نجحت أو فشلت)، لتجنب تراكم الملفات.

**يتحقق من: المتطلبات 14.5**

## معالجة الأخطاء

### استراتيجية معالجة الأخطاء

1. **التحقق من المدخلات**: التحقق من جميع المدخلات قبل المعالجة
2. **رسائل خطأ واضحة**: استخدام رسائل عربية واضحة مع أكواد خطأ فريدة
3. **تسجيل الأخطاء**: تسجيل تفاصيل الأخطاء في console للتشخيص
4. **عدم كشف معلومات حساسة**: عدم إرجاع stack traces أو تفاصيل داخلية للمستخدم
5. **HTTP status codes مناسبة**: استخدام status codes صحيحة لكل نوع خطأ

### أنواع الأخطاء

#### أخطاء المدخلات (4xx)

```javascript
// 400 Bad Request
{
  error: 'يجب تقديم نص للتلخيص',
  errorCode: 'MISSING_TEXT',
  timestamp: 1234567890
}

// 413 Payload Too Large
{
  error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)',
  errorCode: 'FILE_TOO_LARGE',
  timestamp: 1234567890
}

// 429 Too Many Requests
{
  error: 'تم تجاوز الحد المسموح من الطلبات',
  errorCode: 'RATE_LIMIT_EXCEEDED',
  timestamp: 1234567890,
  retryAfter: 30 // seconds
}
```

#### أخطاء الخادم (5xx)

```javascript
// 500 Internal Server Error
{
  error: 'حدث خطأ في الخادم',
  errorCode: 'SERVER_ERROR',
  timestamp: 1234567890
}

// 503 Service Unavailable
{
  error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً',
  errorCode: 'API_NOT_CONFIGURED',
  timestamp: 1234567890
}
```

### معالجة أخطاء Gemini API

```javascript
async function handleGeminiError(error, res) {
  console.error('[Gemini API Error]', {
    message: error.message,
    timestamp: new Date().toISOString()
    // لا نسجل API key أو بيانات حساسة
  });
  
  // إرجاع رسالة عامة للمستخدم
  return res.status(500).json({
    error: 'حدث خطأ أثناء التحليل',
    errorCode: 'ANALYSIS_ERROR',
    timestamp: Date.now()
  });
}
```

## استراتيجية الاختبار

### نهج الاختبار المزدوج

يستخدم المشروع نهجاً مزدوجاً للاختبار يجمع بين:

1. **Unit Tests**: للتحقق من أمثلة محددة، حالات حدية، وشروط الأخطاء
2. **Property-Based Tests**: للتحقق من الخصائص العامة عبر مدخلات متعددة مولدة عشوائياً

كلا النوعين ضروري ومكمل لبعضهما:
- Unit tests تكشف أخطاء محددة وتوثق السلوك المتوقع
- Property tests تتحقق من الصحة العامة عبر نطاق واسع من المدخلات

### مكتبات الاختبار

- **Vitest**: إطار الاختبار الرئيسي
- **fast-check**: مكتبة property-based testing
- **jsdom**: لاختبار واجهات المستخدم

### تكوين Property Tests

كل property test يجب أن:
- يشغل **100 تكرار على الأقل** (بسبب العشوائية)
- يحتوي على تعليق يشير إلى الخاصية في وثيقة التصميم
- يستخدم format: `// Feature: brightai-improvements, Property N: [نص الخاصية]`

### أمثلة الاختبارات

#### Unit Test Example

```javascript
// tests/unit/endpoints/summary.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { summaryHandler } from '../../../server/endpoints/summary.js';

describe('Summary Endpoint - Unit Tests', () => {
  let mockReq, mockRes;
  
  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn()
    };
  });
  
  it('should return 400 when text is missing', async () => {
    mockReq.body = {};
    
    await summaryHandler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'MISSING_TEXT',
        error: expect.stringContaining('نص')
      })
    );
  });
  
  it('should return 503 when API key is not configured', async () => {
    // Mock config without API key
    mockReq.body = { text: 'test' };
    
    await summaryHandler(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(503);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        errorCode: 'API_NOT_CONFIGURED'
      })
    );
  });
});
```

#### Property Test Example

```javascript
// tests/property/input-validation.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateTextInput } from '../../server/utils/validation.js';

describe('Input Validation - Property Tests', () => {
  // Feature: brightai-improvements, Property 3: رفض المدخلات غير الصالحة
  it('should reject all empty or whitespace-only inputs', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s.trim() === ''),
        (emptyText) => {
          const result = validateTextInput(emptyText);
          return result.isValid === false && result.errorCode === 'MISSING_TEXT';
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: brightai-improvements, Property 3: رفض المدخلات غير الصالحة
  it('should reject inputs exceeding max length', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1001 }),
        (longText) => {
          const result = validateTextInput(longText, { maxLength: 1000 });
          return result.isValid === false && result.errorCode === 'TEXT_TOO_LONG';
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test for Rate Limiter

```javascript
// tests/property/rate-limiter.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { RateLimiter } from '../../server/middleware/rateLimiter.js';

describe('Rate Limiter - Property Tests', () => {
  // Feature: brightai-improvements, Property 4: احترام حدود Rate Limiter
  it('should block requests exceeding the limit', async () => {
    const limiter = new RateLimiter({
      requestsPerMinute: 5,
      windowMs: 60000
    });
    
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 6, max: 20 }),
        async (numRequests) => {
          const identifier = `test-${Date.now()}`;
          let blockedCount = 0;
          
          for (let i = 0; i < numRequests; i++) {
            const result = await limiter.checkLimit(identifier);
            if (!result.allowed) {
              blockedCount++;
            }
          }
          
          // Should block at least (numRequests - 5) requests
          return blockedCount >= (numRequests - 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test for Error Responses

```javascript
// tests/property/error-handling.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sendError, ERROR_CODES } from '../../server/utils/errorHandler.js';

describe('Error Handling - Property Tests', () => {
  // Feature: brightai-improvements, Property 5: بنية استجابة الخطأ الموحدة
  it('should return consistent error structure for all error types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(ERROR_CODES)),
        (errorCode) => {
          const mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
          };
          
          sendError(mockRes, errorCode);
          
          const response = mockRes.json.mock.calls[0][0];
          
          return (
            typeof response.error === 'string' &&
            response.error.length > 0 &&
            response.errorCode === errorCode &&
            typeof response.timestamp === 'number' &&
            mockRes.status.mock.calls[0][0] >= 400
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

#### Property Test for Cache

```javascript
// tests/property/cache.property.test.js
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { CacheManager } from '../../server/utils/cache.js';

describe('Cache - Property Tests', () => {
  // Feature: brightai-improvements, Property 7: Cache يخدم الطلبات المتطابقة
  it('should serve identical requests from cache', async () => {
    const cache = new CacheManager({ ttl: 60 });
    
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        fc.object(),
        async (endpoint, body) => {
          const key = cache.generateKey(endpoint, body);
          const value = { result: 'test' };
          
          // First request - cache miss
          const firstResult = await cache.get(key);
          expect(firstResult).toBeNull();
          
          // Store in cache
          await cache.set(key, value);
          
          // Second request - cache hit
          const secondResult = await cache.get(key);
          expect(secondResult).toEqual(value);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### تغطية الاختبارات

يجب أن تغطي الاختبارات:

1. **جميع Endpoints**: chat, search, medical, summary, pdf-summary
2. **جميع حالات الخطأ**: مدخلات فارغة، API key مفقود، rate limit exceeded
3. **Middleware**: rate limiter, CORS
4. **Utilities**: cache, error handler, validation
5. **Integration**: تدفقات كاملة من الطلب إلى الاستجابة

### تشغيل الاختبارات

```bash
# تشغيل جميع الاختبارات مرة واحدة
npm test

# تشغيل الاختبارات في وضع المراقبة
npm run test:watch

# تشغيل اختبارات محددة
npm test -- tests/unit/endpoints/

# تشغيل property tests فقط
npm test -- tests/property/
```

## الخلاصة

هذا التصميم يوفر خطة شاملة لتحسين مشروع BrightAI من خلال:

1. **إصلاح الأخطاء الحرجة**: تصحيح أخطاء API endpoints وprompts
2. **تحسين الجودة**: إضافة اختبارات شاملة ومعالجة أخطاء محسنة
3. **تحسين الوثائق**: README شامل ووثائق OpenAPI تفاعلية
4. **إضافة ميزات**: واجهة تجريبية، caching، دعم PDF

التصميم يحافظ على البنية الحالية مع إضافة طبقات جديدة للاختبار والتخزين المؤقت والوثائق. جميع التحسينات قابلة للتنفيذ بشكل تدريجي دون تعطيل الوظائف الحالية.
