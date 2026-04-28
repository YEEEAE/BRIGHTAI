---
strong
---
```text
أنت مهندس PWA وFrontend Performance. أصلح sw.js في مشروع BrightAI.

المطلوب:
1. افحص sw.js الحالي.
2. أضف صفحة offline fallback إذا كانت غير موجودة.
3. حسّن استراتيجيات الكاش:
   - HTML: NetworkFirst
   - CSS/JS hashed: CacheFirst
   - CSS/JS غير hashed: StaleWhileRevalidate
   - images/fonts: CacheFirst مع حد أقصى للعناصر
4. تأكد أن تحديثات HTML لا تعلق بسبب cache قديم.
5. أضف versioning واضح للكاش.
6. أضف cleanup للكاش القديم.
7. لا تكسر صفحات demo أو API calls.

قيود مهمة:
- لا تحمِ أي مسار.
- لا تضف Disallow.
- لا تمنع الزحف.
- لا تجعل service worker يخفي صفحات عن Googlebot.
- لا تضف noindex لأي صفحة.

بعد التنفيذ:
- اعرض sw.js الجديد أو diff واضح.
- اذكر استراتيجية الكاش لكل نوع ملف.
- اذكر طريقة اختبار التحديث.
```

---

## ## ## **6. Prompt تحسين **

**`_headers`**

** بدون حظر مسارات**

```text
أنت مهندس أمن تطبيقات وFrontend Performance. راجع ملف _headers في مشروع BrightAI.

المطلوب:
1. حسّن Cache-Control للملفات الثابتة.
2. ارفع مدة التخزين للأصول ذات version/hash.
3. أبق HTML على:
   Cache-Control: public, max-age=0, must-revalidate
4. راجع Content-Security-Policy.
5. قلل unsafe-inline قدر الإمكان باستخدام hash أو nonce عند القدرة.
6. تأكد أن GTM وClarity وSentry تعمل.
7. لا تكسر الصور والخطوط وAPI requests.
8. لا تغير سياسة الوصول للمسارات العامة.

قيود إلزامية:
- لا تضف Disallow.
- لا تضف حماية للمسارات.
- لا تمنع الوصول إلى /backend/ أو /scripts/ أو /tmp/ من خلال هذا الطلب.
- لا تضف X-Robots-Tag: noindex.
- لا تمنع AI crawlers.

بعد التنفيذ:
- اكتب النسخة المقترحة من _headers.
- اشرح لماذا كل Header موجود.
- اذكر المخاطر المتبقية.
```

---

## **7. Prompt تحسين الصور والوسائط**

```text
أنت مهندس أداء Frontend. حسّن الصور والوسائط في مشروع BrightAI.

افحص:
- assets/images/
- assets/3d-icons/
- صور blog/
- صور OG
- استخدام picture/img في HTML

المطلوب:
1. تحقق من أبعاد Gemini.png وهل هي مناسبة لـ OG image.
2. أضف width و height لكل img لمنع CLS.
3. أضف loading="lazy" للصور خارج أول شاشة.
4. أضف decoding="async" للصور غير الحرجة.
5. أضف fetchpriority="high" لصورة Hero أو LCP فقط.
6. استخدم picture مع AVIF/WebP fallback عند الحاجة.
7. راجع noise.png: هل يمكن استبدالها بـ CSS؟
8. لا تغيّر alt النصوص إلا لتحسينها وصفياً.

قيود:
- لا تحذف صور مستخدمة.
- لا تكسر OG/Twitter cards.
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تمنع الزحف للصور.

بعد التنفيذ:
- اعرض الملفات التي تغيرت.
- اعرض صور LCP التي تم تحسينها.
- اعرض تقدير أثر LCP وCLS.
```

---

## **8. Prompt تحسين الخطوط**

