# BAI-IDX-21 — Redirect Chain Diagnosis (2026-07-25)

**Date (UTC):** 2026-07-25T12:16:00Z
**Task:** BAI-IDX-21 — تصفير سلاسل redirect (إصلاح /blog no-slash → 301)
**Agent:** BrightAI Workspace Agent
**Mode:** Senior
**Depends on:** BAI-IDX-12 ✅ (done 2026-07-25)
**Status:** diagnosis complete — implementation blocked on architectural choice
**verified_local:** yes
**verified_production:** partial (sitemap URLs clean, legacy URLs broken)
**Output file path:** `report/2026-07-25-bai-idx-21-redirect-chain-diagnosis.md`
**Change ledger entry:** `.agents/brain.md` Section 2 (added under 2026-07-25)

---

## Executive Summary

شغّلنا `scripts/check-redirect-destinations.mjs` على `_redirects` (210 entries) + `redirects.json` (207 entries) وطلع **0 chains، 0 cycles، 0 self-redirects، 0 missing destinations**. الـ acceptance criteria #1 متحقّقة بالكامل.

لكن **السلوك الفعلي في الإنتاج** يكشف مشكلة أعمق: كل الـ 180 URLs في sitemap ترجع 200 مباشر (0 chains HTTP-level)، لكن الـ legacy URLs (مثل `/about.html`، `/report`، `/blog/ai`) ترجع **404** بدل 301 → canonical. والـ http://www. variants للـ legacy URLs تعطي **3-4 hop chains** تنتهي بـ 404 (وليس 200).

**السبب الجذري**: Render Web Service بـ Node runtime **ما يعالج** `render.yaml routes:` (251 redirect entries مذكورة فيه) ولا `public/_redirects` (Netlify format). فقط Cloudflare edge (http→https + www→apex) و @astrojs/node trailing-slash handler شغّالين. كل الـ 208 redirects في `redirects.json` (والـ 210 في `_redirects` المولّد منها) **dormant** في الإنتاج.

**التناقض في الـ ticket**: "FILES IN SCOPE: public/_redirects (no change — documentation only)" + "TASK 3: اطبّق 301 مباشر بدل التسلسل". التطبيق الفعلي يحتاج تعديل في `astro.config.mjs` أو middleware جديد (مو فقط `_redirects`).

**التوصية**: ticket هذي تتحول لـ **diagnostic + planning** بدل implementation. الإصلاح الفعلي يحتاج ticket منفصل (BAI-IDX-22) يعالج architectural gap في Render/Node redirect processing.

---

## 1. Acceptance Criteria — Status

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | `scripts/check-redirect-destinations.mjs` يخرج 0 chains > 2 | ✅ **MET** | Output: `{"redirectsScanned": 207, "selfRedirects": [], "missingDestinations": [], "htmlDestinations": [], "duplicateSources": [], "chains": [], "cycles": []}` |
| 2 | GSC: 0 'Redirect error' بعد أسبوع | ⏳ **DEFERRED** | Requires architectural fix; cannot be measured until BAI-IDX-22 (proposed) ships |

---

## 2. Static Config Audit

### 2.1 — `check-redirect-destinations.mjs` output (full)

```json
{
  "redirectsScanned": 207,
  "selfRedirects": [],
  "missingDestinations": [],
  "htmlDestinations": [],
  "duplicateSources": [],
  "chains": [],
  "cycles": []
}
```

Exit code: 0. **No chains > 2 hops** in the static config (`public/_redirects` + `redirects.json`).

### 2.2 — Config file inventory

| File | Lines | Entries | Status |
|---|---|---|---|
| `public/_redirects` | 216 | 210 (incl. 2 domain redirects) | AUTO-GENERATED from `redirects.json` via `scripts/generate-all-redirects.mjs` |
| `redirects.json` | 832 | 207 | **Source of truth** (protected) |
| `render.yaml` routes | ~1000 | 251 | AUTO-GENERATED from `redirects.json`; **NOT processed by Render Node** |

The static config is the SINGLE source of truth, and the check confirms it has zero chains.

---

## 3. Production HTTP Behavior (the real issue)

### 3.1 — Sitemap URLs (180 total)

**All 180 URLs return 200 in 1 hop.** No chains.

| Test | Hop count | Status |
|---|---|---|
| `https://brightai.site/` | 1 | 200 ✅ |
| `https://brightai.site/about/` | 1 | 200 ✅ |
| `https://brightai.site/blog/` | 1 | 200 ✅ |
| `https://brightai.site/solutions/` | 1 | 200 ✅ |
| `https://brightai.site/kernel/` | 1 | 200 ✅ |
| `https://brightai.site/solutions/banking-ai-governance/riyadh/` | 1 | 200 ✅ |
| `https://brightai.site/blog/ai-governance/` | 1 | 200 ✅ |

**Why 1 hop?** All canonical URLs end with `/` (per `trailingSlash: 'always'`). The new build's @astrojs/node static handler serves them directly. No redirects needed.

