# لوحة القياس وعقود الأرقام

| المؤشر | التعريف والمصدر | الحالة الحالية |
|---|---|---|
|SA impressions/clicks|GSC country=SA، Web،28/90 يومًا؛ تجنب double counting|NOT VERIFIED؛ baseline مقدم بلا فترة|
|SA CTR|clicks/impressions لنفس cohort؛ مقام0→N/A|NOT VERIFIED|
|SA average position|قيمة GSC الموزونة؛ افصل query/device/brand mix|35.52 مقدم بلا فترة|
|SA nonbrand queries|استبعاد BrightAI وتهجئات برايت بقائمة مراجعة|NOT VERIFIED|
|qualified organic leads|distinct server lead IDs مقبولة ومؤهلة؛ GA4+CRM|NOT VERIFIED|
|AI sessions|session acquisition + source/referrer mapping موثق|NOT VERIFIED في الحساب؛ recognition محلي|
|AI engagement/conversion|engaged sessions/sessions؛ confirmed leads/sessions|NOT VERIFIED|
|AI mention/citation/description|مقامات10؛ panel ثابت وresponses صالحة|N/A،N=0|
|indexed eligible owners|Google selected canonical / eligible owners|NOT VERIFIED|
|qualified referring domains|نطاقات تحريرية مستقلة ذات صلة بعد dedupe|NOT VERIFIED|

## GA4 contract

مصدر الحدث chatgpt/perplexity/gemini/copilot/claude، وmedium=ai_referral عند غياب UTM أو إسناد سابق. هذه خصائص events مخصصة؛ لا تعيد كتابة GA4 traffic_source أو session source تلقائيًا. يلزم إعداد channel group/session mapping في الحساب ثم مطابقة event context مع page referrer. الـauto pageview قد يسبق provider؛ لا ندعي قياس acquisition مكتملًا من الكود وحده. GA4 snippet الإلزامي محفوظ.

سجل landing page وengagement وdemo/contact وlead_created. resource_download تنزيل مفتوح، assessment_started/completed تقييم، whatsapp_click نية اتصال وليس lead. الاستبعاد الموجود للـhoneypot وPII allowlist محفوظان. لا email/name/phone/conversation URL في الأحداث. referrer المحذوف يصبح direct؛ لا تنسبه AI بالتخمين. النشر ثم DebugView وRealtime ومطابقة تقارير24–48 ساعة قبل إعلان القياس.

## أولوية الفرص

أوزان مقترحة مجموعها100: Saudi impressions15، position15، commercial value10، relevance10، feasibility10، authority10، internal contextual links5، content gap10، conversion value10، AI citation potential5. وثّق تطبيع impressions بالlog داخل cohort؛ position boost للمدى2–15؛ KD قرينة لا ضمان. commercial/relevance/gap أحكام تحريرية موسومة، بينما authority وAI/conversion تحتاج دليلًا.

إذا عنصر ذو وزن مفقود: full score=NULL، وcompleteness هو مجموع الأوزان المتاحة. لا تعوض المفقود بصفر ولا تقارن partial score مع full. حاليًا GSC/authority/conversion/AI غير متاحة؛ score في CSV فارغ. P0/P1 أولوية تشغيلية وليست score مقاسًا.

## البيانات اللازمة

GSC90 يومًا+السابق،daily28،query/page/country/device/search appearance،index reason URLs خصوصًا59/4/7/3/3 وinspection للمالكين. GA4 session source/medium/campaign/country/landing page/engagement/conversions،CRM مؤهل بإذن. راجع brand regex وtimezone Asia/Riyadh واستبعاد internal traffic الفعلي. تاريخ سحب المزود لا يساوي فترة القياس؛ SERP PDPL محفوظ بتاريخ يوليو. قارن الأسبوع4/8/12 بخط أساس مماثل وسجل النشر وتحديثات البحث كعوامل مؤثرة.