```text
أنت مهندس أداء Frontend. حسّن تحميل الخطوط في BrightAI.

افحص:
- assets/fonts/
- CSS @font-face
- preload للخطوط في HTML
- استخدام IBM Plex Sans Arabic
- استخدام ScheherazadeNew

المطلوب:
1. استخدم woff2 فقط في الواجهة.
2. لا تستخدم ttf في صفحات الإنتاج.
3. أضف font-display: swap لكل @font-face.
4. راجع هل جميع أوزان IBM Plex مستخدمة فعلاً.
5. اقترح تقليل الأوزان إلى Medium + Bold إن أمكن.
6. لا تحمل ScheherazadeNew في كل الصفحات إذا لم يكن ضرورياً.
7. تأكد أن الخط الاحتياطي لا يسبب CLS كبير.

قيود:
- لا تحذف ملف خط إلا إذا تأكدت أنه غير مستخدم.
- لا تغيّر هوية التصميم بشكل واضح.
- لا تضف Disallow.
- لا تحمِ أي مسار.

بعد التنفيذ:
- اعرض before/after لحجم الخطوط المحملة.
- اعرض قائمة الخطوط المتبقية.
- اعرض أثر متوقع على LCP/CLS.
```

---

## **9. Prompt تحسين Meta Tags وCanonical**

```text
أنت مهندس SEO تقني للسوق السعودي. راجع جميع صفحات BrightAI لتحسين meta tags وcanonical.

افحص:
- index.html
- services/
- sectors/
- ai-bots/
- ai-agent/
- ai-workflows/
- smart-automation/
- blog/
- tools/
- about/
- en/

المطلوب:
1. تأكد أن كل صفحة لها title فريد.
2. اجعل title بين 50 و 70 حرف تقريباً.
3. اجعل meta description بين 140 و 165 حرف تقريباً.
4. أزل أو اترك meta keywords بدون الاعتماد عليها.
5. تأكد أن canonical يطابق URL النهائي.
6. تأكد أن og:url يطابق canonical.
7. أصلح العناوين المتكررة.
8. لا تغيّر URL إلا إذا كان هناك خطأ واضح.

قيود:
- لا تضف noindex.
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تغيّر x-default إلا لو كان غير متسق مع العربية كلغة أساسية.

بعد التنفيذ:
- اعرض جدول مختصر: الملف، المشكلة، الإصلاح.
- اعرض أهم 10 صفحات تم تحسينها.
```

---

## **10. Prompt Hreflang للعربي والإنجليزي**

```text
أنت مهندس SEO دولي. أصلح hreflang في BrightAI.

المطلوب:
1. افحص كل صفحة عربية ولها مقابل إنجليزي.
2. افحص كل صفحة إنجليزية ولها مقابل عربي.
3. تأكد من وجود:
   - hreflang="ar-SA"
   - hreflang="en-SA"
   - hreflang="x-default"
4. اجعل x-default يشير للنسخة العربية عندما تكون الصفحة العربية هي الأساس.
5. تأكد من تطابق hreflang في HTML مع sitemap.xml.
6. لا تضف alternate لصفحة غير موجودة فعلياً.
7. أصلح صفحات sectors التي تستخدم ملفات مثل ecommerce-en.html إن كان البناء النهائي يحولها إلى مجلدات.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تحذف النسخ الإنجليزية أو العربية.

بعد التنفيذ:
- اعرض قائمة الصفحات التي كان بها hreflang خاطئ.
- اعرض أمثلة قبل/بعد.
- شغّل فحص hreflang إن وجد.
```

---

## **11. Prompt تحسين Sitemap بدون Disallow**

