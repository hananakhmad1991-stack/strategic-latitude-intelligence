#!/usr/bin/env python3
"""Checksum-gated 1,253-page RUPTL 2025-2034 table catalogue and network-grid extracts.

Classifies source-table headings across ALL pages. For grid/transmission,
substation and distribution candidates, saves original table-grid CELL strings
and page references as review candidates. No numeric construction status,
voltage/MVA or commissioning is promoted without manual column verification.
"""
import argparse,hashlib,json,re
from pathlib import Path
from collections import Counter
from datetime import datetime,timezone
import pymupdf
SHA="1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002"
TABLE=re.compile(r"\bTabel\s+([A-E]?\d+(?:\.\d+){1,2})\s*[:.\-]?\s*([^\n]{0,150})",re.I)
CLASSIFIERS=[
 ("transmission",re.compile(r"transmisi|sutet|sutt|saluran\s+udara|sirkit|interkoneksi|penyaluran|jaringan\s+tegangan",re.I)),
 ("substations",re.compile(r"gardu\s+induk|(?:^|\W)gis(?:\W|$)|trafo\s+daya|transformator|subs?tation|switchyard",re.I)),
 ("distribution",re.compile(r"distribusi|penyulang|jaringan\s+tegangan\s+menengah|jaringan\s+tegangan\s+rendah|(?:^|\W)jtm(?:\W|$)|(?:^|\W)jtr(?:\W|$)|lisdes|elektrifikasi|rasio\s+elektrifikasi",re.I)),
 ("generation",re.compile(r"pembangkit|pembangunan\s+tenaga|(?:^|\W)plt[abgmsut]|(?:^|\W)bess(?:\W|$)|bauran\s+energi",re.I)),
 ("demand",re.compile(r"beban\s+puncak|kebutuhan\s+tenaga|penjualan\s+tenaga|proyeksi\s+beban",re.I)),
 ("investment",re.compile(r"investasi|pendanaan|kebutuhan\s+dana|biaya\s+pembangunan",re.I)),
 ("emissions",re.compile(r"emisi|co2|karbon",re.I)),
]
def categories(text):
    return [name for name,rx in CLASSIFIERS if rx.search(text)]
def digest(pdf):
    h=hashlib.sha256()
    with pdf.open("rb") as f:
        for block in iter(lambda:f.read(4*1024*1024),b""):h.update(block)
    return h.hexdigest()
