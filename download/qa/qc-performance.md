# QC SQLite performance benchmark

Profile: `large` · disposable single-instance SQLite · 9 measured runs after warmup.

| Scenario | p50 ms | p95 ms | max ms | queries |
| --- | ---: | ---: | ---: | ---: |
| dashboard | 0.323 | 0.348 | 0.348 | 3 |
| employee-tasks | 0.877 | 1.06 | 1.06 | 1 |
| task-search | 1.753 | 1.921 | 1.921 | 2 |
| lab-home | 0.165 | 0.173 | 0.173 | 3 |
| lab-search | 0.8 | 0.808 | 0.808 | 2 |
| tests-register | 0.061 | 0.068 | 0.068 | 2 |
| equipment | 0.101 | 0.104 | 0.104 | 1 |
| documents | 0.169 | 0.185 | 0.185 | 2 |
| change-requests | 0.034 | 0.036 | 0.036 | 1 |
| audit | 0.596 | 0.628 | 0.628 | 2 |
| reports | 4.227 | 4.639 | 4.639 | 1 |

No regulatory or arbitrary pass/fail threshold is applied. Query plans below are captured for the three highest p95 scenarios to support evidence-led follow-up.

## reports

```sql
SELECT t.test_number, t.status, t.final_result, p.code, e.code FROM lab_test_records t LEFT JOIN lab_products p ON p.id=t.product_id LEFT JOIN lab_equipment e ON e.id=t.equipment_id WHERE t.created_at >= ? ORDER BY t.created_at DESC
```

- SEARCH t USING INDEX idx_lab_tests_created_at (created_at>?)
- SEARCH p USING INTEGER PRIMARY KEY (rowid=?) LEFT-JOIN
- SEARCH e USING INTEGER PRIMARY KEY (rowid=?) LEFT-JOIN

## task-search

```sql
SELECT id, title, status, priority FROM tasks WHERE title LIKE ? ESCAPE '\' OR reference_number LIKE ? ESCAPE '\' ORDER BY updated_at DESC LIMIT 50
```

- SCAN tasks
- USE TEMP B-TREE FOR ORDER BY

## task-search

```sql
SELECT COUNT(*) FROM tasks WHERE title LIKE ? ESCAPE '\' OR reference_number LIKE ? ESCAPE '\'
```

- SCAN tasks

## employee-tasks

```sql
SELECT id, title, status, priority, due_date FROM tasks WHERE assigned_to = 3 ORDER BY updated_at DESC, id DESC LIMIT 50
```

- SEARCH tasks USING INDEX idx_tasks_assigned_to (assigned_to=?)
- USE TEMP B-TREE FOR ORDER BY

Integrity check: `ok`; foreign-key violations: 0.