```text
أنت مهندس Technical SEO. حسّن sitemap.xml في BrightAI بدون منع أي مسار من الزحف.

المطلوب:
1. افحص sitemap.xml.
2. تأكد أن كل URL يرجع 200 أو يعاد كتابته بشكل صحيح.
3. أزل URLs التي تعيد 404 فقط.
4. أزل URLs المكررة فقط.
5. تأكد من lastmod دقيق.
6. تأكد أن hreflang داخل sitemap يطابق head.
7. إذا زاد الحجم، اقترح sitemap index:
   - sitemap-pages.xml
   - sitemap-blog.xml
   - sitemap-services.xml
   - sitemap-sectors.xml
8. لا تضف قواعد حظر.

قيود:
- لا تضف Disallow في robots.txt.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تمنع الزحف للـ demo أو tools إلا إذا طلبت ذلك لاحقاً.
- لا تحذف صفحات مهمة من sitemap لمجرد أنها تفاعلية.

بعد التنفيذ:
- اعرض عدد URLs قبل وبعد.
- اعرض URLs المحذوفة وسبب الحذف.
- اعرض sitemap النهائي أو diff.
```

---

## **12. Prompt تحسين Schema للصفحات الرئيسية**

```text
أنت مهندس Structured Data وSEO. حسّن JSON-LD في BrightAI.

افحص:
- index.html
- services/index.html
- أهم 5 صفحات خدمات
- blog/index.html
- أهم 5 مقالات
- sectors/index.html
- contact/
- about/

المطلوب:
1. تأكد من صحة Organization وLocalBusiness.
2. أضف WebSite + SearchAction في الصفحة الرئيسية إن لم يكن موجوداً.
3. صفحات الخدمات تستخدم Service.
4. صفحات المنتجات أو الأدوات تستخدم SoftwareApplication عند الحاجة.
5. صفحات المقالات تستخدم BlogPosting أو Article.
6. أضف BreadcrumbList لكل صفحة.
7. اجعل @id موحداً وغير متكرر.
8. تحقق من datePublished و dateModified للمقالات.
9. لا تضف بيانات غير حقيقية.

قيود:
- لا تضف Disallow.
- لا تضف noindex.
- لا تحمِ أي مسار.
- لا تضف مراجعات أو تقييمات وهمية.
- لا تضف أسعار غير موجودة أو غير مؤكدة.

بعد التنفيذ:
- اعرض Schema قبل/بعد لأهم 3 صفحات.
- اذكر أي أخطاء تحتاج تحقق يدوي.
```

---

## **13. Prompt تحسين AEO وFAQ لصفحات الخدمات**

```text
أنت متخصص AEO/GEO/HEI للسوق السعودي. حسّن صفحات خدمات BrightAI لمحركات الإجابة والذكاء الاصطناعي.

افحص جميع صفحات services/.

المطلوب لكل صفحة خدمة:
1. أضف قسم FAQ واضح بأسئلة يبحث عنها عملاء سعوديون.
2. اجعل الإجابات قصيرة ومباشرة ومفيدة.
3. أضف FAQPage Schema.
4. أضف فقرة "لمن هذه الخدمة؟".
5. أضف فقرة "متى تحتاجها الشركة؟".
6. أضف فقرة "ما النتائج المتوقعة؟".
7. أضف CTA واضح.
8. اربط كل صفحة بخدمات قريبة ومقالات ذات صلة.
9. حافظ على اللغة العربية المهنية.

قيود:
- لا تضف ادعاءات غير مثبتة.
- لا تضف أرقام ROI وهمية.
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.

بعد التنفيذ:
- اعرض قائمة الصفحات المعدلة.
- اعرض FAQ لكل صفحة.
- اعرض Schema المضاف.
```

---

## **14. Prompt تحسين المحتوى لـ GEO وAI Search**

