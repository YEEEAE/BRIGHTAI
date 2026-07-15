# Archived Artifacts — دليل الأرشيف الرسمي

> توثيق الملفات اللي اتحذفت من الـ repo مع snapshot خارجي يحفظها للـ audit trail.

---

## Snapshot Pattern

كل cleanup كبير (10+ ملف أو 100KB+) يُنشئ snapshot tar.gz محفوظ في `.agents/snapshots/`. الـ snapshots تبقى للأبد كـ safety net — لو احتجنا أي ملف محذوف، نقدر نرجعه من الـ snapshot بدون git archeology.

**القاعدة**: snapshot قبل الحذف دائماً. لو ما عندك snapshot، لا تحذف.

---

## الأرشيف الحالي

### `brightai-kernel-legacy-2026-07-15.tar.gz` (130 KB مضغوط)

**الأصل**: `kernel/legacy-disabled/` — 640 KB (9 entries)

**التاريخ**: 2026-07-15

**التغيير**: CLEANUP-2026-07-15 — حذف نهائي من الـ repo

**المحتوى الكامل**:

```
kernel/legacy-disabled/
├── README.md              # توثيق الـ risk + migration path
├── manifest.json          # legacy PWA manifest (share_target = 404)
├── sw.js                  # legacy service worker (caches /api/kernel/* + PII queue)
├── kernel-perf.js         # legacy perf instrumentation
├── kernel-web-vitals.js   # legacy web vitals
├── api/
│   └── mock/              # 8 ملفات JSON (Saudi PII patterns synthetic)
├── assets/
│   └── js/                # 17 ملف JS (kernel-pwa, kernel-api, kernel-mock-handlers, إلخ)
└── tests/
    └── 6 ملفات .test.js
```

**ليش حُذف**:
- 0 references في الـ live code (grep عبر `src/`, `public/`, `apps/`, `packages/`).
- CI guards `verify-no-legacy-sw.mjs` و `verify-no-legacy-mock.mjs` ما عاد لهم لازمة (لكن kept للـ defense-in-depth ضد re-introduction).
- الـ files كلها legacy code (pre-Astro migration) بدون استخدام فعلى.

**كيف تستعيد أي ملف**:

```bash
# 1. استخرج الـ snapshot
tar xzf .agents/snapshots/brightai-kernel-legacy-2026-07-15.tar.gz -C /tmp/

# 2. انسخ الملف المطلوب
cp /tmp/kernel/legacy-disabled/<file> kernel/<file>

# 3. تحقق إن الـ CI guards لسا passes
node scripts/verify-no-legacy-sw.mjs
node scripts/verify-no-legacy-mock.mjs

# 4. وثّق السبب في commit message
```

---

## ملفات منفردة محذوفة (CLEANUP-2026-07-15)

| الملف | الحجم | السبب | Snapshot |
|---|---|---|---|
| `chartjs.tgz` | 1.2 MB | npm package tarball ضايعة في الـ repo root (ما عاد لها لازمة — `@brightai/chart` من الـ workspace) | — (يمكن إعادة تحميل من npm) |
| `seo_gate_log.txt` | 516 bytes | CI residue من script قديم | — (لا قيمة) |
| `kernel/assets/screenshots/narrow.png` + `wide.png` | 16 KB | 0 references في الـ live code (`public/manifest.webmanifest` يستخدم `/images/og/brightai-og-1200x630.png`) | — (يمكن إعادة توليد) |

---

## Snapshots السابقة

### `2026-07-08-pre-cleanup-dupes.tar.gz` (3.0 MB)

**الأصل**: cleanup الـ duplicates من pre-2026-07-08 state.

**التوثيق**: `report/CLEANUP_PASS_B_CODE_RESIDUE_AND_DEPLOYMENT_HARDENING_REPORT.md`

---

## القواعد (للـ future cleanups)

1. **Snapshot دائماً قبل الحذف الكبير**: `tar czf .agents/snapshots/<name>-<date>.tar.gz <path>`
2. **وثّق في `docs/archived-artifacts.md`**: اسم الـ tarball، الحجم، التاريخ، السبب
3. **حدّث `.gitignore`** للـ patterns الجديدة (مثل `*.tgz`)
4. **حدّث CI guards** لو الـ cleanup يكسرهم
5. **حدّث README** لأي directory متأثر
6. **أضف entry في `META-CHANGES.csv`**
7. **أضف entry في `.agents/brain.md` change ledger**

---

## المرجعيات

- `.agents/snapshots/` — كل الـ snapshots الرسمية
- `.agents/brain.md` Section 2 (Change Ledger) — كل التغييرات الجوهرية
- `META-CHANGES.csv` — خط زمني لكل التغييرات
- `report/` — التقارير التفصيلية

---

**صاحب الملف**: BrightAI Workspace Agent
**آخر تحديث**: 2026-07-15
**الإصدار**: 1.0