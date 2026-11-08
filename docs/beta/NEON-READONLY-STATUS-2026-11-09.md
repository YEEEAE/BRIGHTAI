# حالة Neon — جرد قراءة فقط بتاريخ 2026-11-09

> **النوع:** دليل قراءة فقط. لا كتابة، لا DDL، لا DCL، لا فرع، لا snapshot.
> **HEAD المحلي وقت الجرد:** `46ecaeae25368a467c30d27320978fb21aef2077` (فرع `main`).
> **تنبيه ربط:** هذا الجرد يصف **بيئة Neon** لا كود الـSHA. لا يُعد دليلًا على أن الـartifact المنشور يطابق HEAD، ولا يغلق G2.
> **حزمة البوابة المرجعية:** `docs/beta/RC-3eaf6907c35d0a138984defb5cf9f947f9520f82/GO-NO-GO-GATES.yaml` مبنية على SHA `3eaf6907…`؛ لا تُستخدم أدلتها لهذا الجرد ولا العكس.

الوسوم المستخدمة: `SCHEMA_PRESENT` / `PARTIAL` / `NOT_PRESENT` / `CONFIGURED` / `RUNTIME_VERIFIED` / `NOT_VERIFIED`.

---

## 1. المشروع والفرع

| البند | القيمة المرصودة | الوسم |
|---|---|---|
| المشروع | `young-frog-60183055` — «AIGAS Kernel» | `VERIFIED` (قراءة) |
| المنطقة/المنصة | `aws-us-east-2` / `aws` | `VERIFIED` (قراءة) |
| إصدار PostgreSQL | `18.6` | `VERIFIED` (قراءة) |
| قاعدة البيانات | `neondb`، المالك `neondb_owner` | `VERIFIED` (قراءة) |
| الفروع | فرع واحد فقط: `production` (`br-young-bird-b43proeb`)، `primary=true`, `default=true` | `VERIFIED` |
| حالة الفرع | `current_state=ready`، `logical_size=34,193,408` بايت | `VERIFIED` |
| حماية الفرع | **`protected=false`** | `NOT_CONFIGURED` |
| staging | غير موجود | `NOT_PRESENT` |
| تاريخ الفرع | `created_at=2026-11-01T00:12:40Z`، `updated_at=2026-11-08T21:17:46Z` | `VERIFIED` |

## 2. النسخ والاستعادة (الوضع الفعلي)

| البند | القيمة المرصودة | الأثر |
|---|---|---|
| Snapshots | **لا يوجد أي snapshot** (`list_snapshots` أعاد `[]`) | لا نقطة استعادة صريحة |
| جدول النسخ التلقائي | **فارغ** (`get_snapshot_schedule` أعاد `schedule: []`) | لا نسخ مجدولة |
| نافذة تاريخ الفرع | `history_retention_seconds = 21600` (6 ساعات) | أقصى نطاق Instant Restore هو 6 ساعات فقط |
| الاستعادة الفعلية | لم تُنفَّذ | `NOT_RUN` |
| RPO | غير مقيس؛ يقتصر نظريًا على نافذة 6 ساعات وبلا snapshot دائم | `NOT_VERIFIED` |
| RTO | غير مقيس | `NOT_VERIFIED` |

> لا توجد نقطة استعادة قابلة للاستدعاء بعد 6 ساعات، ولا نسخة يدوية. أي تغيير الآن على `production` يقع خارج نطاق استعادة مضمون زمنيًا.

## 3. الشبكة وData API

| الإعداد | القيمة | الوسم |
|---|---|---|
| `block_public_connections` | `false` | `NOT_CONFIGURED` (بحسب السياسة المستهدفة) |
| `allowed_ips` | `[]` | `NOT_CONFIGURED` |
| `protected_branches_only` | `false` | `NOT_CONFIGURED` |
| نافذة الصيانة | الخميس 04:00–05:00 | `VERIFIED` |
| Data API | `status=active`، `db_schemas=["public"]`، `db_anon_role=anonymous`، `db_aggregates_enabled=true` | `CONFIGURED` — سطح وصول عميل مباشر |
| HIPAA | `false` | `VERIFIED` |

## 4. المخطط والأدوار والسياسات