```text
أنت محرر محتوى تقني وخبير GEO لمحركات الذكاء الاصطناعي. حسّن محتوى BrightAI ليكون قابلاً للفهم والاستخراج من ChatGPT Search وGemini وPerplexity.

المطلوب:
1. راجع صفحات:
   - /
   - /about/
   - /services/
   - /ai-agent/
   - /ai-workflows/
   - /smart-automation/
   - /sectors/
2. أضف تعريفات واضحة للكيانات:
   - BrightAI
   - AI Agents
   - AI Automation
   - Data Analysis
   - Vision 2030
   - Saudi AI market
3. أضف إجابات مباشرة للأسئلة الشائعة.
4. أضف سياق سعودي واضح.
5. استخدم أسلوب معرفي لا تسويقي فقط.
6. أضف روابط داخلية لمصادر الخدمة والقطاع والمقالات.
7. حدّد الجمهور المستهدف بوضوح.

قيود:
- لا تستخدم مصادر أو أرقام بدون مرجع.
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تعدل robots.txt.

بعد التنفيذ:
- اعرض الفقرات التي أضيفت.
- اعرض الكلمات والكيانات المحسّنة.
- اعرض تأثير متوقع على AEO/GEO.
```

---

## ## ## **15. Prompt تحديث **

**`llms.txt`**

** بدون حظر**

```text
أنت متخصص AI Search وLLM Discoverability. حدّث ملف llms.txt في جذر موقع BrightAI.

المطلوب:
1. اجعل الملف عربي أولاً مع دعم إنجليزي مختصر.
2. عرّف BrightAI كشركة ذكاء اصطناعي سعودية.
3. أضف الخدمات الرئيسية:
   - AI Agents
   - Smart Automation
   - Data Analysis
   - AI Bots
   - AI Workflows
   - Sector Solutions
4. أضف أهم الصفحات العامة.
5. أضف أهم الأسئلة التي يجيب عنها الموقع.
6. أضف تعليمات للنماذج اللغوية حول كيفية تلخيص خدمات BrightAI.
7. أضف NAP إن كان مؤكداً.
8. لا تضف أي تعليمات حظر أو منع.

قيود:
- لا تضف Disallow.
- لا تذكر أن هناك مسارات محمية.
- لا تطلب من LLMs تجاهل أي مسار.
- لا تضف ادعاءات غير مثبتة.
- لا تضف معلومات قانونية أو تراخيص غير مؤكدة.

بعد التنفيذ:
- اعرض llms.txt النهائي.
- اشرح لماذا كل قسم مفيد لـ AI Search.
```

---

## **16. Prompt تحسين الروابط الداخلية**

```text
أنت مهندس SEO داخلي. حسّن بنية الروابط الداخلية في BrightAI.

المطلوب:
1. افحص الروابط الداخلية في:
   - index.html
   - services/
   - sectors/
   - blog/
   - ai-agent/
   - smart-automation/
2. اكتشف الصفحات اليتيمة.
3. أضف روابط داخلية من:
   - المقالات إلى الخدمات.
   - الخدمات إلى القطاعات.
   - القطاعات إلى الخدمات.
   - الصفحة الرئيسية إلى الصفحات التجارية المهمة.
4. حسّن Anchor Text ليكون وصفياً.
5. استبدل عبارات مثل "اقرأ المزيد" عندما لا تكون وصفية.
6. حافظ على UX ولا تضف روابط زائدة داخل الفقرة الواحدة.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تغيّر canonical.
- لا تحذف روابط مهمة.

بعد التنفيذ:
- اعرض الصفحات اليتيمة التي تم ربطها.
- اعرض أمثلة Anchor Text قبل/بعد.
- اعرض خريطة روابط مختصرة.
```

---

## **17. Prompt تحسين Accessibility**

```text
أنت مهندس Frontend Accessibility. حسّن توافق BrightAI مع WCAG 2.1 AA.

المطلوب:
1. أضف Skip Navigation Link في الصفحات الرئيسية.
2. تأكد من وجود focus-visible واضح.
3. افحص aria-label للأزرار والأيقونات.
4. تأكد أن button يستخدم للأفعال وa يستخدم للتنقل.
5. تأكد أن النماذج تحتوي label مرتبط.
6. راجع alt للصور.
7. راجع ترتيب العناوين.
8. راجع التباين اللوني.
9. تأكد من التنقل بالكيبورد.

قيود:
- لا تغيّر التصميم جذرياً.
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تخفِ محتوى SEO الأساسي عن المستخدمين.

بعد التنفيذ:
- اعرض قائمة مشاكل Accessibility التي تم إصلاحها.
- اعرض أمثلة قبل/بعد.
- اعرض مشاكل تحتاج اختبار يدوي.
```

