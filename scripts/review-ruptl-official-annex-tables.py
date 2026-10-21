#!/usr/bin/env python3
"""Read-only exact-PDF-page RUPTL annex table evidence candidates.
A table row is NOT an approved project or operating asset.
"""
import argparse,hashlib,json,re
from datetime import datetime,timezone
from pathlib import Path
import fitz

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--pdf",type=Path,required=True)
 p.add_argument("--annex-index",type=Path,default=Path("data/sli-ruptl-full-official-annex-index.json"))
 p.add_argument("--output",type=Path,default=Path("artifacts/sli-ruptl-annex-table-candidates-review.json"))
 p.add_argument("--max-pages",type=int,default=12)
 a=p.parse_args()
 index=json.loads(a.annex_index.read_text())
 with fitz.open(a.pdf) as doc:
  if len(doc)!=index["source_pdf_total_pages"]:raise ValueError("RUPTL pages differ from verified full copy")
  if hashlib.sha256(a.pdf.read_bytes()).hexdigest()!=index["source_sha256"]:raise ValueError("RUPTL SHA-256 mismatch: do not extract")
  ranges=[]
  heads=index["headings"]
  for i,h in enumerate(heads):
   if not re.fullmatch(r"LAMPIRAN [A-E]\.\d+",h["heading"]):continue
   start=h["pdf_page"];following=heads[i+1]["pdf_page"] if i+1<len(heads) else len(doc)+1
   end=min(start+a.max_pages-1,following-1)
   ranges.append({"heading":h["heading"],"start_pdf_page":start,"end_pdf_page":end})
  records=[]
  for area in ranges:
   pages=[]
   for page_no in range(area["start_pdf_page"],area["end_pdf_page"]+1):
    page=doc[page_no-1]
    table_finder=page.find_tables()
    page_rows=[]
    for table_num,table in enumerate(table_finder.tables):
     grid=table.extract()
     if not grid:continue
     normalized=[[((v or "").strip())[:150] for v in row] for row in grid[:65]]
     page_rows.append({"table_index":table_num,"column_count":len(normalized[0]),"source_rows":len(grid),
      "preview_header":normalized[:2],"example_rows":normalized[2:7],
      "review_status":"machine_extracted_not_verified_project_record"})
    if page_rows:pages.append({"pdf_page":page_no,"tables":page_rows})
   records.append({**area,"tables_found":sum(len(x["tables"]) for x in pages),"candidate_pages":pages})
 output={"schema":"sli-ruptl-annex-tabular-candidate-review-v1","reviewed_at":datetime.now(timezone.utc).isoformat(),
 "official_source_url":index["source_url"],"source_sha256":index["source_sha256"],
 "source_total_pdf_pages":len(doc),"method":"PyMuPDF find_tables; 12-page sample per exact indexed subsection, no OCR or numerical imputation",
 "status":"extraction_candidates_require_original_page_and_column_editor_review",
 "approved_individual_project_count":0,
 "non_promotable_notice":"Tables, headers, rows, years, capacity units and jurisdictions are machine extraction candidates. Do not publish as operating projects, investments, PPA, COD or validated MW before human page check.",
 "sections":records}
 a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n")
 print("RUPTL_ANNEX_REVIEW sections="+str(len(records))+" tables="+str(sum(x["tables_found"] for x in records))+" approved_projects=0")
if __name__=="__main__":main()
