#!/usr/bin/env python3
"""Review-only scan of ALL 34 original RUPTL geographic annex project tables.

Rows are page- and grid-position-attributed machine extracts, NOT editor-approved
project objects. Never infer geographic coordinates, financial close, COD, or
current realized capacity from this machine-candidate dataset.
"""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import fitz

NEXT_TABLE=re.compile(r"(?m)^Tabel\s+([ABC]\d+\.\d+)\b", re.I)
NUM_ROW=re.compile(r"^\s*\d{1,4}\s*$")

def clean(cell):
    if cell is None: return None
    return " ".join(str(cell).split())[:300] or None

def first_numeric(row):
    return bool(row and row[0] is not None and NUM_ROW.fullmatch(str(row[0])))

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--pdf", type=Path, required=True)
    ap.add_argument("--source-index",type=Path,default=Path("data/sli-ruptl-provincial-source-projects-2025.json"))
    ap.add_argument("--output",type=Path,default=Path("artifacts/sli-ruptl-all-34-project-table-grids-review-only.json"))
    ap.add_argument("--max-pages-per-table",type=int,default=20)
    args=ap.parse_args()
    data=json.loads(args.source_index.read_text(encoding="utf-8"))
    official_digest=data["source"]["sha256"]
    actual=hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    if actual!=official_digest: raise ValueError("RUPTL original PDF SHA256 mismatch: review is prohibited")
    sections=data["geographic_appendix_coverage"]["subsections"]
    if len(sections)!=34 or len({x["annex_id"] for x in sections})!=34:
        raise ValueError("Index must cover exactly 34 unique original geographic annexes")
    result=[]
    with fitz.open(args.pdf) as document:
        if len(document)!=1253:raise ValueError("Unexpected official RUPTL page count")
        for i,part in enumerate(sections):
            start=part["project_table_pdf_page"]
            table=part["project_table_number"]
            prefix=table.split(".")[0]
            limit=min(len(document),start+args.max_pages_per_table-1,
                sections[i+1]["pdf_page"]-1 if i+1<len(sections) else len(document))
            rows=[]
            page_reviews=[]
            completion="not_determined"
            for pn in range(start,limit+1):
                page=document[pn-1]
                page_text=page.get_text("text")
                if pn>start:
                    next_ids=[x.group(1) for x in NEXT_TABLE.finditer(page_text) if x.group(1)!=table]
                    # Do not mix transmission, substations or a following appendix.
                    if next_ids:
                        completion="stopped_before_other_original_table_heading"
                        break
                try:
                    tab=page.find_tables()
                    grids=[x.extract() for x in tab.tables]
                except Exception as exc:
                    page_reviews.append({"pdf_page":pn,"parse_error":type(exc).__name__,"candidate_rows":0})
                    completion="page_parse_error_blocks_completeness"
                    break
                found=0
                for grid_index,grid in enumerate(grids):
                    if not grid:continue
                    headers=[clean(x) for x in grid[0]]
                    joined=" ".join(x or "" for x in headers).lower()
                    # Only accept numbered project-style tables, not annual MW summaries.
                    project_header=("no" in joined[:18] and
                                    any(k in joined for k in ("kapasitas","kap","proyek","pembangkit")))
                    numbered=sum(first_numeric(row) for row in grid)
                    if not project_header and numbered<3:continue
                    for row_no,raw in enumerate(grid):
                        if not first_numeric(raw):continue
                        cells=[clean(x) for x in raw]
                        rows.append({"pdf_page":pn,"grid_index":grid_index,
                          "row_index_in_grid":row_no,"source_row_no":cells[0],
                          "original_grid_cells":cells,
                          "review_status":"machine_extracted_original_cells_not_project_validated"})
                        found+=1
                page_reviews.append({"pdf_page":pn,"candidate_rows":found,"table_grids":len(grids)})
                if pn==limit:completion="reached_annex_or_safety_limit_or_end"
            result.append({"annex_id":part["annex_id"],
                "geographic_heading":part["geographic_heading"],
                "table":table,"project_table_first_pdf_page":start,
                "original_annex_first_pdf_page":part["pdf_page"],
                "pages_scanned":page_reviews,"candidate_numbered_rows":len(rows),
                "scan_boundary_reason":completion,"raw_candidates":rows})
    output={
      "schema":"sli-ruptl-full-34-annex-numbered-grid-candidates-v1",
      "created_at":datetime.now(timezone.utc).isoformat(),
      "source_sha256":official_digest,"source_pages":1253,
      "source_url":data["source"]["official_url"],
      "total_subsections":len(result),
      "total_numbered_grid_candidates":sum(x["candidate_numbered_rows"] for x in result),
      "approved_new_project_records":0,
      "scope":"Every indexed appendix project table is examined at its primary source page and following pages up to the next table heading or safety boundary.",
      "critical_caveat":"Raw table grids vary: multi-column merged headers, repeat row numbers, capacity multipliers and continuation rows require original visual comparison. Candidate rows are NOT unique approved projects and must NOT be summed as MW, COD, or investment.",
      "sections":result
    }
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("RUPTL_ALL34_GRID_AUDIT_OK sections="+str(len(result))+
          " numbered_row_candidates="+str(output["total_numbered_grid_candidates"])+
          " new_approved_projects=0")
    for x in result:
        print("RUPTL_GRID_SECTION",x["annex_id"],x["table"],x["project_table_first_pdf_page"],
              "candidate_rows="+str(x["candidate_numbered_rows"]),
              "scan_boundary="+x["scan_boundary_reason"])
if __name__=="__main__": main()