def clean(s):
    if s is None:return None
    return " ".join(str(s).split())[:300] or None
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--pdf",type=Path,required=True)
    p.add_argument("--output",type=Path,default=Path("data/sli-ruptl-1253-page-table-inventory-review.json"))
    p.add_argument("--grid-output",type=Path,default=Path("data/sli-ruptl-network-table-grids-review.json"))
    p.add_argument("--max-grid-pages",type=int,default=180)
    a=p.parse_args()
    if digest(a.pdf)!=SHA:raise ValueError("Official PDF checksum mismatch")
    headings=[]; candidates=[];pageIndex=[];tableSeen=set()
    with pymupdf.open(a.pdf) as doc:
        if len(doc)!=1253:raise ValueError("Official PDF page count mismatch")
        for idx,page in enumerate(doc):
            pn=idx+1
            t=page.get_text("text",sort=True)
            # PDF pages 18–26 are the Daftar Tabel (table OF CONTENTS),
            # not the pages where numeric table cells reside. Index every
            # page, but do not mispublish TOC references as source tables.
            matches=[] if 18<=pn<=26 else list(TABLE.finditer(t))
            page_classes=categories(t)
            pageIndex.append({"pdf_page":pn,"topic_markers":page_classes,"table_heading_count":len(matches)})
            for m in matches:
                title=clean(m.group(2))
                # Some headings continue after the captured line: retain nearby
                # source text, do not manufacture a normalized title.
                vicinity=t[m.start():min(len(t),m.start()+270)].replace("\n"," ")
                cat=categories(vicinity)
                num=m.group(1)
                key=(pn,num,title)
                if key in tableSeen:continue
                tableSeen.add(key)
                record={"table":num,"pdf_page":pn,"title_as_extracted":title,
                    "nearby_text_as_extracted":clean(vicinity),
                    "topic_candidates":cat,
                    "verification_status":"original_pdf_heading_text_not_numeric_cells_verified"}
                headings.append(record)
                if any(x in cat for x in ("transmission","substations","distribution")):
                    candidates.append(record)
        if len(pageIndex)!=1253:raise ValueError("Full page inventory incomplete")
        # Rank network/grid pages by clearly source-attributed table heading, not
        # merely a prose occurrence of the word 'transmission'.
        target_pages=sorted({r["pdf_page"] for r in candidates})
        partial=len(target_pages)>a.max_grid_pages
        target_pages=target_pages[:a.max_grid_pages]
        raw=[]
        for pn in target_pages:
            page=doc[pn-1]
            matching=[r for r in candidates if r["pdf_page"]==pn]
            try:
                tables=page.find_tables().tables
                grids=[]
                for ti,tb in enumerate(tables):
                    data=tb.extract()
                    if not data:continue
                    gridrows=[[clean(x) for x in row] for row in data[:160]]
                    grids.append({"grid_index":ti,"column_count_max":max(map(len,gridrows),default=0),
                        "rows":gridrows,"source_cell_class":"raw_pdf_cell_review_only"})
                raw.append({"pdf_page":pn,"table_headings":[{"table":r["table"],"title":r["title_as_extracted"],"topics":r["topic_candidates"]} for r in matching],
                    "grids":grids,"error":None})
            except Exception as exc:
                raw.append({"pdf_page":pn,"table_headings":[{"table":r["table"],"title":r["title_as_extracted"],"topics":r["topic_candidates"]} for r in matching],
                    "grids":[],"error":type(exc).__name__})
    counts=dict(Counter(t for r in headings for t in r["topic_candidates"]))
    inv={"schema":"sli-ruptl-all-1253-pages-table-headings-v1","source_sha256":SHA,
         "source_pdf_pages":1253,
         "page_count_audited":len(pageIndex),
         "original_table_heading_candidates":len(headings),
         "topic_heading_counts_nonexclusive":counts,
         "network_table_heading_candidates":len(candidates),
         "network_grid_pages_parsed":len(raw),
         "network_grid_pages_queued_total":len({r["pdf_page"] for r in candidates}),
         "network_grid_page_budget":a.max_grid_pages,
         "network_grid_extraction_partial":partial,
         "published_individual_network_assets_from_machine_tables":0,
         "source_scope":"Page-by-page text inventory of all 1,253 official PDF pages. Table names are text-extraction candidates, not proof of numerical table completion.",
         "page_index":pageIndex,"table_headings":headings}
    grid={"schema":"sli-ruptl-network-source-tables-raw-grid-review-v1","source_sha256":SHA,
          "source_pdf_pages":1253,"pages_with_source_cells":len(raw),
          "requested_pages":len(target_pages),
          "candidate_network_table_headings":len(candidates),
          "remaining_pages_not_grid_parsed":max(0,len({r["pdf_page"] for r in candidates})-len(raw)),
          "verified_realized_transmission_kms":None,
          "verified_realized_substation_mva":None,
          "verified_realized_distribution_km":None,
          "published_network_asset_count":0,
          "methodology":"Original PyMuPDF grid cells extracted from checksum-verified official PDF with page and table headings. Multi-header/split-column table data require row/column and unit review before numeric release or project identity inference.",
          "pages":raw}
    for path,payload in ((a.output,inv),(a.grid_output,grid)):
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("RUPTL_FULL_PAGES",len(pageIndex),"headings",len(headings),"network_candidate_headings",len(candidates),
          "network_grid_pages",len(raw),"remaining",grid["remaining_pages_not_grid_parsed"])
if __name__=="__main__":main()
