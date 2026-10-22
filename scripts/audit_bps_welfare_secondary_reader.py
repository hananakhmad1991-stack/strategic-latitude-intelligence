#!/usr/bin/env python3
"""Source-extraction comparison only; NOT a visual audit or a license to republish BPS cells.
Run privately with a legitimately obtained BPS PDF and its PRIVATE candidate JSON.
No source rows are written inside the public repository.
"""
from __future__ import annotations
import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
EXPECTED_PDF_SHA = "1338749eec4926885a3052ea2933cfeaca1b1328386bca26f80d5a1279a44305"
NUM = re.compile(r"^(?:[+\-]?\d+[.,]?\d*[¹²³⁴]?|~0|≈0|[–—-]|NA)$")
NUMERIC = re.compile(r"^[-+]?\d")
FOOTNOTE_MARKERS = str.maketrans("", "", "¹²³⁴")

def canon(token: str) -> str:
    return token.strip().translate(FOOTNOTE_MARKERS).replace("−", "-")

def as_numeric(tokens):
    return [value for value in tokens if NUMERIC.match(value) or value in ("~0", "≈0")]

def subsequence(full, partial) -> bool:
    iterator = iter(full)
    return all(any(token == match for match in iterator) for token in partial)

def classify(original, secondary):
    """These categories identify parser disagreement only, never correctness of source values."""
    original, secondary = list(map(canon, original)), list(map(canon, secondary))
    if original == secondary:
        return "exact_full_row", 0
    a, b = as_numeric(original), as_numeric(secondary)
    if a == b:
        return "numeric_agree_non_numeric_difference", 0
    if subsequence(a, b):
        return "secondary_omits_numeric_tokens", len(a)-len(b)
    if subsequence(b, a):
        return "secondary_extra_numeric_tokens", len(b)-len(a)
    return "non_subsequence_numeric_conflict", 0

def run(pdf_path: Path, candidates_path: Path, private_out: Path, all_panels: bool=False):
    import pdfplumber
    base = private_out.resolve()
    if ROOT == base or ROOT in base.parents:
        raise ValueError("Refusing to write raw PDF review evidence to the public SLI repository")
    if hashlib.sha256(pdf_path.read_bytes()).hexdigest() != EXPECTED_PDF_SHA:
        raise ValueError("Wrong PDF: BPS source SHA-256 is not the audited edition")
    blob = json.loads(candidates_path.read_text(encoding="utf-8"))
    records = blob["rows"]
    all_pages = sorted(set(record["pdf_page"] for record in records))
    if len(all_pages) != 253:
        raise ValueError("Expected 253 five-field appendix panels")
    selected = all_pages if all_panels else sorted(set(all_pages[::11] + [316,434,435,436,451,456,462,479,513,523]))
    first = all_pages[0]
    regions = list(dict.fromkeys(row["province"] for row in records if row["pdf_page"] == first))
    if len(regions) != 39 or regions[-1] != "Indonesia":
        raise ValueError("Geographic order is incomplete or unrecognized")
    order = sorted(regions, key=len, reverse=True)
    desired = defaultdict(list)
    for row in records:
        if row["pdf_page"] in selected:
            desired[(row["pdf_page"],row["province"])].append(row)
    for group in desired.values():
        group.sort(key=lambda x:x["panel_category_index"])
    counts = Counter()
    queue = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in selected:
            rows = {}
            for line in (pdf.pages[page-1].extract_text() or "").splitlines():
                for province in order:
                    if line.startswith(province+" "):
                        rows[province] = [token for token in line[len(province)+1:].split() if NUM.fullmatch(token)]
                        break
            if len(rows) != 39:
                raise ValueError(f"Secondary engine recognized {len(rows)} provinces on page {page}")
            for province in regions:
                original = [token for row in desired[(page,province)] for token in row["source_raw_tokens"]]
                reason, omitted_count = classify(original, rows[province])
                counts[reason] += 1
                counts["secondary_omitted_numeric_token_count"] += omitted_count
                if reason == "non_subsequence_numeric_conflict":
                    queue.append({"pdf_page":page,"province":province,"reason":reason,"source_tokens":original,"secondary_tokens":rows[province]})
    summary = {"status":"extraction_conflict_triage_not_visual_review", "source_sha256":EXPECTED_PDF_SHA,
      "sampled_panels":len(selected),"total_panels":253,"comparison_scope":"all_253_panels" if all_panels else "31_panel_sample","regions_per_panel":39,
      "rows_compared":len(selected)*39,"categories":dict(counts),
      "unresolved_non_subsequence_count":len(queue),
      "interpretation":"A missing token in secondary PDF text extraction is not evidence the printed BPS source is wrong. Printed values still require independent page-image verification."}
    base.mkdir(parents=True,exist_ok=True)
    (base/"bps_welfare_cross_engine_triage_private.json").write_text(json.dumps({"summary":summary,"needs_visual_adjudication":queue},ensure_ascii=False,indent=2),encoding="utf-8")
    return summary

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--pdf",type=Path,required=True)
    parser.add_argument("--private-candidates",type=Path,required=True)
    parser.add_argument("--out",type=Path,required=True)
    parser.add_argument("--all-panels",action="store_true",help="Compare all 253 appendix PDF panels (longer; private output only)")
    args=parser.parse_args()
    print(json.dumps(run(args.pdf,args.private_candidates,args.out,all_panels=args.all_panels),ensure_ascii=False,indent=2))

if __name__ == "__main__":
    main()