---

## **18. Prompt تحسين RTL/LTR**

```text
أنت Senior UI/UX Designer وFrontend Architect متخصص في RTL/LTR.

المطلوب:
1. افحص كل صفحات العربية والإنجليزية.
2. تأكد من:
   - html dir صحيح.
   - html lang صحيح.
   - text-align منطقي.
   - الأيقونات الاتجاهية تنعكس في RTL.
   - أرقام الهاتف لا تنعكس.
   - القوائم والبطاقات لا تنكسر في الجوال.
3. استبدل الخصائص الفيزيائية:
   - left/right
   - margin-left/right
   - padding-left/right
   - border-left/right
4. استخدم خصائص منطقية:
   - inline-start
   - inline-end
   - block-start
   - block-end
5. لا تكسر صفحات EN.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تغير URL.
- لا تضف noindex.

بعد التنفيذ:
- اعرض الملفات المعدلة.
- اعرض أهم مشاكل RTL التي تم حلها.
- اعرض صفحات يجب اختبارها يدوياً.
```

---

## **19. Prompt تحسين Analytics وConversions**

```text
أنت مهندس Analytics وFrontend. حسّن تتبع التحويلات في BrightAI.

المطلوب:
1. افحص GTM وgtag في الصفحات.
2. افحص Microsoft Clarity.
3. افحص Sentry.
4. أضف تتبع للأحداث التالية:
   - WhatsApp click
   - contact form submit
   - demo start
   - demo success
   - demo error
   - service CTA click
   - blog to service click
5. لا تجعل التتبع يعيق LCP.
6. استخدم defer/async للسكربتات الخارجية.
7. لا ترسل بيانات حساسة في الأحداث.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تمنع تحميل analytics إلا عند وجود خطأ واضح.
- لا تضف noindex.

بعد التنفيذ:
- اعرض قائمة الأحداث المضافة.
- اعرض أسماء الأحداث في GA4.
- اعرض طريقة اختبارها.
```

---

## **20. Prompt إصلاح CSP تدريجي بدون كسر التتبع**

```text
أنت مهندس أمن تطبيقات. حسّن CSP في BrightAI تدريجياً.

المطلوب:
1. افحص جميع inline scripts في:
   - index.html
   - services/
   - sectors/
   - blog/
   - ai-bots/
2. اقترح خطة لإزالة unsafe-inline تدريجياً.
3. انقل السكربتات inline إلى ملفات JS خارجية حيث يمكن.
4. استخدم hash للسكربتات الصغيرة الثابتة.
5. تأكد أن:
   - Google Tag Manager يعمل.
   - Clarity يعمل.
   - Sentry يعمل.
   - WhatsApp links تعمل.
   - demo APIs تعمل.
6. لا تغيّر CSP دفعة واحدة إن كان سيكسر الموقع.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تمنع crawler أو AI bot.
- لا تضف noindex.
- لا توقف أدوات analytics بدون سبب.

بعد التنفيذ:
- اعرض CSP المقترح.
- اعرض سكربتات inline التي تحتاج نقل.
- اعرض خطة انتقال من مرحلتين.
```

---

## **21. Prompt فحص وإصلاح النماذج Forms**

