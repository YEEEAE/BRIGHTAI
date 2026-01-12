# Requirements Document

## Introduction

هذه المواصفات تهدف إلى إصلاح الشات بوت العائم في الصفحة الرئيسية للتأكد من:
1. ربطه بشكل صحيح مع Gemini API
2. تحسين واجهة المستخدم للهواتف المحمولة
3. التأكد من عمل جميع الوظائف بشكل سليم

## Glossary

- **Chatbot_Widget**: أداة الدردشة العائمة التي تظهر في زاوية الصفحة
- **Gemini_API**: واجهة برمجة التطبيقات من Google للذكاء الاصطناعي
- **Server_Gateway**: الخادم الوسيط الذي يتعامل مع طلبات API
- **Mobile_View**: عرض الهاتف المحمول (شاشات أقل من 480px)
- **Input_Bar**: شريط إدخال الرسائل في الشات بوت

## Requirements

### Requirement 1: إصلاح ربط Gemini API

**User Story:** كمستخدم، أريد أن يعمل الشات بوت ويرد على رسائلي، حتى أتمكن من الحصول على المساعدة.

#### Acceptance Criteria

1. WHEN the Server_Gateway starts, THE Server_Gateway SHALL load the GEMINI_API_KEY from environment variables
2. WHEN a user sends a message, THE Chatbot_Widget SHALL successfully communicate with the Gemini_API through the Server_Gateway
3. IF the GEMINI_API_KEY is missing or invalid, THEN THE Server_Gateway SHALL return a clear Arabic error message
4. WHEN the Gemini_API responds, THE Chatbot_Widget SHALL display the response in Arabic

### Requirement 2: تحسين واجهة الهاتف المحمول

**User Story:** كمستخدم على هاتف محمول، أريد أن يكون الشات بوت سهل الاستخدام على شاشتي الصغيرة.

#### Acceptance Criteria

1. WHILE in Mobile_View, THE Chatbot_Widget SHALL occupy full width of the screen
2. WHILE in Mobile_View, THE Input_Bar SHALL have minimum touch target size of 44px
3. WHEN the Chatbot_Widget is open on Mobile_View, THE Chatbot_Widget SHALL not overlap with critical page content
4. WHILE in Mobile_View, THE Chatbot_Widget toggle button SHALL be easily accessible and visible

### Requirement 3: تحسين شريط الإدخال

**User Story:** كمستخدم، أريد أن يكون شريط الإدخال واضحاً وسهل الاستخدام.

#### Acceptance Criteria

1. WHEN the Input_Bar receives focus, THE Input_Bar SHALL show visual feedback
2. WHEN a user types in RTL language, THE Input_Bar SHALL maintain proper text direction
3. WHEN the send button is pressed, THE Chatbot_Widget SHALL disable the Input_Bar until response is received
4. IF the message is empty, THEN THE Chatbot_Widget SHALL prevent sending and show appropriate feedback

### Requirement 4: معالجة الأخطاء

**User Story:** كمستخدم، أريد رسائل خطأ واضحة بالعربية عند حدوث مشكلة.

#### Acceptance Criteria

1. IF the network connection fails, THEN THE Chatbot_Widget SHALL display "فشل الاتصال" with a retry button
2. IF the Gemini_API returns an error, THEN THE Chatbot_Widget SHALL display a user-friendly Arabic error message
3. WHEN an error occurs, THE Chatbot_Widget SHALL provide a retry option
4. IF the Server_Gateway is unavailable, THEN THE Chatbot_Widget SHALL inform the user in Arabic

### Requirement 5: التحقق من التكوين

**User Story:** كمطور، أريد التأكد من أن جميع الإعدادات صحيحة قبل تشغيل الشات بوت.

#### Acceptance Criteria

1. WHEN the application starts, THE Server_Gateway SHALL validate that GEMINI_API_KEY exists in environment
2. IF configuration is invalid, THEN THE Server_Gateway SHALL log a clear error message
3. THE Server_Gateway SHALL use the correct environment variable name (GEMINI_API_KEY)
4. WHEN the API key format is incorrect, THE Server_Gateway SHALL reject it with appropriate error
