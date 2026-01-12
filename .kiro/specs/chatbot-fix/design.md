# Design Document: Chatbot Fix & Mobile Optimization Audit

## Overview

هذا التصميم يهدف إلى إجراء تدقيق شامل وإصلاح الشات بوت العائم في الصفحة الرئيسية لموقع BrightAI، مع التركيز على:

1. **التحقق من ربط Gemini API**: التأكد من صحة الاتصال والتكوين
2. **تحسين الهاتف المحمول**: إصلاح مشاكل العرض على الشاشات الصغيرة
3. **الأمان**: التأكد من عدم تسريب مفاتيح API
4. **الأداء**: تحسين سرعة التحميل وتجربة المستخدم

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
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chatbot Styles (chatbot.css)            │   │
│  │  - Glassmorphism design                              │   │
│  │  - RTL support                                       │   │
│  │  - Mobile responsive breakpoints                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Server Gateway (Node.js)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              server/index.js                         │   │
│  │  - Express server on port 3000                       │   │
│  │  - Rate limiting (30 req/min)                        │   │
│  │  - Request validation                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         server/endpoints/chat.js                     │   │
│  │  - Chat endpoint handler                             │   │
│  │  - Gemini API integration                            │   │
│  │  - Error handling with Arabic messages               │   │
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

### 1. Environment Configuration

**Current State Analysis**:
- `.env` file should contain `GEMINI_API_KEY`
- Server config reads from `process.env.GEMINI_API_KEY`
- API key format: starts with "AIza" (Google API key format)

**Required Configuration**:
```bash
# .env file
GEMINI_API_KEY=AIzaSy...your_key_here
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
NODE_ENV=production
RATE_LIMIT_REQUESTS_PER_MINUTE=30
```

### 2. Server Configuration (server/config/index.js)

```javascript
const config = {
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  rateLimit: {
    requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE, 10) || 30,
    windowMs: 60 * 1000
  },
  validation: {
    maxInputLength: 1000
  }
};
```

### 3. Mobile CSS Improvements (chatbot.css)

**Current Issues Identified**:
- Chatbot window may overflow on very small screens (390px)
- Input field font size may cause iOS zoom
- Touch targets may be too small

**Required CSS Fixes**:

```css
/* Base mobile styles (< 480px) */
@media (max-width: 480px) {
  .chatbot-widget {
    bottom: 10px;
    left: 10px;
    right: 10px;
  }

  .chatbot-window {
    width: calc(100vw - 20px);
    max-width: none;
    left: 0;
    right: 0;
    bottom: 70px;
    height: calc(100vh - 100px);
    max-height: calc(100vh - 100px);
    border-radius: 12px;
  }

  .chatbot-input {
    min-height: 44px;
    font-size: 16px; /* Prevents iOS zoom */
    padding: 12px 16px;
  }

  .chatbot-send {
    min-width: 44px;
    min-height: 44px;
  }

  .chatbot-toggle {
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
  }

  .chatbot-message {
    font-size: 14px;
    max-width: 90%;
  }
}

/* Small phones (390px - iPhone 12 mini, etc.) */
@media (max-width: 390px) {
  .chatbot-window {
    width: calc(100vw - 16px);
    left: 8px;
    right: 8px;
    bottom: 65px;
    height: calc(100vh - 90px);
  }

  .chatbot-header {
    padding: 12px 16px;
  }

  .chatbot-messages {
    padding: 12px;
  }

  .chatbot-input-area {
    padding: 12px;
    gap: 8px;
  }
}

/* Medium phones (430px - iPhone 14 Pro Max, etc.) */
@media (min-width: 391px) and (max-width: 430px) {
  .chatbot-window {
    width: calc(100vw - 20px);
    height: calc(100vh - 95px);
  }
}

/* Tablets (768px) */
@media (min-width: 481px) and (max-width: 768px) {
  .chatbot-window {
    width: 380px;
    max-width: calc(100vw - 40px);
    height: 500px;
    max-height: calc(100vh - 120px);
  }
}
```

### 4. Navbar Mobile Improvements (css/unified-nav.css)

