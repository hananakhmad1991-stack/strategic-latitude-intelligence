#!/usr/bin/env python3
"""Official complete PLN 2025–2034 RUPTL full-PDF page index, review-only.
It extracts page-level project and appendix leads, never asserts implementation status
and NEVER republishes the original 52 MB document into the site repository.
"""
import base64
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import urllib.request

URL="https://www.pln.co.id/webapi/media/file/webkorp/asset/b967d-ruptl-pln-2025-2034-pub-.pdf"
MAX_SIZE=90000000
DOCUMENT=Path("/tmp/sli-ruptl-pln-official.pdf")
def download():
 request=urllib.request.Request(URL,headers={"User-Agent":"SLI-public-archive-science-review/1.0"})
 with urllib.request.urlopen(request,timeout=120) as resp:
  if resp.geturl().split("/")[2].lower() not in ("www.pln.co.id","web.pln.co.id","pln.co.id"):
   raise ValueError("RUPTL PDF redirected to unknown domain")
  length=0
  with DOCUMENT.open("wb") as fd:
   while True:
    chunk=resp.read(1024*1024)
    if not chunk:break
    length+=len(chunk)
    if length>MAX_SIZE:raise ValueError("RUPTL official PDF exceeds safe size cap")
    fd.write(chunk)
 if DOCUMENT.stat().st_size<100000 or DOCUMENT.open("rb").read(5)!=b"%PDF-":raise ValueError("Not an official readable PDF")
 return DOCUMENT.stat().st_size

size=download()
with DOCUMENT.open("rb") as handle:
 handle.seek(max(0,size-8192))
 trailer=handle.read()
print("RUPTL_PDF_TRANSFER bytes="+str(size)+" eof_found="+str(b"%%EOF" in trailer))
probe=subprocess.run(["pdfinfo",str(DOCUMENT)],capture_output=True,text=True,timeout=80)
if probe.returncode:
 print("RUPTL_PDFINFO_ERROR "+re.sub(r"\\s+"," ",probe.stderr)[-850:])
 try:
  import fitz
  recovered=fitz.open(str(DOCUMENT))
  pages=len(recovered)
  print("RUPTL_PYMUPDF_RECOVERY pages="+str(pages))
  recovered.close()
 except Exception as exc:
  raise ValueError("Official PLN PDF cannot yet be read safely: "+str(exc)[:220]) from exc
else:
 pages=int(re.search(r"^Pages:\s+(\\d+)\\b",probe.stdout,re.M).group(1))
if pages<=100 or pages>5000:raise ValueError("Complete PDF page count unexpectedly "+str(pages))
print("RUPTL_FULL_PDF_OK bytes="+str(size)+" pages="+str(pages)+" origin=PLN")
# The uploaded source ended at page 100; scan only pages missing from that original.
probe_text=subprocess.run(["pdftotext","-layout","-enc","UTF-8","-f","101","-l",str(pages),str(DOCUMENT),"-"],capture_output=True,text=True,timeout=210)
if probe_text.returncode:
 print("RUPTL_PDFTOTEXT_ERROR "+re.sub(r"\\s+"," ",probe_text.stderr)[-800:])
 try:
  import fitz
  recovered=fitz.open(str(DOCUMENT))
  text="\\f".join(recovered[n].get_text("text") for n in range(100,len(recovered)))
  recovered.close()
  print("RUPTL_PYMUPDF_TEXT_RECOVERED")
 except Exception as exc:
  raise ValueError("Official PLN PDF text extraction needs manual source recovery: "+str(exc)[:200]) from exc
else:
 text=probe_text.stdout
page_chunks=text.split("\f")
rows=[];identified_sections=[];candidate_count=0
pat=re.compile(r"(?i)\b(PLTA|PLTS|PLTB|PLTP|PLTM|PLTMH|PLTG|PLTGU|PLTU|BESS|baterai|proyek pembangkit|rencana proyek|daftar proyek|rencana pengembangan sistem|tabel\s+[VXI]{1,5}[-. ]\d+)\b")
chapter=re.compile(r"(?i)^(?:\s*(BAB\s+(?:III|IV|V|VI|VII|VIII|IX)|LAMPIRAN|DAFTAR PROYEK|TABEL\s+(?:III|IV|V|VI)[-. ]\d+)\b)")
for offset,block in enumerate(page_chunks[:pages-100]):
 n=offset+101
 lines=[re.sub(r"\s+"," ",x.strip()) for x in block.splitlines() if x.strip()]
 sample=[(i,v) for i,v in enumerate(lines) if pat.search(v)]
 candidate_count+=len(sample)
 heading=[v[:145] for v in lines[:20] if chapter.search(v)]
 if heading:
  identified_sections.append({"pdf_page":n,"heading":heading[:3]})
 if not sample:continue
 if len(rows)>=260:continue
 preview=[{"line_index":i+1,"excerpt":line[:145],"status":"keyword_only_unverified"} for i,line in sample[:5]]
 rows.append({"pdf_page":n,"keyword_hits":len(sample),"page_heading_candidates":heading[:2],"sample":preview})
output={
 "schema":"sli-ruptl-full-official-pdf-page-index-v1",
 "source":"PT PLN (Persero) official full RUPTL 2025–2034 PDF",
 "source_url":URL, "checked_at":datetime.now(timezone.utc).isoformat(),
 "source_size_bytes":size,"source_pdf_total_pages":pages,"original_user_upload_pages":100,
 "scanned_missing_page_range":[101,pages],"scan_keyword_hits":candidate_count,
 "indexed_candidate_pages":len(rows),
 "status":"full_official_pdf_accessed_page_leads_only_not_approved_project_registry",
 "section_heading_leads":identified_sections[:200],"candidate_pages":rows,
 "qualification":"Keyword matches/section headings are extraction leads, NOT verified project IDs, project locations, installed power, funding, PPA signoff, construction, commissioning, or commercial operation. Reviewer must inspect the exact page and distinguish national targets from regional tables.",
 "review_requirements":["Compare PDF exact page to table titles","Check province and jurisdiction in full appendix","Record ownership/project name and capacity with explicit units","Distinguish planned MW, PPA, COD, construction and actual commissioned assets","Do not import ambiguous repeated lines from TOC as projects"] }
Path("artifacts").mkdir(exist_ok=True)
Path("artifacts/sli-ruptl-full-project-page-candidates.json").write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("RUPTL_FULL_SOURCE_INDEX_OK candidate_pages="+str(len(rows))+" keyword_hits="+str(candidate_count)+" sections="+str(len(identified_sections)))
compact={key:output[key] for key in ["schema","source_url","checked_at","source_size_bytes","source_pdf_total_pages","original_user_upload_pages","scanned_missing_page_range","scan_keyword_hits","indexed_candidate_pages","status","qualification"]}
compact["section_heading_leads"]=identified_sections[:55]
compact["page_leads"]= [{"page":x["pdf_page"],"hits":x["keyword_hits"],"headings":x["page_heading_candidates"]} for x in rows[:90]]
print("RUPTL_PAGE_INDEX_BASE64="+base64.b64encode(json.dumps(compact,ensure_ascii=False,separators=(",",":")).encode()).decode())