| البند | القيمة | الوسم |
|---|---|---|
| جداول `public` | 31 | `SCHEMA_PRESENT` |
| RLS مفعّل | 31/31 | `SCHEMA_PRESENT` |
| `FORCE ROW LEVEL SECURITY` | 0/31 | `NOT_PRESENT` |
| سياسات RLS | 2 فقط: `sc_request_owner`، `sc_cancellation_owner` | `PARTIAL` |
| `aigas_runtime` | غير موجود | `NOT_PRESENT` |
| `neondb_owner` | `rolbypassrls=true`, `rolcanlogin=true` | `VERIFIED` |
| `authenticated` | 124 منح DML (4 × 31 جدولًا) | `NOT_CONFIGURED` (0018 غير مطبّق) |
| `authenticated`/`anonymous` | `rolcanlogin=false` (أدوار PostgREST) | `VERIFIED` |
| سجل migrations | لا يوجد جدول ledger | `NOT_PRESENT` |

### عدّ البيانات المفحوص

| الكيان | العدد |
|---|---|
| `aigas_tenants` | 0 |
| `aigas_memberships` | 0 |
| `aigas_ld_events` | 0 |
| `aigas_audit_events` | 0 |
| `aigas_sc_requests` | 0 |
| `aigas_hg_requests` | 0 |
| `aigas_re_assets` | 0 |
| `neon_auth."user"` / `session` / `organization` / `member` / `invitation` | 0 / 0 / 0 / 0 / 0 |

> العدّ أعلاه لعيّنة محددة؛ لا يُعمم على "خلو النظام" مستقبلًا ولا يُعد دليلًا على عدم وجود بيانات في مسارات لم تُفحص.

## 5. حالة الترحيلات — تحقق ثانٍ (2026-11-09)

| الملف | الدليل المرصود | الحكم |
|---|---|---|
| `0013` | قيد `aigas_ld_events_check` موجود لكنه **لا يتضمن** `request_fingerprint`؛ الدالة `aigas_ld_events_chain_guard` والـtrigger غائبان (الموجود فقط `aigas_ld_events_reject_mutation`) | `PARTIAL` |
| `0014` | `aigas_hg_delegations` و`aigas_hg_grants` غائبة، وأعمدة `provider_ref/cancelled_at/cancelled_by/cancel_reason` غائبة من `aigas_hg_requests` | `NOT_PRESENT` |
| `0016` | الدالة `aigas_sc_usage_window_v2` غائبة؛ الموجودة `aigas_sc_usage_window` فقط | `NOT_PRESENT` |
| `0017` | أعمدة `aigas_audit_events` هي 5 فقط (`id, tenant_id, actor_user_id, action, created_at`) | `NOT_PRESENT` |
| `0018` | 124 منح DML قائمة لـ`authenticated` | `NOT_PRESENT` |
| `0019` | الدور `aigas_runtime` غائب، والسياسات 2 فقط | `NOT_PRESENT` |
| `0020` | `aigas_policy_versions.required_approvals` + قيدا النسخة/الموافقة + فهرس `aigas_policy_approvals_actor_action_idx` موجودة | **`PRESENT` (مطبّق)** |
| `0021` | الدالة `aigas_re_guard_treatment` موجودة، والـtrigger `aigas_re_treatment_guard` موجود | **`PRESENT` (مطبّق)** |
| `0022` | فهرسا `aigas_fw_decisions_request_scope_idx` و`aigas_sc_requests_scope_idx` غائبان | `NOT_PRESENT` |
| `0023` | جداول التجربة الثلاثة غائبة | `NOT_PRESENT` |
| `0024` | حارس السلسلة وأعمدة Audit الثلاثة غائبة | `NOT_PRESENT` |
| `0025` | دوال النطاق (`aigas_actor`, `aigas_tenant_scope`, …) غائبة، و`FORCE RLS`=0 | `NOT_PRESENT` |
| `0026` | أعمدة الخطر المتبقي/`acceptance_policy_version` غائبة | `NOT_PRESENT` |
| `0027` | لا سياسات participant-only؛ الجدولان يحملان سياسة المؤسسة فقط (وغائبة أصلًا) | `NOT_PRESENT` |

**تصحيح مسجّل:** الجرد السابق أفاد بأن `0020` و`0021` مطبقتان؛ التحقق الحالي يؤكد ذلك بكائناتهما المحددة. لا تغيير في الحكم.

## 6. أثر ذلك على G5 وG7

| البوابة | الحالة | السبب المرصود |
|---|---|---|
| **G5 — Schema readiness on staging** | **BLOCKED** | لا فرع staging، ولا سجل migrations، و11 ملفًا غير مطبّق (`0013` جزئي، `0014,0016,0017,0018,0019,0022,0023,0024,0025,0026,0027`). |
| **G7 — Backup and restore** | **BLOCKED** | `production` غير محمي، لا snapshots، لا جدول نسخ، ولا استعادة مُختبرة، ولا RPO/RTO مقيس. |

> لم يُرفع أي حكم إلى GO. لا `RUNTIME_VERIFIED` ولا `APPROVED` في هذا الملف.