**Required Fixes**:
- Ensure hamburger menu works correctly
- Dropdown menus should be scrollable
- Touch targets minimum 44px
- No overlap with chatbot

## Data Models

### Chat Request
```typescript
interface ChatRequest {
  message: string;      // رسالة المستخدم (max 1000 chars)
  history?: Message[];  // سجل المحادثة (last 10 messages)
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
*For any* server startup, if GEMINI_API_KEY exists in environment variables and is not "YOUR_KEY_HERE", the config module SHALL successfully load and return it as configured.
**Validates: Requirements 1.1, 6.1, 6.3**

### Property 2: Arabic Error Messages
*For any* API error or missing configuration, the server SHALL return an error message that contains Arabic characters (Unicode range 0600-06FF).
**Validates: Requirements 1.3, 5.2, 5.4**

### Property 3: Empty Message Rejection
*For any* message that is empty string or contains only whitespace characters, the chatbot sendMessage function SHALL not make an API call and SHALL return early.
**Validates: Requirements 4.4**

### Property 4: Loading State Management
*For any* message send operation, the isLoading state SHALL be true while waiting for response and false after response or error.
**Validates: Requirements 4.3**

### Property 5: API Key Security
*For any* response from the Server_Gateway, the response body and headers SHALL NOT contain the GEMINI_API_KEY value.
**Validates: Requirements 1.5, 6.5, 6.6**

### Property 6: Mobile Touch Target Size
*For any* interactive element in the Chatbot_Widget when viewport width is less than 480px, the computed min-width and min-height SHALL be at least 44px.
**Validates: Requirements 2.2, 3.3**

### Property 7: Viewport Overflow Prevention
*For any* viewport width between 320px and 768px, the Chatbot_Widget window SHALL have computed width less than or equal to viewport width minus safe margins.
**Validates: Requirements 2.3, 8.2, 8.3, 8.4**

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
| UNAUTHORIZED | خدمة غير متاحة | 401/403 |

### Retry Logic
- Maximum 3 retries for transient errors (5xx, network errors)
- Exponential backoff: 1s, 2s, 4s
- No retry for client errors (4xx except 429)
- User-facing retry button for manual retry

## Testing Strategy

### Unit Tests
- Test configuration loading with/without API key
- Test error message mapping to Arabic
- Test input validation (empty, whitespace, too long)
- Test session ID generation

### Property-Based Tests
- **Property 1**: Test config loading with various environment states (100+ iterations)
- **Property 2**: Test all error paths return Arabic messages (100+ iterations)
- **Property 3**: Test empty/whitespace message rejection with generated strings (100+ iterations)
- **Property 5**: Test API key not leaked in responses (100+ iterations)

### Integration Tests
- Test full chat flow with mock Gemini API
- Test error handling end-to-end
- Test rate limiting behavior

### Visual/Manual Tests
- Mobile responsive behavior at 390px, 430px, 768px
- RTL text direction verification
- Touch target size verification (44px minimum)
- Chatbot open/close animations
- Navbar hamburger menu functionality

### Security Tests
- Verify no API keys in client-side code
- Verify no API keys in network responses
- Verify rate limiting works correctly

## Implementation Checklist

### Critical Fixes
- [ ] Verify .env has correct GEMINI_API_KEY variable
- [ ] Test server starts and loads API key correctly
- [ ] Test chatbot can send/receive messages
- [ ] Fix mobile CSS overflow issues
- [ ] Ensure 44px touch targets on mobile

### Mobile Optimization
- [ ] Add 390px breakpoint styles
- [ ] Add 430px breakpoint styles
- [ ] Fix input font-size to 16px (prevent iOS zoom)
- [ ] Test navbar hamburger menu
- [ ] Verify no horizontal scroll

### Security Verification
- [ ] Audit chatbot.js for hardcoded keys
- [ ] Audit server responses for key leakage
- [ ] Verify rate limiting is active

### Performance
- [ ] Verify defer attribute on scripts
- [ ] Verify lazy loading initialization
- [ ] Test prefers-reduced-motion support
