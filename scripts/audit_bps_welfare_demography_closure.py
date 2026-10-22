#!/usr/bin/env python3
"""BPS Susenas 2026 Chapter II categorical-closure audit (INTERNAL raw input only).
All numeric cells originate in the local legally obtained source PDF's private review
package. A percent closure proves only arithmetic consistency, NOT per-cell print QA.
NA must never be turned into zero or inferred by subtraction.
Usage:
  python scripts/audit_bps_welfare_demography_closure.py \
    --pdf /private/original.pdf --raw-review /private/welfare_2026_165_tables_raw_review.json \
    --expected data/sli-bps-welfare-2026-demography-closure-qa.json
Only JSON audit summary is printed. No source numerical cells are written to the repo.
"""
import argparse
from collections import defaultdict
from hashlib import sha256
import json
from pathlib import Path

WIDTHS = {"2.1":3, **{f"2.{i}":5 for i in range(2,8)},
          **{f"2.{i}":3 for i in range(8,11)},
          **{f"2.{i}":4 for i in range(11,17)},
          **{f"2.{i}":4 for i in range(18,21)}}
REPO = Path(__file__).resolve().parents[1]
TOLERANCE = 0.06

def audit(rows):
    by = defaultdict(list)
    for row in rows:
        if row["table_id"] in WIDTHS:
            by[row["table_id"]].append(row)
    if set(by) != set(WIDTHS):
        raise ValueError("Expected all 19 named Chapter II percent-total tables")
    output = {}
    for tab, width in WIDTHS.items():
        source_rows = by[tab]
        if len(source_rows) != 39 or len({r["province"] for r in source_rows}) != 39:
            raise ValueError(f"{tab}: 39 unique regions expected")
        count={"groups":0,"complete_groups":0,"incomplete_categories":0,"missing_total":0,
               "closure_outliers":0,"rounded_total_outliers":0}
        for item in source_rows:
            values = item["raw_columns"]
            if len(values) % width:
                raise ValueError(f"{tab} {item['province']}: nonintegral group width")
            for begin in range(0,len(values),width):
                parts=values[begin:begin+width]
                count["groups"] += 1
                total = parts[-1]
                if total is None:
                    count["missing_total"] += 1
                    continue
                if not isinstance(total,(int,float)) or abs(total-100)>TOLERANCE+1e-9:
                    count["rounded_total_outliers"] += 1
                if any(x is None for x in parts[:-1]):
                    count["incomplete_categories"] += 1
                    continue
                if any(not isinstance(x,(int,float)) for x in parts[:-1]):
                    raise ValueError("Non-numeric token must be represented as None")
                count["complete_groups"] += 1
                if abs(sum(parts[:-1])-total)>TOLERANCE+1e-9:
                    count["closure_outliers"] += 1
        output[tab]=count
    return output

def compare(results, expected):
    public = {r["id"]:r for r in expected["tables"]}
    if set(results) != set(public):
        raise ValueError("Public summary's audited tables differ from source")
    for tab,counts in results.items():
        for field,value in counts.items():
            if public[tab][field] != value:
                raise ValueError(f"{tab}.{field}: expected {public[tab][field]} got {value}")
    for field,entry in [
        ("groups_tested","groups"),("complete_numeric_groups","complete_groups"),
        ("incomplete_category_groups","incomplete_categories"),
        ("missing_total_groups","missing_total"),
        ("complete_group_closure_outliers","closure_outliers"),
        ("rounded_total_outliers","rounded_total_outliers")]:
        value=sum(x[entry] for x in results.values())
        if expected["audit"][field]!=value:
            raise ValueError(f"{field} aggregate not reproducible")
    if expected["audit"]["complete_group_closure_outliers"] or expected["audit"]["rounded_total_outliers"]:
        raise ValueError("Unexpected closure deviation or total != 100 in BPS source-text candidates")
    return True

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--pdf",required=True,type=Path)
    p.add_argument("--raw-review",required=True,type=Path)
    p.add_argument("--expected",required=True,type=Path)
    args=p.parse_args()
    if not args.pdf.is_file() or not args.raw_review.is_file():
        raise SystemExit("Source PDF and private raw review file are required")
    expected=json.loads(args.expected.read_text(encoding="utf-8"))
    if sha256(args.pdf.read_bytes()).hexdigest()!=expected["source"]["pdf_sha256"]:
        raise SystemExit("Wrong original PDF or checksum mismatch")
    data=json.loads(args.raw_review.read_text(encoding="utf-8"))
    results=audit(data["rows"])
    compare(results,expected)
    print(json.dumps({"status":"automated_closure_pass_not_full_visual_qa",
                      "tables":len(results),"groups":sum(x["groups"] for x in results.values()),
                      "complete_groups":sum(x["complete_groups"] for x in results.values()),
                      "incomplete_groups":sum(x["incomplete_categories"]+x["missing_total"] for x in results.values()),
                      "missing_is_not_zero":True},ensure_ascii=False))

if __name__=="__main__":
    main()
