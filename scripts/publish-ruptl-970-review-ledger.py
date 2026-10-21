#!/usr/bin/env python3
"""Convert the checksum-pinned 970-row original-PDF grid ARTIFACT to a browser REVIEW catalogue.

NO raw table cell is promoted to a unique project, verified owner, MW, COD, or
2026 operating status. This is a transcription ledger, not an asset registry.
"""
import argparse
import hashlib
import json
from pathlib import Path

EXPECTED_SHA="1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002"
DEFAULT_INPUT=Path("/tmp/sli/ruptl-scan/sli-ruptl-all-34-project-table-grids-review-only.json")
DEFAULT_OUTPUT=Path("data/sli-ruptl-970-raw-grid-candidates-review.json")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--input",type=Path,default=DEFAULT_INPUT)
    parser.add_argument("--coverage",type=Path,default=Path("data/sli-ruptl-provincial-source-projects-2025.json"))
    parser.add_argument("--output",type=Path,default=DEFAULT_OUTPUT)
    a=parser.parse_args()
    source=json.loads(a.input.read_text(encoding="utf-8"))
    coverage=json.loads(a.coverage.read_text(encoding="utf-8"))
    annexes=coverage["geographic_appendix_coverage"]["subsections"]
    digest=source["source_sha256"]
    if source["schema"]!="sli-ruptl-full-34-annex-numbered-grid-candidates-v1":raise ValueError("Raw scan schema changed")
    if digest!=EXPECTED_SHA or coverage["source"]["sha256"]!=EXPECTED_SHA:raise ValueError("Official full PDF digest mismatch")
    if source["source_pages"]!=1253 or source["total_subsections"]!=34 or source["total_numbered_grid_candidates"]!=970:raise ValueError("Scan coverage changed; manual reapproval required")
    if source["approved_new_project_records"]!=0:raise ValueError("Machine scan cannot publish project approvals")
    if len(source["sections"])!=34 or len(annexes)!=34:raise ValueError("Geographic annex coverage mismatch")
    source_by_id={s["annex_id"]:s for s in source["sections"]}
    if len(source_by_id)!=34:raise ValueError("Duplicate geographic annex")
    normalized=[]
    ids=set()
    for meta in annexes:
        section=source_by_id.get(meta["annex_id"])
        if section is None:raise ValueError("Missing annex "+meta["annex_id"])
        if section["table"]!=meta["project_table_number"] or section["project_table_first_pdf_page"]!=meta["project_table_pdf_page"]:raise ValueError("Original project table mapping mismatch")
        if section["candidate_numbered_rows"]!=meta["machine_candidate_numbered_grid_rows"] or section["candidate_numbered_rows"]!=len(section["raw_candidates"]):raise ValueError("Candidate count per appendix mismatch")
        if section["scan_boundary_reason"]=="page_parse_error_blocks_completeness":raise ValueError("Unresolved PDF page parse error")
        rows=[]
        for x in section["raw_candidates"]:
            if x["review_status"]!="machine_extracted_original_cells_not_project_validated":raise ValueError("Unknown source approval class")
            if not (600<=x["pdf_page"]<=1253) or x["source_row_no"] is None or not isinstance(x["original_grid_cells"],list):raise ValueError("Raw original-page reference incomplete")
            if len(x["original_grid_cells"])<2:raise ValueError("Original source grid unexpectedly short")
            source_key=f'{section["annex_id"]}:{section["table"]}:{x["pdf_page"]}:{x["grid_index"]}:{x["row_index_in_grid"]}'
            if source_key in ids:raise ValueError("Duplicate source cell key "+source_key)
            ids.add(source_key)
            rows.append({"source_key":source_key,"page":x["pdf_page"],"table":section["table"],"original_row_no":x["source_row_no"],"raw_cells":x["original_grid_cells"]})
        normalized.append({"annex_id":section["annex_id"],"geographic_heading":section["geographic_heading"],
            "table":section["table"],"pdf_page":section["project_table_first_pdf_page"],
            "raw_candidate_count":len(rows),"scan_boundary_reason":section["scan_boundary_reason"],"rows":rows})
    if len(ids)!=970:raise ValueError("Unique row census not exactly 970")
    output={
      "schema":"sli-ruptl-all34-original-grid-raw-review-catalog-v1",
      "source":"PT PLN (Persero) RUPTL 2025–2034 original PDF 1,253 pages",
      "source_pdf_sha256":EXPECTED_SHA,
      "source_url":source["source_url"],
      "extraction_artifact":"https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence/actions/runs/39554648991/artifacts/12325505947",
      "review_status":"machine_extracted_source_cells_not_editor_verified_or_distinct_assets",
      "approved_as_distinct_project_records":0,
      "actual_project_cod_confirmed_from_this_dataset":0,
      "total_annexes":34,"total_raw_grid_candidates":970,
      "methodology":"Page, original numbered grid-row position and cells copied exactly from a checksum-verified PDF scan. Column splits/merges, duplicate plant names, quotas, source group geography and MW/MWh remain unresolved. Browse for editorial review, NOT for MW, investment, operating, or unit COD totals.",
      "sections":normalized}
    a.output.parent.mkdir(parents=True,exist_ok=True)
    a.output.write_text(json.dumps(output,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("RUPTL_RAW_GRID_REVIEW_OK",len(ids),"grid rows in",len(normalized),"annexes; approved projects=0")

if __name__=="__main__":main()
