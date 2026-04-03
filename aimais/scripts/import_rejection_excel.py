#!/usr/bin/env python3
import json
import re
import sqlite3
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "aimais.db"
SCHEMA_PATH = ROOT / "sql" / "schema.sql"
CACHE_PATH = DATA_DIR / "analytics-cache.json"
IMPORT_SUMMARY_PATH = DATA_DIR / "import-summary.json"
EXPECTED_REJECTION_COLUMNS = [
    "id",
    "report_date",
    "item_code",
    "machine_name",
    "produced_qty",
    "rejected_qty",
    "reject_pct",
]
HEADER_ALIASES = {
    "report_date": ["DATE", "REPORT DATE", "TRANSACTION DATE"],
    "item_code": ["ITEM.CODE", "ITEM CODE", "COMPONENT CODE"],
    "machine_name": ["MACHINE NAME", "MACHINE", "LINE NAME", "AREA"],
    "produced_qty": ["PRODUCTED QTY", "PRODUCED QTY", "PRODUCT QTY", "QUANTITY PRODUCED"],
    "rejected_qty": ["QUANTITY", "REJECT QTY", "REJECT QUANTITY"],
    "reject_pct": ["REJECT %", "REJECTION %", "REJECT PERCENTAGE"],
}
REQUIRED_FIELDS = ["report_date", "item_code", "produced_qty", "rejected_qty"]


def normalize_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_header(value):
    return re.sub(r"[^A-Z0-9]+", "", normalize_text(value).upper())


def parse_number(value, default=0.0):
    if value is None or value == "":
        return default
    if isinstance(value, (int, float)):
        return float(value)

    raw = str(value).strip().replace(",", "")
    raw = raw.rstrip("%")
    if not raw:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def coerce_date(value):
    if value is None or value == "":
        return None
    if hasattr(value, "date"):
        return value.date().isoformat()
    if hasattr(value, "isoformat") and not isinstance(value, str):
        return value.isoformat()

    raw = str(value).strip()
    if not raw:
        return None

    for pattern in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y"):
        try:
            return datetime.strptime(raw, pattern).date().isoformat()
        except ValueError:
            continue
    return None


def month_label(month_key):
    date = datetime.strptime(month_key, "%Y-%m")
    months_en = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    return f"{months_en[date.month - 1]} {date.year}"


def iso_week(date_string):
    date = datetime.strptime(date_string, "%Y-%m-%d").date()
    year, week, _ = date.isocalendar()
    return f"{year}-W{week:02d}"


def build_empty_analytics():
    return {
        "lastUpdated": None,
        "latestMonthLabel": "No data",
        "previousMonthLabel": "No data",
        "recent15DayWindow": None,
        "dailySnapshot": None,
        "overview": {
            "totalRejectQty": 0,
            "totalProducedQty": 0,
            "latestRejectRate": 0,
            "productsAboveThreshold": 0,
            "abnormalProduct": "No data",
            "abnormalDelta": 0,
        },
        "areaSummaries": [],
        "monthlyTrend": [],
        "weeklyTrend": [],
        "periodInsights": {
            "monthCount": 0,
            "weekCount": 0,
            "latestWeekLabel": "No data",
            "peakMonth": None,
            "peakWeek": None,
            "averageMonthlyRate": 0,
        },
        "productAlerts": [],
        "topProductsByLoss": [],
        "narrative": "Import rejection data to generate item-level analytics.",
    }


def normalize_identity_number(value):
    return format(parse_number(value, 0.0), ".12g")


def record_identity(report_date, item_code, machine_name, produced_qty, rejected_qty, reject_pct):
    return (
        str(report_date or "").strip(),
        normalize_text(item_code),
        normalize_text(machine_name),
        normalize_identity_number(produced_qty),
        normalize_identity_number(rejected_qty),
        normalize_identity_number(reject_pct),
    )


def legacy_record_identity(report_date, item_code, produced_qty, rejected_qty, reject_pct):
    return (
        str(report_date or "").strip(),
        normalize_text(item_code),
        normalize_identity_number(produced_qty),
        normalize_identity_number(rejected_qty),
        normalize_identity_number(reject_pct),
    )


def resolve_header_indices(headers):
    normalized_headers = {normalize_header(header): index for index, header in enumerate(headers)}
    indices = {}
    for field, aliases in HEADER_ALIASES.items():
        for alias in aliases:
            alias_key = normalize_header(alias)
            if alias_key in normalized_headers:
                indices[field] = normalized_headers[alias_key]
                break
    return indices


