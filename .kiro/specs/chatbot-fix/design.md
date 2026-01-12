# Design Document: Chatbot Fix

## Overview

هذا التصميم يهدف إلى إصلاح الشات بوت العائم في الصفحة الرئيسية لموقع BrightAI. المشاكل الرئيسية المحددة:

1. **مشكلة API Key**: ملف `.env` يستخدم `EXPO_PUBLIC_GEMINI_API_KEY` بينما السيرفر يبحث عن `GEMINI_API_KEY`
2. **مشكلة الاتصال**: الشات بوت يحتاج سيرفر backend يعمل
3. **تحسينات الهاتف**: تحسين CSS للشاشات الصغيرة

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Browser)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chatbot Widget (chatbot.js)             │   │
│  │  - User Interface                                    │   │
│  │  - Message handling                                  │   │
│  │  - API calls to /api/ai/chat                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Gateway (Node.js)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              server/index.js                         │   │
│  │  - Express server                                    │   │
│  │  - Rate limiting                                     │   │
│  │  - Request validation                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         server/endpoints/chat.js                     │   │
│  │  - Chat endpoint handler                             │   │
│  │  - Gemini API integration                            │   │
│  │  - Error handling                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         server/config/index.js                       │   │
│  │  - Environment variable loading                      │   │
│  │  - Configuration validation                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Gemini API (Google)                       │
│  - generativelanguage.googleapis.com                        │
│  - Model: gemini-2.5-flash                                  │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Environment Configuration Fix

**المشكلة**: ملف `.env` يحتوي على:
```
EXPO_PUBLIC_GEMINI_API_KEY=GEMINI_KEY_REDACTED
```

**الحل**: إضافة المتغير الصحيح:
```
GEMINI_API_KEY=GEMINI_KEY_REDACTED
```

### 2. Server Configuration (server/config/index.js)

```javascript
// التكوين الحالي صحيح، يحتاج فقط المتغير الصحيح في .env
const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,  // ✓ صحيح
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  }
};
```

### 3. Mobile CSS Improvements (chatbot.css)

```css
@media (max-width: 480px) {
  .chatbot-widget {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }

  .chatbot-window {
    width: 100%;
    max-width: none;
    left: 0;
    right: 0;
    bottom: 70px;
    height: calc(100vh - 100px);
    max-height: none;
    border-radius: 12px;
  }

  .chatbot-input {
    min-height: 44px;  /* Touch target size */
    font-size: 16px;   /* Prevent zoom on iOS */
  }

  .chatbot-send {
    min-width: 44px;
    min-height: 44px;
  }
}
```

## Data Models

### Chat Request
```typescript
interface ChatRequest {
  message: string;      // رسالة المستخدم (max 1000 chars)
  history?: Message[];  // سجل المحادثة
  sessionId?: string;   // معرف الجلسة
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}
```

### Chat Response
```typescript
interface ChatResponse {
  reply: string;        // رد الذكاء الاصطناعي
  sessionId: string;    // معرف الجلسة
}

interface ErrorResponse {
  error: string;        // رسالة الخطأ بالعربية
  errorCode: string;    // كود الخطأ
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Key Configuration Loading
*For any* server startup, if GEMINI_API_KEY exists in environment variables, the config module SHALL successfully load and return it.
**Validates: Requirements 1.1, 5.1**

### Property 2: Arabic Error Messages
*For any* API error or missing configuration, the server SHALL return an error message in Arabic language.
**Validates: Requirements 1.3, 4.2**

### Property 3: Empty Message Rejection
*For any* message that is empty or contains only whitespace, the chatbot SHALL reject it and not send to the API.
**Validates: Requirements 3.4**

### Property 4: Loading State Management
*For any* message send operation, the input bar SHALL be disabled while waiting for response and re-enabled after.
**Validates: Requirements 3.3**

### Property 5: API Key Format Validation
*For any* API key that doesn't match the expected format (starts with "AIza"), the server SHALL reject it with appropriate error.
**Validates: Requirements 5.4**

## Error Handling

### Error Codes and Arabic Messages

| Error Code | Arabic Message | HTTP Status |
|------------|----------------|-------------|
| NO_MESSAGE | يرجى إدخال رسالة | 400 |
| MESSAGE_TOO_LONG | الرسالة طويلة جداً. الحد الأقصى هو 1000 حرف | 400 |
| API_NOT_CONFIGURED | خدمة الذكاء الاصطناعي غير متاحة حالياً | 503 |
| API_ERROR | عذراً، حدث خطأ. يرجى المحاولة مرة أخرى | 500 |
| NETWORK_ERROR | فشل الاتصال | 0 |
| RATE_LIMITED | تم تجاوز الحد المسموح. يرجى الانتظار | 429 |

### Retry Logic
- Maximum 3 retries for transient errors
- Exponential backoff: 1s, 2s, 4s
- User-facing retry button for manual retry

## Testing Strategy

### Unit Tests
- Test configuration loading with/without API key
- Test error message mapping
- Test input validation (empty, whitespace, too long)

### Property-Based Tests
- **Property 1**: Test config loading with various environment states
- **Property 2**: Test all error paths return Arabic messages
- **Property 3**: Test empty/whitespace message rejection
- **Property 5**: Test API key format validation

### Integration Tests
- Test full chat flow with mock Gemini API
- Test error handling end-to-end
- Test mobile responsive behavior

### Manual Tests
- Visual verification on mobile devices
- RTL text direction verification
- Touch target size verification
