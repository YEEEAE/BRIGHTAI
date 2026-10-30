# BRIGHT AI

Artificial Intelligence Governance and Safety (AIGAS)

# hostinger domain

https://brightai.live

# Cloudflare

  ربطنا `brightai.live` على Cloudflare كـ DNS/CDN وحماية قدّام Render، بدل الاعتماد على Hostinger للـ DNS.
فعّلنا Client-side Security، وضبطنا الكاش بحيث `/api/*` بدون كاش وملفات `/_astro/*` و`/assets/*` بكاش طويل.
وضبطنا Rate Limiting على `/api/ai/chat` لحماية استهلاك الـ AI من السبام والطلبات الزايدة.

# قواعد البيانات

DATABASE_URL=postgresql://<user></user>:<password></password>@localhost:5432/<database></database>
psql postgresql://<user></user>:<password></password>@localhost:5432/<database></database>
{
  "ssh": "Disabled",
  "previewLimit": 50,
  "server": "localhost",
  "port": 5432,
  "driver": "PostgreSQL",
  "name": "brightai_dev",
  "database": "brightai_dev",
  "username": "brightai_admin"
}

# EVAL-CERT signing key (Ed25519) — keyId=v1

# Add this to .env (or the hosting dashboard). Keep private key secret.

# To support rotation, include prior entries (no privateKey).

EVAL_CERT_SIGNING_KEY_RING=[{"keyId":"v1","publicKey":"<generate with scripts/generate-eval-cert-key.mjs>"}]

# Or flat env (single key):

EVAL_CERT_KEY_ID=v1
EVAL_CERT_PUBLIC_KEY=<generate with scripts/generate-eval-cert-key.mjs>

# EVAL_CERT_PRIVATE_KEY=<set only in the local environment/hosting secret store>

# (أ) توليد مفتاح دايم — مرة وحدة

node scripts/generate-eval-cert-key.mjs

node scripts/generate-eval-cert-key.mjs --key-id v2      # لو حبيت يدور المفتاح بعدين

المالك يولّد المفتاح محليًا بالأمر أعلاه، ثم يحفظ المفتاح الخاص في `.env` أو في
مخزن أسرار الاستضافة فقط، ويضع المفتاح العام ومعرّف المفتاح في `EVAL_CERT_SIGNING_KEY_RING`.
لا تنسخ المفتاح الخاص إلى README أو أي ملف متتبع. عند الاشتباه بتسريب مفتاح سابق،
دوّر المفتاح خارجيًا وألغِ/عطّل المفتاح القديم قبل اعتماد المفتاح الجديد.

أو عبر psql للتجربة المباشرة إن القاعدة مخزّنة:
psql "postgresql://brightai:brightai@localhost:5432/brightai_dev" -c 'SELECT "keyId","algorithm","active" FROM signing_keys;'

Render Static Site يجب ضبطه على Node 22 LTS:

- في Environment أضف `NODE_VERSION=22.22.2`
- Build Command: `npm install && npx astro build`
- بعد تغيير إصدار Node نفذ Clear build cache & deploy من لوحة Render.

 *cloudflare* nihmuk@mohemil.com
 مفعل فيه  :
 DNS
 SSL/TLS
 Security :Quickly identify security action items and view the security posture of your domain.
Caching

*MCP SERVERS*
Playwright MCP
هذا كأنه عيون Cline داخل المتصفح.
يعني بدل ما يقرأ الملفات بس، يفتح موقعك فعليًا ويشوف:
هل الصفحة تفتح؟
هل فيه 404؟
هل التصميم خربان بالجوال؟
هل فيه أخطاء Console؟
هل الأزرار والروابط شغالة؟
استخدمه لما تقول:
استخدم Playwright وافتح الموقع وافحص الصفحات كمتصفح حقيقي.
مثاله في BrightAI:
بعد ما تحول صفحات HTML إلى Astro، تخليه يفتح /about/ و/services/ و/kernel/ ويتأكد إنها شغالة.

Context7 MCP
هذا كأنه مكتبة توثيق حديثة لـ Cline.
يعني إذا Cline بيكتب Astro أو React أو Vite، Context7 يساعده يجيب الطريقة الصحيحة من التوثيق بدل ما يخترع أو يستخدم كود قديم.
استخدمه لما تقول:
استخدم Context7 قبل كتابة أي كود Astro.
مثاله في BrightAI:
لو تبي يسوي content collections أو getStaticPaths أو Layouts في Astro، خله يستخدم Context7 أول.

Sequential Thinking MCP
هذا كأنه مخ Cline المنظم قبل الشغل الكبير.
يفيده يرتب أفكاره قبل لا يعدل ملفات كثيرة. ممتاز إذا المهمة خطيرة، مثل حذف HTML قديم، تعديل render.yaml، أو ترحيل صفحات كثيرة.
استخدمه لما تقول:
استخدم Sequential Thinking أولًا وقسم المهمة قبل التنفيذ.

مثاله في BrightAI:
قبل ما تقول له “انقل كل صفحات HTML إلى Astro”، خله يستخدمه عشان يخطط وما يخرب المشروع.

الزبدة:
Playwright = يفحص الموقع بعينه في المتصفح
Context7 = يجيب توثيق حديث عشان الكود يطلع صح
Sequential Thinking = يرتب الخطة قبل التعديلات الكبيرة

وإيه، يشتغلون تلقائي أحيانًا، بس الأفضل تذكرهم بالاسم في البرومبت عشان تجبر Cline يستخدمهم صح.

*Freebuff *

🚀 Commands:

   hermes              Start chatting
   hermes setup        Configure API keys & settings
   hermes config       View/edit configuration
   hermes config edit  Open config in editor
   hermes gateway install Install gateway service (messaging + cron)
   hermes update       Update to latest version

<!-- Google tag (gtag.js) -->

<script async src="https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q"></script>

<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8LLESL207Q');
</script>