def find_sheet_and_headers(workbook):
    best_match = None
    for sheet_name in workbook.sheetnames:
        sheet = workbook[sheet_name]
        for row_number, row in enumerate(sheet.iter_rows(values_only=True), start=1):
            if row_number > 12:
                break
            indices = resolve_header_indices(row)
            matched_required = sum(1 for field in REQUIRED_FIELDS if field in indices)
            score = len(indices) + matched_required * 3
            if matched_required == len(REQUIRED_FIELDS) and (best_match is None or score > best_match["score"]):
                best_match = {
                    "sheet_name": sheet_name,
                    "header_row": row_number,
                    "headers": row,
                    "indices": indices,
                    "score": score,
                }
    if best_match is None:
        raise SystemExit("Unable to detect a valid header row in the workbook.")
    return best_match


def value_at(raw, indices, field, default=""):
    index = indices.get(field)
    if index is None or index >= len(raw):
        return default
    value = raw[index]
    return value if value is not None else default


def ensure_rejection_records_schema(connection):
    existing_columns = [
        row[1]
        for row in connection.execute("PRAGMA table_info(rejection_records)").fetchall()
    ]
    critical_columns = {"id", "report_date", "item_code", "produced_qty", "rejected_qty", "reject_pct"}
    if existing_columns and not critical_columns.issubset(set(existing_columns)):
        connection.execute("DROP TABLE IF EXISTS rejection_records")
        existing_columns = []

    if not existing_columns:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        return

    if "machine_name" not in existing_columns:
        connection.execute(
            "ALTER TABLE rejection_records ADD COLUMN machine_name TEXT NOT NULL DEFAULT ''"
        )

    connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def compute_analytics(records):
    """
    records is a list of dicts with keys:
      report_date, item_code, produced_qty, rejected_qty, reject_pct
    """

    if not records:
        return build_empty_analytics()

    monthly = defaultdict(lambda: {"produced": 0.0, "rejected": 0.0})
    weekly = defaultdict(lambda: {"produced": 0.0, "rejected": 0.0})
    items = defaultdict(
        lambda: {
            "produced": 0.0,
            "rejected": 0.0,
            "pcts": [],
            "monthly": defaultdict(lambda: {"produced": 0.0, "rejected": 0.0, "pcts": []}),
        }
    )

    total_produced = 0.0
    total_rejected = 0.0
    latest_date = None

    for row in records:
        date = row["report_date"]
        code = row["item_code"] or ""
        produced = float(row["produced_qty"] or 0)
        rejected = float(row["rejected_qty"] or 0)
        pct = float(row["reject_pct"] or 0)
        month_key = date[:7]
        week_key = iso_week(date)

        total_produced += produced
        total_rejected += rejected
        if not latest_date or date > latest_date:
            latest_date = date

        monthly[month_key]["produced"] += produced
        monthly[month_key]["rejected"] += rejected

        weekly[week_key]["produced"] += produced
        weekly[week_key]["rejected"] += rejected

        if code:
            items[code]["produced"] += produced
            items[code]["rejected"] += rejected
            items[code]["pcts"].append(pct)
            items[code]["monthly"][month_key]["produced"] += produced
            items[code]["monthly"][month_key]["rejected"] += rejected
            items[code]["monthly"][month_key]["pcts"].append(pct)

    all_months = sorted(monthly.keys())
    all_weeks = sorted(weekly.keys())[-8:]
    latest_month = all_months[-1]
    previous_month = all_months[-2] if len(all_months) > 1 else latest_month

    def rate(produced, rejected):
        return round((rejected / produced * 100) if produced else 0, 2)

    monthly_trend = [
        {
            "label": month_label(month_key),
            "monthKey": month_key,
            "rejectRate": rate(monthly[month_key]["produced"], monthly[month_key]["rejected"]),
        }
        for month_key in all_months
    ]

    weekly_trend = [
        {
            "label": week_key,
            "rejectRate": rate(weekly[week_key]["produced"], weekly[week_key]["rejected"]),
        }
        for week_key in all_weeks
    ]

    product_alerts = []
    top_by_loss = []
    all_time_items_above_threshold = 0

    for code, info in items.items():
        item_months = sorted(info["monthly"].keys())
        latest_item_month = item_months[-1] if item_months else None
        latest_data = info["monthly"].get(latest_item_month) if latest_item_month else None
        latest_rate = rate(latest_data["produced"], latest_data["rejected"]) if latest_data else 0
        all_time_rate = rate(info["produced"], info["rejected"])
        baselines = []
        for month_key, month_data in info["monthly"].items():
            if month_key == latest_item_month:
                continue
            baselines.append(rate(month_data["produced"], month_data["rejected"]))

        baseline_rate = sum(baselines) / len(baselines) if baselines else latest_rate
        delta = latest_rate - baseline_rate

        if all_time_rate >= 5:
            all_time_items_above_threshold += 1

        if latest_rate >= 5 or delta >= 1:
            product_alerts.append(
                {
                    "productName": code,
                    "code": code,
                    "latestRate": round(latest_rate, 2),
                    "baselineRate": round(baseline_rate, 2),
                    "delta": round(delta, 2),
                    "rejectQty": round((latest_data["rejected"] if latest_data else info["rejected"]), 2),
                    "producedQty": round((latest_data["produced"] if latest_data else info["produced"]), 2),
                }
            )

        avg_pct = sum(info["pcts"]) / len(info["pcts"]) if info["pcts"] else 0
        top_by_loss.append(
            {
                "productName": code,
                "code": code,
                "rejectQty": round(info["rejected"], 2),
                "producedQty": round(info["produced"], 2),
                "totalRate": round(avg_pct, 2),
            }
        )

    product_alerts.sort(key=lambda item: (item["latestRate"], item["delta"]), reverse=True)
    top_by_loss.sort(key=lambda item: item["rejectQty"], reverse=True)

    abnormal = product_alerts[0] if product_alerts else None
    overall_rate = rate(total_produced, total_rejected)
    previous_rate = rate(monthly[previous_month]["produced"], monthly[previous_month]["rejected"])
    peak_month = max(
        monthly_trend,
        key=lambda item: item["rejectRate"],
        default=None,
    )
    peak_week = max(
        weekly_trend,
        key=lambda item: item["rejectRate"],
        default=None,
    )
    average_monthly_rate = round(
        sum(item["rejectRate"] for item in monthly_trend) / len(monthly_trend),
        2,
    ) if monthly_trend else 0

    last_day = max(
        (row["report_date"] for row in records if row.get("report_date")),
        default=None,
    )

    daily_snapshot = None
    if last_day:
        day_rows = [row for row in records if row["report_date"] == last_day]
        day_produced = sum(float(row.get("produced_qty") or 0) for row in day_rows)
        day_rejected = sum(float(row.get("rejected_qty") or 0) for row in day_rows)
        day_rate = round(
            (day_rejected / day_produced * 100) if day_produced else 0,
            2,
        )

        day_items = defaultdict(lambda: {
            "produced": 0.0,
            "rejected": 0.0,
            "pcts": [],
            "count": 0,
        })
        for row in day_rows:
            code = (row.get("item_code") or "").strip()
            if not code:
                continue
            day_items[code]["produced"] += float(row.get("produced_qty") or 0)
            day_items[code]["rejected"] += float(row.get("rejected_qty") or 0)
            day_items[code]["pcts"].append(float(row.get("reject_pct") or 0))
            day_items[code]["count"] += 1

        top_items = sorted(
            [
                {
                    "itemCode": code,
                    "produced": round(values["produced"], 2),
                    "rejected": round(values["rejected"], 2),
                    "avgPct": round(
                        sum(values["pcts"]) / len(values["pcts"]) if values["pcts"] else 0,
                        2,
                    ),
                    "maxPct": round(max(values["pcts"]) if values["pcts"] else 0, 2),
                    "occurrences": values["count"],
                }
                for code, values in day_items.items()
            ],
            key=lambda item: -item["rejected"],
        )

        above_threshold = [item for item in top_items if item["avgPct"] >= 5]

        try:
            date_obj = datetime.strptime(last_day, "%Y-%m-%d")
            date_label = date_obj.strftime("%A, %d %B %Y")
        except Exception:
            date_label = last_day

        daily_snapshot = {
            "date": last_day,
            "dateLabel": date_label,
            "totalProduced": round(day_produced, 2),
            "totalRejected": round(day_rejected, 2),
            "overallRate": day_rate,
            "itemCount": len(day_items),
            "itemsAbove5": len(above_threshold),
            "topItems": top_items[:10],
            "aboveThreshold": above_threshold,
        }

    return {
        "lastUpdated": latest_date,
        "latestMonthLabel": month_label(latest_month),
        "previousMonthLabel": month_label(previous_month),
        "recent15DayWindow": None,
        "dailySnapshot": daily_snapshot,
        "overview": {
            "totalRejectQty": round(total_rejected, 2),
            "totalProducedQty": round(total_produced, 2),
            "latestRejectRate": overall_rate,
            "productsAboveThreshold": all_time_items_above_threshold,
            "abnormalProduct": abnormal["productName"] if abnormal else "No data",
            "abnormalDelta": abnormal["delta"] if abnormal else 0,
        },
        "areaSummaries": [],
        "monthlyTrend": monthly_trend,
        "weeklyTrend": weekly_trend,
        "periodInsights": {
            "monthCount": len(monthly_trend),
            "weekCount": len(weekly_trend),
            "latestWeekLabel": all_weeks[-1] if all_weeks else "No data",
            "peakMonth": {
                "label": peak_month["label"],
                "monthKey": peak_month["monthKey"],
                "totalRate": peak_month["rejectRate"],
            } if peak_month else None,
            "peakWeek": {
                "label": peak_week["label"],
                "totalRate": peak_week["rejectRate"],
            } if peak_week else None,
            "averageMonthlyRate": average_monthly_rate,
        },
        "productAlerts": product_alerts[:20],
        "topProductsByLoss": top_by_loss[:10],
        "narrative": (
            f"Overall reject rate is {overall_rate}% in {month_label(latest_month)}. "
            + (
                f"Highest risk: {abnormal['productName']} at {abnormal['latestRate']}%."
                if abnormal
                else "No item above threshold."
            )
        ),
    }


