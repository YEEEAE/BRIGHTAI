- Run with " npm run server " . API keys are read from environment only, never exposed to client.

- comands Git hub : 


git add . 
git commit -m "message"
git push -u origin main --force


-   نت


الخطوات:
npm ci
npm run sitemap:all 
npm run seo:check


 
سكربت فحص SEO CI:

seo-ci-check.mjs (line 1)
يفشل بـ exit 1 إذا صار أي كسر في:
canonical
hreflang (مطابقة AR/EN/x-default حسب الصفحة)
schema (BreadcrumbList + LocalBusiness + صلاحية JSON-LD)
og:image + og:image:alt + twitter:image + twitter:image:alt
sitemap.xml (روابط مفقودة، مكررة، أو روابط محظورة منخفضة الجودة)
ربط السكربت في npm scripts:

package.json (line 20)
تمت إضافة:
seo-ci-check.mjs"
GitHub Actions workflow:

seo-guard.yml (line 1)
يشتغل على pull_request و push على main عند تغييرات SEO ذات صلة.
الخطوات:
npm ci
npm run sitemap:all
npm run seo:check
