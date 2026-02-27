# دليل حوكمة النشر

## مزود الإنتاج
- مزود الإنتاج الرسمي: **Netlify**
- مصدر الحقيقة الوحيد للتوجيه ورؤوس الأمان وسياسات التخزين المؤقت: **`/netlify.toml`**

## ملفات التهيئة: فعّالة مقابل مؤرشفة
| الملف | الحالة | الغرض |
|---|---|---|
| `netlify.toml` | فعّال | جميع قواعد الإنتاج الخاصة بالتحويلات (redirects) والرؤوس (headers) والتخزين المؤقت (caching) |
| `.htaccess` | مؤرشف | مرجع توثيقي فقط (بدون أي توجيهات فعّالة) |
| `_headers` | مؤرشف | مرجع توثيقي فقط (بدون أي توجيهات فعّالة) |
| `docs/deployment-archive/.htaccess.legacy` | لقطة أرشيفية | قواعد Apache التاريخية |
| `docs/deployment-archive/_headers.legacy` | لقطة أرشيفية | قواعد headers التاريخية |

## سياسة التغيير
1. أي تغيير إنتاجي متعلق بالتوجيه أو الرؤوس أو التخزين المؤقت يجب أن يكون في `netlify.toml` فقط.
2. يجب أن تبقى `.htaccess` و`_headers` ملفات مؤرشفة وغير فعّالة.
3. كل تغيير يجب أن يجتاز الفحص: `npm run deploy:source-of-truth:check`.
4. أي PR يجب أن يتضمن ملاحظة مختصرة توضح ما تغيّر في:
   - التحويلات (Redirects)
   - رؤوس الأمان (Security Headers)
   - سياسة التخزين المؤقت (Cache Policy)

## فرض الالتزام عبر CI
- ملف الـ Workflow: `.github/workflows/netlify-source-of-truth.yml`
- اسم الفحص الإلزامي: **`Validate Netlify Source of Truth`**

## حماية الفرع (GitHub)
اضبط حماية فرع `main` بحيث تتطلب:
1. فحص الحالة: `Validate Netlify Source of Truth`
2. عدم الدمج المباشر بدون Pull Request
3. إلغاء الموافقات القديمة عند دفع commits جديدة
4. منع الدفع المباشر إلى `main` (موصى به)

## أمر التحقق المحلي
```bash
npm run deploy:source-of-truth:check
```

## التعامل مع الحوادث / التراجع
عند ظهور تراجع (Regression) في التحويلات أو الرؤوس أو التخزين المؤقت:
1. اعمل revert لآخر commit/commits خاصة بحوكمة النشر.
2. أعد تشغيل `npm run deploy:source-of-truth:check`.
3. أعد النشر من commit موثّق ومستقر.
