# Requirements Document

## Introduction

هذه المواصفات تهدف إلى إجراء تدقيق شامل وإصلاح الشات بوت العائم في الصفحة الرئيسية للتأكد من:
1. ربطه بشكل صحيح مع Gemini API والتحقق من الاتصال
2. تحسين واجهة المستخدم للهواتف المحمولة (390px, 430px, 768px)
3. التأكد من عمل جميع الوظائف بشكل سليم
4. تحسين الأداء وتجربة المستخدم
5. التحقق من الأمان وعدم تسريب مفاتيح API

## Glossary

- **Chatbot_Widget**: أداة الدردشة العائمة التي تظهر في زاوية الصفحة
- **Gemini_API**: واجهة برمجة التطبيقات من Google للذكاء الاصطناعي
- **Server_Gateway**: الخادم الوسيط الذي يتعامل مع طلبات API
- **Mobile_View**: عرض الهاتف المحمول (شاشات أقل من 480px)
- **Tablet_View**: عرض الأجهزة اللوحية (شاشات 481px - 768px)
- **Input_Bar**: شريط إدخال الرسائل في الشات بوت
- **Navbar**: شريط التنقل الرئيسي في الموقع
- **Floating_Button**: زر الشات بوت العائم
- **Touch_Target**: منطقة اللمس القابلة للنقر (الحد الأدنى 44px)
- **Viewport**: منطقة العرض المرئية في المتصفح

## Requirements

### Requirement 1: إصلاح ربط Gemini API

**User Story:** كمستخدم، أريد أن يعمل الشات بوت ويرد على رسائلي، حتى أتمكن من الحصول على المساعدة.

#### Acceptance Criteria

1. WHEN the Server_Gateway starts, THE Server_Gateway SHALL load the GEMINI_API_KEY from environment variables
2. WHEN a user sends a message, THE Chatbot_Widget SHALL successfully communicate with the Gemini_API through the Server_Gateway
3. IF the GEMINI_API_KEY is missing or invalid, THEN THE Server_Gateway SHALL return a clear Arabic error message
4. WHEN the Gemini_API responds, THE Chatbot_Widget SHALL display the response in Arabic
5. WHEN the Server_Gateway receives a request, THE Server_Gateway SHALL NOT expose the API key to the client

### Requirement 2: تحسين واجهة الهاتف المحمول للشات بوت

**User Story:** كمستخدم على هاتف محمول، أريد أن يكون الشات بوت سهل الاستخدام على شاشتي الصغيرة.

#### Acceptance Criteria

1. WHILE in Mobile_View (width < 480px), THE Chatbot_Widget window SHALL occupy full width of the screen minus safe margins
2. WHILE in Mobile_View, THE Input_Bar SHALL have minimum Touch_Target size of 44px height
3. WHEN the Chatbot_Widget is open on Mobile_View, THE Chatbot_Widget SHALL not overflow the Viewport
4. WHILE in Mobile_View, THE Floating_Button SHALL be positioned with safe distance from screen edges (minimum 10px)
5. WHILE in Mobile_View, THE Chatbot_Widget messages area SHALL have proper padding and readable font size (minimum 14px)

### Requirement 3: تحسين شريط التنقل للهواتف

**User Story:** كمستخدم على هاتف محمول، أريد أن يكون شريط التنقل سهل الاستخدام ولا يتداخل مع المحتوى.

#### Acceptance Criteria

1. WHILE in Mobile_View, THE Navbar SHALL collapse into a hamburger menu
2. WHEN the hamburger menu is clicked, THE Navbar SHALL expand smoothly without layout shift
3. WHILE in Mobile_View, THE Navbar links SHALL have minimum Touch_Target size of 44px
4. WHILE in Mobile_View, THE Navbar dropdown menus SHALL be scrollable if content exceeds screen height
5. WHEN the Navbar is expanded on Mobile_View, THE Navbar SHALL not overlap with the Chatbot_Widget

### Requirement 4: تحسين شريط الإدخال

**User Story:** كمستخدم، أريد أن يكون شريط الإدخال واضحاً وسهل الاستخدام.

#### Acceptance Criteria

1. WHEN the Input_Bar receives focus, THE Input_Bar SHALL show visual feedback (border color change)
2. WHEN a user types in RTL language, THE Input_Bar SHALL maintain proper text direction
3. WHEN the send button is pressed, THE Chatbot_Widget SHALL disable the Input_Bar until response is received
4. IF the message is empty or whitespace only, THEN THE Chatbot_Widget SHALL prevent sending
5. WHILE in Mobile_View, THE Input_Bar font size SHALL be 16px to prevent iOS zoom on focus

### Requirement 5: معالجة الأخطاء

**User Story:** كمستخدم، أريد رسائل خطأ واضحة بالعربية عند حدوث مشكلة.

#### Acceptance Criteria

1. IF the network connection fails, THEN THE Chatbot_Widget SHALL display "فشل الاتصال" with a retry button
2. IF the Gemini_API returns an error, THEN THE Chatbot_Widget SHALL display a user-friendly Arabic error message
3. WHEN an error occurs, THE Chatbot_Widget SHALL provide a retry option
4. IF the Server_Gateway is unavailable, THEN THE Chatbot_Widget SHALL inform the user in Arabic
5. IF the API returns 401 or 403 error, THEN THE Server_Gateway SHALL log the error and return "خدمة غير متاحة"

### Requirement 6: التحقق من التكوين والأمان

**User Story:** كمطور، أريد التأكد من أن جميع الإعدادات صحيحة وآمنة قبل تشغيل الشات بوت.

#### Acceptance Criteria

1. WHEN the application starts, THE Server_Gateway SHALL validate that GEMINI_API_KEY exists in environment
2. IF configuration is invalid, THEN THE Server_Gateway SHALL log a clear error message
3. THE Server_Gateway SHALL use the correct environment variable name (GEMINI_API_KEY)
4. WHEN the API key format is incorrect, THE Server_Gateway SHALL reject it with appropriate error
5. THE Chatbot_Widget JavaScript SHALL NOT contain any hardcoded API keys
6. THE Server_Gateway SHALL NOT include API key in response headers or body

### Requirement 7: تحسين الأداء

**User Story:** كمستخدم، أريد أن يتم تحميل الشات بوت بسرعة دون التأثير على أداء الصفحة.

#### Acceptance Criteria

1. THE Chatbot_Widget scripts SHALL be loaded with defer attribute
2. THE Chatbot_Widget SHALL initialize lazily after user interaction or 3 seconds delay
3. THE Chatbot_Widget CSS SHALL not block page rendering
4. WHEN the Chatbot_Widget is closed, THE Chatbot_Widget SHALL not consume significant CPU resources
5. THE Chatbot_Widget animations SHALL respect prefers-reduced-motion media query

### Requirement 8: التحقق من Viewport والتوافق

**User Story:** كمستخدم، أريد أن يعمل الموقع بشكل صحيح على جميع أحجام الشاشات.

#### Acceptance Criteria

1. THE index.html SHALL contain proper viewport meta tag with width=device-width and initial-scale=1.0
2. WHILE viewport width is 390px, THE Chatbot_Widget SHALL display correctly without horizontal overflow
3. WHILE viewport width is 430px, THE Chatbot_Widget SHALL display correctly without horizontal overflow
4. WHILE viewport width is 768px, THE Chatbot_Widget SHALL display correctly in tablet layout
5. THE page content SHALL not have horizontal scroll on any mobile viewport
