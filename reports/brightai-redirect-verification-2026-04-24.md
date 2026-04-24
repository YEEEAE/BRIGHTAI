# جدول تحقق Redirects من تصدير Search Console

**الغرض:** مطابقة الروابط القديمة أو غير المعيارية الظاهرة في `brightai/جدول.csv` مع الهدف المعياري المتوقع بعد إصلاح ملفات التوجيه.  
**ملاحظة:** هذا جدول **Expected Behavior** من الكود بعد التعديل، ويحتاج تحققاً حياً بعد النشر.

| Old URL | Target URL | Expected Status |
|---|---|---:|
| `https://brightai.site/ai-workflows` | `https://brightai.site/ai-workflows/` | `301` |
| `https://brightai.site/docs` | `https://brightai.site/docs/` | `301` |
| `https://brightai.site/frontend/pages/blogger/nca-compliance` | `https://brightai.site/blog/nca-compliance/` | `301` |
| `https://brightai.site/frontend/pages/try/index.html` | `https://brightai.site/try/` | `301` |
| `https://brightai.site/frontend/pages/ai-bots/BrightProject/index.html` | `https://brightai.site/ai-bots/BrightProject/` | `301` |
| `https://brightai.site/frontend/pages/ai-bots/BrightSales/index.html` | `https://brightai.site/ai-bots/BrightSales/` | `301` |
| `https://brightai.site/frontend/pages/ai-bots/BrightRecruiter/index.html` | `https://brightai.site/ai-bots/BrightRecruiter/` | `301` |
| `https://brightai.site/frontend/pages/ai-workflows/index.html` | `https://brightai.site/ai-workflows/` | `301` |
| `https://brightai.site/frontend/pages/our-products/index.html` | `https://brightai.site/services/` | `301` |
| `https://brightai.site/frontend/pages/ai-bots/index.html` | `https://brightai.site/ai-bots/` | `301` |
| `https://brightai.site/frontend/pages/about-us/index.html` | `https://brightai.site/about/` | `301` |
| `https://brightai.site/frontend/pages/contact/index.html` | `https://brightai.site/contact/` | `301` |
| `https://brightai.site/frontend/pages/ai-agent/index.html` | `https://brightai.site/ai-agent/` | `301` |
| `https://brightai.site/frontend/pages/consultation/index.html` | `https://brightai.site/consultation/` | `301` |
| `https://brightai.site/frontend/pages/data-analysis/index.html` | `https://brightai.site/data-analysis/` | `301` |
| `https://brightai.site/frontend/pages/smart-medical-archive/index.html` | `https://brightai.site/smart-medical-archive/` | `301` |
| `https://brightai.site/frontend/pages/smart-automation/index.html` | `https://brightai.site/smart-automation/` | `301` |
| `http://www.brightai.site/` | `https://brightai.site/` | `301` |
| `https://www.brightai.site/` | `https://brightai.site/` | `301` |
| `https://brightai.site/smart-automation.html` | `https://brightai.site/smart-automation/` | `301` |
| `https://brightai.site/ai-agent.html` | `https://brightai.site/ai-agent/` | `301` |
| `https://brightai.site/blogger/ai-generative-content-industry-saudi-arabia.html` | `https://brightai.site/blog/ai-generative-content-industry-saudi-arabia/` | `301` |

## تغطية التنفيذ

- تمت إضافة/مزامنة القواعد في:
  - [render.yaml](/Users/yzydalshmry/Desktop/BRIGHTAI/render.yaml)
  - [_redirects](/Users/yzydalshmry/Desktop/BRIGHTAI/_redirects)
  - [redirects.json](/Users/yzydalshmry/Desktop/BRIGHTAI/redirects.json)
- تم التحقق محلياً أن جميع الروابط القديمة المستهدفة من التصدير أصبحت ممثلة داخل طبقة التوجيه.