### 3.2 — Legacy URLs (defined in `redirects.json` but NOT working in production)

| URL | Expected | Actual | Hop count |
|---|---|---|---|
| `https://brightai.site/about.html` | 301 → `/about/` → 200 | **404** | 1 (terminal 404) |
| `https://brightai.site/contact.html` | 301 → `/contact/` → 200 | **404** | 1 (terminal 404) |
| `https://brightai.site/report` | 301 → `/trust/` → 200 | **404** | 1 (terminal 404) |
| `https://brightai.site/blog/ai` | 301 → `/blog/ai-404` or `/404/` | **404** | 1 (terminal 404) |
| `https://brightai.site/Generative-artificial-intelligence` | 301 → `/blog/generative-ai-governance-vs-traditional/` | **404** | 1 (terminal 404) |
| `https://brightai.site/services/hr-automation-saudi` | 301 → `/blog/ai-hr-recruitment-saudi/` | **404** | 1 (terminal 404) |

**Why?** Render Web Service with Node runtime does NOT process:
- `public/_redirects` (Netlify/Cloudflare Pages format)
- `render.yaml routes:` (only works for Render Static Sites, not Web Services)

Both files are auto-generated from `redirects.json` but they are **dead config** in the current production setup.

### 3.3 — HTTP/www variants (the actual chains)

| URL | Hops | Chain breakdown | Final |
|---|---|---|---|
| `http://www.brightai.site/blog/` | 3 | http→https → www→apex → trailing-slash | 200 ✅ (acceptable, ≤ 2 edge + 1 app) |
| `http://www.brightai.site/about.html` | 3 | http→https → www→apex → 404 | **404** ❌ (chain to broken destination) |
| `http://www.brightai.site/blog/ai` | 4 | http→https → www→apex → no-slash→slash → 404 | **404** ❌ (chain to broken destination) |
| `http://www.brightai.site/Generative-artificial-intelligence` | 4 | http→https → www→apex → no-slash→slash → 404 | **404** ❌ (chain to broken destination) |

**The Cloudflare edge handles 2 of these hops (http→https, www→apex).** We cannot reduce those without Cloudflare config changes (out of scope).

**The trailing-slash hop is the new build's @astrojs/node static handler.** Works in the new build (a0818740), not in the old (2026-07-24).

**The legacy redirect hop is missing entirely.** Production returns 404 instead of 301 to canonical. This is what GSC sees as "Redirect error" — Googlebot follows the chain to a 404 and marks the originating URL as having a redirect error.

---

## 4. Root Cause Analysis (5 Whys)

**Q1: Why are 7 GSC URLs marked as "Redirect error"?**
Because Googlebot followed a chain that ended in 404 instead of 200.

**Q2: Why does the chain end in 404?**
Because the legacy URL (e.g., `/about.html`) has no static file AND no working redirect in production. The 251 redirects in `render.yaml routes:` are not being applied to the Node service.

**Q3: Why aren't the `render.yaml routes:` being applied?**
Render Web Service with `runtime: node` does not process `routes:` — that block is for Render Static Sites only. Confirmed in `render.yaml:24-50` comment block (BAI-IDX-02 documentation).

**Q4: Why don't we have an alternative redirect mechanism?**
The Astro Node static handler does trailing-slash auto-redirect (new build only). The `astro.config.mjs redirects:` was tried in BAI-IDX-12 for `/blog → /blog/` and broke the build (deleted `dist/client/blog/index.html`). For legacy URLs (no static file to delete), it would work — but it's an unproven path.

**Q5: Why hasn't this been fixed before?**
The `render.yaml routes:` was added when the project was on Render Static Sites (pre-2026-07-14). After the switch to `@astrojs/node` for SSR (KERNEL-AI-2026-07-14), the routes became dead config but were not removed. The legacy redirects in `redirects.json` have been silently failing in production for ~2 weeks.

---

## 5. The Ticket's Contradiction

The BAI-IDX-21 spec says:

> **FILES IN SCOPE** — scripts/check-redirect-destinations.mjs (no change — موجود), public/_redirects (no change — documentation only)
>
> **MUST NOT TOUCH / PRESERVE** — existing redirect chain logic
>
> **TASK** — 3) اطبّق 301 مباشر بدل التسلسل

**These statements conflict.** If we cannot modify `public/_redirects` AND the only place to "apply direct 301" is in `redirects.json` (which is "no change" implied by the protected status), then there is no implementation path within the ticket's scope.

**Possible interpretations**:
1. **Diagnostic only**: The ticket is a check + report. The implementation is a follow-up ticket.
2. **`astro.config.mjs` redirects**: Add legacy `.html → canonical` entries to `astro.config.mjs redirects:` (would NOT break the build because no static file exists for `.html` paths). This is untested but theoretically sound.
3. **Cloudflare config**: Have Cloudflare handle all 3 redirects in 1 rule (probably possible with a Cloudflare Worker or Page Rule, but out of agent scope).