```text
أنت مهندس Frontend وUX. افحص كل النماذج في BrightAI.

المطلوب:
1. ابحث عن كل form في الموقع.
2. تأكد من وجود label لكل input.
3. أضف aria-describedby للأخطاء.
4. حسّن رسائل الخطأ بالعربية.
5. تأكد أن الإرسال لا يتكرر عند الضغط أكثر من مرة.
6. أضف حالة loading واضحة.
7. أضف نجاح وفشل واضحين للمستخدم.
8. لا ترسل بيانات حساسة إلى analytics.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تغيّر endpoints إلا عند وجود خطأ.

بعد التنفيذ:
- اعرض النماذج التي تم تعديلها.
- اعرض مشاكل UX التي تم إصلاحها.
- اعرض طريقة الاختبار.
```

---

## **22. Prompt تحسين المدونة Blog SEO**

```text
أنت محرر SEO تقني للسوق السعودي. حسّن blog/ في BrightAI.

المطلوب:
1. افحص blog/index.html وجميع مقالات blog/.
2. تأكد من:
   - title فريد.
   - meta description قوية.
   - h1 واحد.
   - BlogPosting أو Article Schema.
   - BreadcrumbList.
   - datePublished و dateModified.
   - author واضح.
   - روابط داخلية للخدمات.
   - صور alt وصفية.
3. أضف CTA في نهاية كل مقال يربط بالخدمة المناسبة.
4. أضف روابط بين المقالات المتقاربة.
5. لا تحذف محتوى إلا إذا كان مكرر بشكل واضح.

قيود:
- لا تضف Disallow.
- لا تضف noindex.
- لا تحمِ أي مسار.
- لا تخفي المدونة عن الزحف.

بعد التنفيذ:
- اعرض قائمة المقالات المعدلة.
- اعرض أهم 10 تحسينات.
- اعرض Schema محدث لمقال واحد كنموذج.
```

---

## **23. Prompt تحسين صفحات القطاعات**

```text
أنت متخصص UX وSEO للقطاعات السعودية. حسّن صفحات sectors في BrightAI.

افحص:
- sectors/index.html
- sectors/ecommerce.html
- sectors/energy.html
- sectors/finance.html
- sectors/healthcare.html
- sectors/logistics.html
- sectors/manufacturing.html
- النسخ الإنجليزية المقابلة

المطلوب:
1. تأكد أن كل قطاع لديه قيمة واضحة.
2. أضف مشاكل القطاع في السعودية.
3. أضف كيف تحل BrightAI هذه المشاكل.
4. أضف Use Cases عملية.
5. أضف روابط إلى الخدمات المناسبة.
6. أضف FAQ مختصر لكل قطاع.
7. أضف Schema مناسب CollectionPage أو WebPage + ItemList.
8. راجع hreflang بين العربي والإنجليزي.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تضف أرقام غير موثقة.

بعد التنفيذ:
- اعرض التغييرات لكل قطاع.
- اعرض الروابط الداخلية الجديدة.
- اعرض FAQ المضاف.
```

---

## **24. Prompt تحسين صفحات AI Bots**

```text
أنت مهندس منتج وSEO. حسّن صفحات AI Bots في BrightAI.

افحص:
- ai-bots/index.html
- ai-bots/BrightMath/index.html
- ai-bots/BrightRecruiter/index.html
- ai-bots/BrightSupport/index.html
- en/ai-bots/ إن وجدت

المطلوب:
1. تأكد أن كل Bot له value proposition واضح.
2. أضف حالات استخدام عملية.
3. أضف Demo CTA واضح.
4. أضف Schema نوع SoftwareApplication.
5. أضف FAQ.
6. تأكد أن الديمو لا يكسر الصفحة عند فشل API.
7. أضف روابط إلى الخدمات المرتبطة.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تخفي صفحات الديمو.

بعد التنفيذ:
- اعرض الصفحات المعدلة.
- اعرض Schema المضاف.
- اعرض اختبارات الديمو.
```

---

## **25. Prompt اختبارات نهائية بعد الإصلاح**