def main():
    default_input = ROOT / "Rejection_Slip_Report.xlsx"
    input_path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else default_input
    if not input_path.exists():
        raise SystemExit(f"File not found: {input_path}")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(DB_PATH) as connection:
        ensure_rejection_records_schema(connection)

        workbook = load_workbook(input_path, read_only=True, data_only=True)
        sheet_info = find_sheet_and_headers(workbook)
        sheet = workbook[sheet_info["sheet_name"]]
        indices = sheet_info["indices"]

        existing_full_keys = {}
        existing_legacy_keys = defaultdict(list)
        for row in connection.execute(
            """
            SELECT id, report_date, item_code, machine_name,
                   produced_qty, rejected_qty, reject_pct
            FROM rejection_records
            """
        ).fetchall():
            record_id, report_date, item_code, machine_name, produced_qty, rejected_qty, reject_pct = row
            full_key = record_identity(
                report_date,
                item_code,
                machine_name,
                produced_qty,
                rejected_qty,
                reject_pct,
            )
            existing_full_keys[full_key] = {
                "id": record_id,
                "machine_name": normalize_text(machine_name),
            }
            existing_legacy_keys[
                legacy_record_identity(
                    report_date,
                    item_code,
                    produced_qty,
                    rejected_qty,
                    reject_pct,
                )
            ].append(
                {
                    "id": record_id,
                    "machine_name": normalize_text(machine_name),
                }
            )

        rows = []
        batch = []
        inserted_rows = 0
        backfilled_machine_names = 0
        skipped_duplicates = 0
        skipped_missing_required = 0

        for row_number, raw in enumerate(sheet.iter_rows(values_only=True), start=1):
            if row_number <= sheet_info["header_row"]:
                continue

            report_date = coerce_date(value_at(raw, indices, "report_date"))
            item_code = normalize_text(value_at(raw, indices, "item_code"))
            machine_name = normalize_text(value_at(raw, indices, "machine_name"))
            produced_qty = parse_number(value_at(raw, indices, "produced_qty"), 0.0)
            rejected_qty = parse_number(value_at(raw, indices, "rejected_qty"), 0.0)
            reject_pct_raw = value_at(raw, indices, "reject_pct", "")
            reject_pct = parse_number(
                reject_pct_raw,
                (rejected_qty / produced_qty * 100) if produced_qty else 0.0,
            )

            if not report_date or not item_code:
                skipped_missing_required += 1
                continue

            record = {
                "report_date": report_date,
                "item_code": item_code,
                "machine_name": machine_name,
                "produced_qty": float(produced_qty),
                "rejected_qty": float(rejected_qty),
                "reject_pct": float(reject_pct),
            }
            rows.append(record)

            dedupe_key = record_identity(
                record["report_date"],
                record["item_code"],
                record["machine_name"],
                record["produced_qty"],
                record["rejected_qty"],
                record["reject_pct"],
            )
            if dedupe_key in existing_full_keys:
                skipped_duplicates += 1
                continue

            legacy_key = legacy_record_identity(
                record["report_date"],
                record["item_code"],
                record["produced_qty"],
                record["rejected_qty"],
                record["reject_pct"],
            )
            legacy_matches = existing_legacy_keys.get(legacy_key, [])
            blank_match = next(
                (match for match in legacy_matches if not match["machine_name"]),
                None,
            )
            if blank_match:
                connection.execute(
                    "UPDATE rejection_records SET machine_name = ? WHERE id = ?",
                    (record["machine_name"], blank_match["id"]),
                )
                blank_match["machine_name"] = record["machine_name"]
                existing_full_keys[dedupe_key] = {
                    "id": blank_match["id"],
                    "machine_name": record["machine_name"],
                }
                backfilled_machine_names += 1
                skipped_duplicates += 1
                continue

            batch.append(
                (
                    record["report_date"],
                    record["item_code"],
                    record["machine_name"],
                    record["produced_qty"],
                    record["rejected_qty"],
                    record["reject_pct"],
                )
            )
            inserted_rows += 1
            existing_full_keys[dedupe_key] = {
                "id": None,
                "machine_name": record["machine_name"],
            }
            existing_legacy_keys[legacy_key].append(
                {
                    "id": None,
                    "machine_name": record["machine_name"],
                }
            )

        if batch:
            connection.executemany(
                """
                INSERT INTO rejection_records
                  (report_date, item_code, machine_name, produced_qty, rejected_qty, reject_pct)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                batch,
            )

        all_rows = [
            {
                "report_date": row[0],
                "item_code": row[1],
                "machine_name": row[2],
                "produced_qty": row[3],
                "rejected_qty": row[4],
                "reject_pct": row[5],
            }
            for row in connection.execute(
                """
                SELECT report_date, item_code, machine_name,
                       produced_qty, rejected_qty, reject_pct
                FROM rejection_records
                ORDER BY report_date ASC
                """
            ).fetchall()
        ]
        connection.execute(
            """
            INSERT INTO import_history (source_file, sheet_name, row_count, latest_month, matched_fields)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                input_path.name,
                sheet_info["sheet_name"],
                len(rows),
                compute_analytics(all_rows)["latestMonthLabel"],
                json.dumps(sorted(indices.keys()), ensure_ascii=False),
            ),
        )
        connection.commit()
        if CACHE_PATH.exists():
            CACHE_PATH.unlink()

        all_rows = [
            {
                "report_date": row[0],
                "item_code": row[1],
                "machine_name": row[2],
                "produced_qty": row[3],
                "rejected_qty": row[4],
                "reject_pct": row[5],
            }
            for row in connection.execute(
                """
                SELECT report_date, item_code, machine_name,
                       produced_qty, rejected_qty, reject_pct
                FROM rejection_records
                ORDER BY report_date ASC
                """
            ).fetchall()
        ]
        analytics = compute_analytics(all_rows)

    CACHE_PATH.write_text(json.dumps(analytics, ensure_ascii=False, indent=2), encoding="utf-8")
    IMPORT_SUMMARY_PATH.write_text(
        json.dumps(
            {
                "sourceFile": input_path.name,
                "sourcePath": str(input_path),
                "sheetName": sheet_info["sheet_name"],
                "headerRow": sheet_info["header_row"],
                "rowCount": len(rows),
                "importedAt": datetime.now().isoformat(timespec="seconds"),
                "matchedFields": sorted(indices.keys()),
                "missingFields": sorted([field for field in HEADER_ALIASES if field not in indices]),
                "latestMonthLabel": analytics["latestMonthLabel"],
                "insertedRows": inserted_rows,
                "backfilledMachineNames": backfilled_machine_names,
                "skippedDuplicates": skipped_duplicates,
                "skippedMissingRequired": skipped_missing_required,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print(f"Processed {len(rows)} rows from {input_path.name}")
    print(f"Inserted {inserted_rows} new rows into {DB_PATH}")
    print(f"Skipped {skipped_duplicates} duplicate rows")
    print(f"Skipped {skipped_missing_required} rows missing required fields")
    print(f"Analytics cache written to {CACHE_PATH}")
    print(f"Import summary written to {IMPORT_SUMMARY_PATH}")


if __name__ == "__main__":
    main()