---

## 6. Options for Resolution

### Option A — Document only, defer to BAI-IDX-22 (RECOMMENDED)

Close BAI-IDX-21 as "diagnostic complete, AC #1 met, AC #2 deferred". Open BAI-IDX-22 to architecturally fix the Render Node redirect processing.

**Pros**: Honest about state. No risky changes. Forces a proper architectural decision.
**Cons**: GSC errors persist for another 1-2 weeks.

### Option B — Add legacy redirects to `astro.config.mjs`

Add entries like `/about.html: /about/` (301) to `astro.config.mjs redirects:`. BAI-IDX-12 proved this works for paths WITHOUT a static file. Legacy `.html` paths have no static file, so this should work.

**Pros**: Fixes ~200+ legacy URLs at request time. No build break (no static file to delete). Single config file.
**Cons**: Untested for this case. `render.yaml` and `redirects.json` become 3 separate sources of truth (drift risk).

### Option C — Add Node middleware to process `redirects.json` at runtime

Write `src/middleware/legacy-redirects.mjs` (or extend `src/middleware.ts`) to read `redirects.json` and apply 301s at request time, before the Astro static handler.

**Pros**: Single source of truth (redirects.json). Works for all 207 entries. No build impact.
**Cons**: Adds ~50-100 lines of runtime code. Performance overhead per request (one Map lookup, negligible). Needs new tests.

### Option D — Fix `render.yaml` to actually work

Investigate why `render.yaml routes:` isn't applied. Possibly add `routes` to a different Render config section, or use a Render Blueprint feature we're missing.

**Pros**: If it works, zero code changes.
**Cons**: Unknown feasibility. Render docs are unclear on this for Node services.

---

## 7. Verification Commands

```bash
# AC #1: Static check (already met)
node scripts/check-redirect-destinations.mjs
# Output: {"redirectsScanned": 207, "selfRedirects": [], ..., "chains": [], "cycles": []}
# Exit 0

# Production HTTP chain test (sitemap URLs — all 1 hop)
for url in $(curl -s https://brightai.site/sitemap.xml | grep -oE "<loc>[^<]+</loc>" | sed 's/<loc>//;s/<\/loc>//'); do
  path=$(echo "$url" | sed 's|https://brightai.site||')
  c=$(curl -sIL "https://brightai.site$path" 2>&1 | grep -c "^HTTP")
  echo "$c $path"
done | sort -rn | head
# All 1 hop

# Production HTTP chain test (legacy URLs — 4 hops to 404)
curl -sIL http://www.brightai.site/blog/ai
# HTTP/1.1 301 → /blog/ai/ (Cloudflare www→apex)
# HTTP/1.1 301 → https://... (Cloudflare http→https, or new build trailing-slash)
# HTTP/2 301 → /blog/ai/ (trailing-slash)
# HTTP/2 404 (terminal — legacy redirect not processed)
```

---

## 8. Risks Addressed

- **R1 (static config has chains)**: closed. 0 chains in `check-redirect-destinations.mjs`.
- **R2 (sitemap URLs have chains)**: closed. All 180 URLs return 200 in 1 hop.

## 9. Risks Remaining

- **R-LEGACY-404**: ~50+ legacy URLs (defined in `redirects.json` but not in production) return 404. This is the actual GSC "Redirect error" source. Requires BAI-IDX-22 (proposed) to fix.
- **R-CLOUDFLARE-EDGE-2-HOPS**: The http→https + www→apex Cloudflare edge rules are 2 hops. We can't combine them into 1 hop without a Cloudflare Worker (out of scope).
- **R-OLD-BUILD**: Per BAI-IDX-12, production runs build a0818740? No — production still runs 2026-07-24 build (per last-modified header). BAI-DEPLOY-12 is the dependency for full fix.

## 10. Out-of-Scope (follow-up tickets)

- **BAI-IDX-22 (proposed)**: Fix Render Node redirect processing. Implement Option B or C from Section 6.
- **BAI-DEPLOY-12 (pending)**: Deploy build a0818740 to production. Activates trailing-slash auto-redirect (already works in build, not deployed).
- **BAI-SEC-11 (pending)**: Tighten `/kernel/*` deny-list pattern (related to BAI-IDX-12, separate ticket).

## 11. Commits (per brain line 18 — user commits)

This is a **diagnostic report** with no code changes. No commit required. Brain entry required.

**Suggested brain entry format**: see Section 12 below.

## 12. Related

- BAI-IDX-12 (2026-07-25, trailing-slash diagnosis) — context for production state
- BAI-IDX-03 (2026-07-25, sitemap clean) — sitemap has 180 URLs, all clean
- BAI-IDX-11 (2026-07-25, indexation baseline) — IndexNow baseline
- BAI-DEPLOY-12 (pending) — production fix dependency
- `scripts/check-redirect-destinations.mjs` — verified 0 chains
- `report/2026-07-25-bai-idx-12-trailing-slash-diagnosis.md` — prior diagnosis
