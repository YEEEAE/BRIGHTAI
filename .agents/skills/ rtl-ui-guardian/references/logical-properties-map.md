# خريطة التحويل إلى CSS Logical Properties

استخدم هذا المرجع عندما تكون المشكلة في الاتجاه أو المسافات أو التموضع، وتحتاج إلى استبدال خصائص مرتبطة بـ LTR ببدائل منطقية قابلة للصيانة.

## متى تستخدم هذا المرجع

- عند وجود `left` و`right` في CSS بدون مبرر بصري واضح
- عند مراجعة spacing أو borders أو مواضع أيقونات داخل حقول وعناصر تفاعلية
- عند إصلاح مكوّن يجب أن يعمل في RTL وLTR من دون كتابة نسختين من النمط

## قاعدة القرار

- إذا كان المقصود "بداية السطر" أو "نهاية السطر"، فاستخدم خاصية منطقية.
- إذا كان المقصود "الجهة اليسرى فعلياً" أو "الجهة اليمنى فعلياً" لعنصر زخرفي ثابت لا يتبع اتجاه القراءة، يمكن إبقاء الخاصية الفيزيائية مع تعليق عربي موجز عند الحاجة.

## خرائط التحويل الشائعة

| بديل فيزيائي | البديل المنطقي المفضل | ملاحظة |
| --- | --- | --- |
| `margin-left` | `margin-inline-start` أو `margin-inline-end` | اختر وفق معنى العنصر لا اسمه |
| `margin-right` | `margin-inline-end` أو `margin-inline-start` | لا تفترض التحويل الحرفي |
| `padding-left` | `padding-inline-start` | مناسب للعناصر النصية وحقول الإدخال |
| `padding-right` | `padding-inline-end` | يعتمد على موضع المحتوى أو الأيقونة |
| `left` | `inset-inline-start` | للعناصر المطلقة أو الثابتة |
| `right` | `inset-inline-end` | للعناصر المطلقة أو الثابتة |
| `border-left` | `border-inline-start` | ممتاز للـ cards والتنبيهات |
| `border-right` | `border-inline-end` | جيد للفواصل الجانبية |
| `border-top-left-radius` | أبقها كما هي إذا كانت زوايا فعلية | ليست منطقية دائماً |
| `text-align: left` | `text-align: start` أو `right` | فضّل `start` عند دعم الاتجاهين |
| `text-align: right` | `text-align: end` أو `right` | يعتمد على مقصود المكوّن |

## أمثلة سريعة

### مثال 1: أيقونة داخل input

بدلاً من:

```css
.searchInput {
  padding-left: 44px;
}

.searchIcon {
  left: 14px;
}
```

استخدم:

```css
.searchInput {
  padding-inline-start: 44px;
}

.searchIcon {
  inset-inline-start: 14px;
}
```

### مثال 2: بطاقة مع حد جانبي

بدلاً من:

```css
.alertCard {
  border-left: 4px solid var(--brand-gold);
  padding-left: 16px;
}
```

استخدم:

```css
.alertCard {
  border-inline-start: 4px solid var(--brand-gold);
  padding-inline-start: 16px;
}
```

### مثال 3: عنصر مطلق داخل زر

بدلاً من:

```css
.ctaArrow {
  position: absolute;
  right: 12px;
}
```

استخدم:

```css
.ctaArrow {
  position: absolute;
  inset-inline-end: 12px;
}
```

## أخطاء شائعة

- التحويل الحرفي من `left` إلى `inline-start` بدون فهم معنى العنصر
- ترك `justify-content` أو `flex-direction` يخلق انعكاساً غير مقصود بعد إصلاح spacing
- إبقاء `text-align:right` في كل مكان حتى في عناصر قد تستفيد من `start`
- نسيان الحالات المطلقة أو pseudo-elements عند المراجعة

## مراجعة نهائية سريعة

- هل زالت الخصائص الفيزيائية غير الضرورية؟
- هل بقي التموضع مفهوماً في RTL على الجوال؟
- هل ما زال المكوّن قابلاً للعمل في LTR إذا احتاج المشروع ذلك؟
