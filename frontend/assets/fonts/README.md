# دليل استخدام الخطوط المخصصة - BrightAI

## 📁 الملفات المتوفرة

### الخطوط
- **Thin-Font.otf** - خط رفيع للمحتوى العام
- **Bold-font.otf** - خط عريض للعناوين والنصوص المهمة

## 🎨 كيفية الاستخدام

### 1. إضافة ملف CSS العام

أضف هذا السطر في قسم `<head>` لأي صفحة HTML:

```html
<link rel="stylesheet" href="/frontend/assets/css/global-fonts.css">
```

### 2. التطبيق التلقائي

بمجرد إضافة ملف CSS، سيتم تطبيق الخطوط تلقائياً على:

#### المحتوى العام (Thin Font):
- جميع النصوص العادية
- الفقرات `<p>`
- القوائم `<ul>`, `<ol>`, `<li>`
- الجداول `<td>`
- حقول الإدخال `<input>`, `<textarea>`

#### العناوين (Bold Font):
- جميع العناوين `<h1>` إلى `<h6>`
- النصوص العريضة `<strong>`, `<b>`
- رؤوس الجداول `<th>`
- التسميات `<label>`
- الأزرار `<button>`

## 📝 أمثلة الاستخدام

### مثال HTML كامل

```html
<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة BrightAI</title>
    
    <!-- إضافة الخطوط المخصصة -->
    <link rel="stylesheet" href="/frontend/assets/css/global-fonts.css">
</head>
<body>
    <!-- العناوين ستستخدم Bold Font تلقائياً -->
    <h1>مرحباً بك في BrightAI</h1>
    <h2>نظام أمان الذكاء الاصطناعي</h2>
    
    <!-- المحتوى سيستخدم Thin Font تلقائياً -->
    <p>
        BrightAI هو نظام أمان وحوكمة الذكاء الاصطناعي الأول 
        في المملكة العربية السعودية.
    </p>
    
    <!-- الأزرار ستستخدم Bold Font تلقائياً -->
    <button>ابدأ الآن</button>
</body>
</html>
```

### استخدام الفئات المساعدة

```html
<!-- فرض استخدام الخط الرفيع -->
<div class="font-thin">
    هذا النص سيستخدم الخط الرفيع
</div>

<!-- فرض استخدام الخط العريض -->
<div class="font-bold">
    هذا النص سيستخدم الخط العريض
</div>
```

## 🎯 العناصر المدعومة

### تطبيق تلقائي للخط الرفيع (Thin Font)
```
body, p, span, div, li, td, input, textarea, select,
.text, .content, .description, .paragraph
```

### تطبيق تلقائي للخط العريض (Bold Font)
```
h1, h2, h3, h4, h5, h6, strong, b, button, label,
.heading, .title, .header, .bold, .font-bold
```

## 🔧 التخصيص المتقدم

### إضافة الخطوط يدوياً في CSS

```css
/* استخدام الخط الرفيع */
.my-custom-class {
    font-family: 'YearOfCamel-Thin', 'Arial', sans-serif !important;
    font-weight: 100 !important;
}

/* استخدام الخط العريض */
.my-heading-class {
    font-family: 'YearOfCamel-Bold', 'Arial', sans-serif !important;
    font-weight: 700 !important;
}
```

### تعريف الخطوط في ملف CSS مخصص

```css
@font-face {
    font-family: 'YearOfCamel-Thin';
    src: url('../fonts/Thin-Font.otf') format('opentype');
    font-weight: 100;
    font-style: normal;
    font-display: swap;
}

@font-face {
    font-family: 'YearOfCamel-Bold';
    src: url('../fonts/Bold-font.otf') format('opentype');
    font-weight: 700;
    font-style: normal;
    font-display: swap;
}
```

## 📱 التوافق

### المتصفحات المدعومة
- ✅ Chrome/Edge (الإصدارات الحديثة)
- ✅ Firefox (الإصدارات الحديثة)
- ✅ Safari (الإصدارات الحديثة)
- ✅ Opera (الإصدارات الحديثة)

### الأجهزة المدعومة
- ✅ أجهزة الكمبيوتر المكتبية
- ✅ الأجهزة اللوحية
- ✅ الهواتف الذكية

## 🚀 نصائح الأداء

1. **استخدم `font-display: swap`** - لتحسين سرعة التحميل
2. **قم بضغط ملفات الخطوط** - إذا كان الحجم كبيراً
3. **استخدم CDN** - لتوزيع الخطوط بشكل أسرع
4. **تفعيل التخزين المؤقت** - في إعدادات الخادم

## 📋 قائمة التحقق

عند إضافة صفحة جديدة، تأكد من:

- [ ] إضافة رابط ملف CSS العام في `<head>`
- [ ] التحقق من عرض العناوين بالخط العريض
- [ ] التحقق من عرض المحتوى بالخط الرفيع
- [ ] اختبار الصفحة على متصفحات مختلفة
- [ ] التأكد من قراءة النصوص بوضوح

## 🐛 حل المشاكل الشائعة

### المشكلة: الخطوط لا تظهر

**الحل:**
1. تأكد من مسار ملف CSS صحيح
2. تحقق من وجود ملفات الخطوط في المجلد الصحيح
3. افتح أدوات المطور وتحقق من عدم وجود أخطاء 404

### المشكلة: بعض النصوص لا تستخدم الخط المخصص

**الحل:**
1. تحقق من وجود `!important` في CSS
2. تأكد من عدم وجود CSS آخر يتعارض
3. استخدم الفئات المساعدة `.font-thin` أو `.font-bold`

### المشكلة: الخطوط تظهر ببطء

**الحل:**
1. استخدم `font-display: swap` في تعريف الخط
2. قم بتحميل الخطوط مسبقاً باستخدام `<link rel="preload">`
3. ضع ملفات الخطوط على CDN

## 📞 الدعم الفني

إذا واجهت أي مشاكل:
- 📧 البريد الإلكتروني: yazeed1job@gmail.com
- 💬 واتساب: +966538229013

## 📄 الترخيص

هذه الخطوط مخصصة لاستخدام BrightAI فقط.

---

**آخر تحديث:** 2026
**الإصدار:** 1.0.0
