#!/usr/bin/env python3
"""Internal-only BPS Susenas 2026 sampling-error extractor.

Requires a legitimately accessed original BPS PDF and PyMuPDF:
  python -m pip install pymupdf
  python scripts/audit_bps_welfare_2026.py --pdf /path/to/statistik.pdf --private-out /outside/repo/private-bps-audit

NEVER commit raw generated data or mirror the original book without BPS reuse approval.
Every extracted record is a review candidate; text-layer integrity != visual validation.
"""
import argparse
import collections
import hashlib
import json
import pathlib
import re

PROVINCES = (
    "Aceh|Sumatera Utara|Sumatera Barat|Riau|Jambi|Sumatera Selatan|Bengkulu|Lampung|"
    "Kep. Bangka Belitung|Kep. Riau|DKI Jakarta|Jawa Barat|Jawa Tengah|DI Yogyakarta|"
    "Jawa Timur|Banten|Bali|Nusa Tenggara Barat|Nusa Tenggara Timur|Kalimantan Barat|"
    "Kalimantan Tengah|Kalimantan Selatan|Kalimantan Timur|Kalimantan Utara|"
    "Sulawesi Utara|Sulawesi Tengah|Sulawesi Selatan|Sulawesi Tenggara|Gorontalo|"
    "Sulawesi Barat|Maluku|Maluku Utara|Papua Barat|Papua Barat Daya|Papua|"
    "Papua Selatan|Papua Tengah|Papua Pegunungan|Indonesia"
).split("|")
PROVINCE_SET = set(PROVINCES)
NUM = re.compile(r"^[+-]?(?:\d+(?:[.,]\d+)?|\d{1,3}(?:\.\d{3})+,\d+)[¹²³⁴]?$")
TABLE = re.compile(r"(?m)^9\.\d{1,3}\s*$")
MISSING = ("NA", "–", "—", "-")
APPROX = ("~0", "≈0")
COLUMNS = ("estimate_pct", "standard_error_pp", "relative_standard_error_pct", "ci95_low_pct", "ci95_high_pct")


def valid_token(s):
    return s in MISSING or s in APPROX or bool(NUM.fullmatch(s))


def token_value(s):
    if s in MISSING:
        return None
    if s in APPROX:
        return "~0"
    s = s.rstrip("¹²³⁴")
    return float(s.replace(".", "").replace(",", ".")) if "," in s else float(s)


def scan(page_text):
    lines = [x.strip() for x in page_text.splitlines() if x.strip()]
    names = [(i, s) for i, s in enumerate(lines) if s in PROVINCE_SET]
    if not names:
        return None
    if [s for _, s in names] != PROVINCES:
        raise ValueError("Expected exactly 38 provinces plus national, in BPS sequence")
    results = []
    for idx, (pos, name) in enumerate(names):
        end = names[idx+1][0] if idx+1 < len(names) else len(lines)
        cells = []
        for tok in lines[pos+1:end]:
            if not valid_token(tok):
                break
            cells.append(tok)
        if not cells or len(cells) % 5:
            raise ValueError("Incomplete five-field source tuple: " + name)
        results.append((name, cells))
    widths = set(len(x) for _, x in results)
    if len(widths) != 1:
        raise ValueError("Nonuniform category counts in a single panel")
    return results


def classify(rse):
    if not isinstance(rse, (int, float)):
        return "not_reported"
    return "unreliable" if rse > 50 else "caution" if rse > 25 else "standard"


def extract(pdf_path, private_out):
    import fitz
    repo_root = pathlib.Path(__file__).resolve().parents[1]
    target = private_out.resolve()
    if target == repo_root or repo_root in target.parents:
        raise ValueError("Private numeric evidence MUST NOT be written inside the public repository")
    target.mkdir(parents=True, exist_ok=True)
    pdf = fitz.open(pdf_path)
    start = {}
    for pi in range(269, len(pdf)):
        for number in TABLE.findall(pdf[pi].get_text()):
            start[number.strip()] = pi
    ids = [f"9.{k}" for k in range(1, 134)]
    if set(ids) != set(start):
        raise ValueError("133 distinct BPS appendix tables not found; wrong PDF or incomplete document")
    records, panels, problems = [], [], []
    for i, ident in enumerate(ids):
        begin = start[ident]
        end = start[ids[i+1]] if i+1 < len(ids) else len(pdf)
        for pi in range(begin, end):
            try:
                rows = scan(pdf[pi].get_text())
            except ValueError as error:
                problems.append({"table": ident, "pdf_page": pi+1, "error": str(error)})
                continue
            if rows is None:
                continue
            cats = len(rows[0][1]) // 5
            panels.append({"table": ident, "pdf_page": pi+1, "categories": cats, "geographies": len(rows)})
            for province, full in rows:
                for cat in range(cats):
                    raw = full[5*cat:5*(cat+1)]
                    vals = dict(zip(COLUMNS, map(token_value, raw)))
                    rse = vals["relative_standard_error_pct"]
                    rec = {"table": ident, "pdf_page": pi+1, "panel_category_zero_index": cat,
                           "province": province, "source_tokens": raw, **vals,
                           "precision": classify(rse),
                           "footnotes": [t for t in raw if t.endswith(("¹", "²", "³", "⁴"))],
                           "status": "INTERNAL_SOURCE_TEXT_CANDIDATE_NOT_VISUALLY_VALIDATED"}
                    records.append(rec)
    digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    group_count = sum(x["categories"] for x in panels)
    assert len(records) == group_count * 39
    summary = {
        "schema": "sli-bps-2026-appendix-audit-summary-v1",
        "pdf_sha256": digest, "source_tables": len(ids),
        "panels_parsed": len(panels), "distinct_category_groups": group_count,
        "rse_candidate_estimates": len(records), "five_fields_per_candidate": 5,
        "provinces_plus_national": 39, "parser_errors": problems,
        "rse_classes": dict(collections.Counter(row["precision"] for row in records)),
        "limitations": "All values are machine-transcribed text candidates. Manual pixel-by-pixel audit, correct category naming, independent statistical checks, district scope, and BPS commercial reuse permission are NOT completed.",
        "source_rights": "BPS. Written permission required for commercial bulk reproduction.",
    }
    (target/"rse_133_tables_private_review_only.json").write_text(
        json.dumps({"summary": summary, "records": records}, ensure_ascii=False), encoding="utf-8")
    (target/"rse_133_tables_audit_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", required=True, type=pathlib.Path)
    parser.add_argument("--private-out", required=True, type=pathlib.Path)
    args = parser.parse_args()
    print(json.dumps(extract(args.pdf, args.private_out), indent=2))


if __name__ == "__main__":
    main()
