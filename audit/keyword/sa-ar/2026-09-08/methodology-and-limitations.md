# المنهجية والقيود

## Snapshot
Date 2026-09-08; branch `main`; commit `e5964dac2800ea4b7b1ea4694217ecf206bf3861`; production `https://brightai.live`.

## Semrush
تم اكتشاف تقارير keyword/organic/competitor ومخططات `phrase_these`, `phrase_related`, `phrase_questions`, `phrase_kdi`, `phrase_organic`, `domain_organic_organic`. database `sa` مدعوم في المخططات التي فُحصت.

**لم يتم `execute_report`** لأن الطلب اشترط عدم تنفيذ طلبات مدفوعة قبل اعتماد سقف استهلاك، ولا يوجد سقف API units محدد، والموصل لا يعرض أداة مستقلة للرصيد/تكلفة التقرير قبل التنفيذ.

لذلك Volume/KD/CPC/competition/trend فارغة عمدًا.

## Priority formula
Full:
`0.30 relevance + 0.25 commercial intent + 0.20 competitiveness + 0.15 log-normalized Saudi volume + 0.10 evidence readiness`

Missing values are not zero. Available weights are renormalized.
Current available share = **65%** (relevance + commercial intent + readiness), so scores are preliminary.

## Volume normalization later
`log1p(volume)` then min-max normalization within the collected relevant set. Do not merge overlapping phrase volumes into unique users.

## Coverage limits
Source routes are inventoried. Live HTTP/canonical/orphan status not verified. Dynamic Blog/Docs/Hub members are not fully expanded. Repository-reported build count is 276 HTML pages, not an independently crawled total in this audit.

## GSC / Analytics
Not available here; no fabricated baseline.

## Semrush completion condition
Approve a hard cap such as 5,000 or 10,000 API units. Then run: phrase_these → phrase_kdi → related/questions → phrase_organic → organic competitors, with pagination limited by cap and immediate stop on auth/credit error.