```text
أنت QA Engineer وTechnical SEO Auditor. نفّذ فحص نهائي لمشروع BrightAI بعد الإصلاحات.

المطلوب:
1. شغّل فحص HTML للصفحات الرئيسية.
2. شغّل فحص SEO:
   - title
   - meta description
   - canonical
   - hreflang
   - robots meta
   - schema
3. شغّل فحص الأداء:
   - حجم HTML
   - حجم CSS
   - حجم JS
   - الصور
   - الخطوط
4. شغّل فحص الروابط الداخلية.
5. شغّل فحص sitemap.
6. شغّل فحص accessibility.
7. افحص عدم وجود console.log في الإنتاج.
8. افحص أن APIs لا تكشف مفاتيح.

قيود:
- لا تضف Disallow.
- لا تحمِ أي مسار.
- لا تضف noindex.
- لا تغيّر robots.txt إلا إذا كان التغيير لا يمنع الزحف ولا يحظر مسارات.

المخرجات:
- تقرير قبل/بعد.
- قائمة مشاكل متبقية.
- قائمة ملفات معدلة.
- توصيات نهائية للنشر.
```

---

# **Prompt شامل لتنفيذ كل شيء دفعة واحدة**

```text
أنت وكيل هندسي متكامل لموقع BrightAI، تعمل كالتالي:
- Senior Frontend Architect
- Senior Software Engineer
- Senior Technical SEO Engineer
- Senior UI/UX Designer
- AEO/GEO/HEI Specialist للسوق السعودي

نفّذ إصلاحات شاملة على مشروع BrightAI بناءً على التدقيق السابق.

الأهداف:
1. تحسين أداء Core Web Vitals.
2. تحسين SEO التقليدي.
3. تحسين AI Search / AEO / GEO / HEI.
4. تحسين Accessibility.
5. تحسين RTL/LTR.
6. تحسين JavaScript reliability.
7. تحسين CSS وتنظيف التكرار.
8. تحسين Schema وllms.txt.
9. تحسين الروابط الداخلية.
10. تحسين تجربة صفحات الخدمات والقطاعات والمدونة.

قيود إلزامية جداً:
- لا تضف أي Disallow.
- لا تحمِ أي مسار.
- لا تمنع الزحف لأي مجلد.
- لا تضف noindex لأي صفحة.
- لا تضف X-Robots-Tag.
- لا تمنع AI crawlers.
- لا تغيّر robots.txt بطريقة تمنع الفهرسة.
- لا تخفي /backend/ أو /scripts/ أو /tmp/ أو أي مسار آخر في هذا الطلب.
- لا تحذف صفحات مهمة.
- لا تغيّر canonical إلا عند وجود خطأ واضح.
- لا تضف ادعاءات أو أرقام غير مثبتة.

منهجية التنفيذ:
1. اقرأ المشروع كاملاً قبل التعديل.
2. حدد الملفات المتأثرة.
3. نفّذ الإصلاحات على دفعات صغيرة.
4. بعد كل دفعة، شغّل فحص مناسب.
5. لا تكسر RTL أو LTR.
6. لا تكسر الديمو أو APIs.
7. لا تكسر GTM أو Clarity أو Sentry.
8. لا تستخدم حلول مؤقتة إذا كان الحل الجذري ممكن.

المخرجات المطلوبة:
1. قائمة الملفات المعدلة.
2. ملخص كل تعديل.
3. مشاكل تم حلها.
4. مشاكل متبقية.
5. قياسات قبل/بعد إن أمكن.
6. خطة تحقق بعد النشر.
```

---

## **الخطوات التالية**

استخدم هذه الـ prompts على دفعات، وأنصح تبدأ بهذا الترتيب:

1. تدقيق قبل التعديل.
2. **إصلاح **`services/index.html`.
3. تحسين CSS.
4. تحسين JavaScript.
5. تحسين الصور والخطوط.
6. تحسين SEO وSchema وAEO.
7. اختبارات نهائية.

تم الانتهاء من إعداد الـ prompts بالكامل، وبدون أي تعليمات لحماية المسارات أو إضافة `Disallow`.
