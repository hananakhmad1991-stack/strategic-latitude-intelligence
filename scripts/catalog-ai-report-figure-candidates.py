#!/usr/bin/env python3
"""Catalog figure-label candidates from official PDF files (review-only).
Never count automatically detected figure captions as verified numeric series.
No source PDFs or copyrighted figure images are uploaded to the public site.
"""
import argparse
from collections import defaultdict
from datetime import datetime,timezone
import json
from pathlib import Path
import re
import fitz

def detect_page(text, publisher):
    lines=text.splitlines()
    hits=[]
    for raw in lines:
        if publisher=="stanford":
            m=re.match(r"^\\s*Figure\\s+(\\d+\\.\\d+\\.\\d{1,3})\\s*$",raw,re.I)
            if not m: continue
            value=m.group(1)
            suspect=(len(value.split(".")[-1])>2)
            hits.append({"figure_label_candidate":value,
                "footnote_suffix_ambiguous":suspect})
        else:
            m=re.match(r"^\\s*FIGURE\\s+(\\d+)\\.\\s*(\\d+)\\s+(.{3,140})$",raw,re.I)
            if not m: continue
            hits.append({"figure_label_candidate":m.group(1)+"."+m.group(2),
                "caption_preview":m.group(3)[:110],"footnote_suffix_ambiguous":False})
    return hits

def scan(path,publisher):
    doc=fitz.open(str(path))
    if len(doc)<20 or len(doc)>1000: raise ValueError("Unexpected report page count")
    entries=[];found=0
    for i,page in enumerate(doc):
        matches=detect_page(page.get_text("text"),publisher)
        if matches:
            entries.append({"pdf_page":i+1,"figure_candidates":matches,
               "status":"auto_detected_labels_not_verified_numeric_series"})
            found+=len(matches)
    return {"publisher":publisher,"report_pages":len(doc),"pages_with_labels":len(entries),
            "extracted_candidate_labels":found,"pages":entries}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--stanford-pdf",required=True,type=Path)
    p.add_argument("--worldbank-pdf",required=True,type=Path)
    p.add_argument("--out",default="artifacts/sli-figure-label-review-candidates.json",type=Path)
    a=p.parse_args()
    series=[scan(a.stanford_pdf,"stanford"),scan(a.worldbank_pdf,"worldbank")]
    result={"schema":"sli-ai-report-figure-label-candidate-inventory-v1",
      "collected_at":datetime.now(timezone.utc).isoformat(),
      "scope":"PDF page index of candidate figure caption labels only",
      "status":"review_candidate_do_not_publish_numeric_chart_values",
      "caveat":"Occurrences may include duplicate caption/reference labels or glued footnote digits; page/figure number needs individual inspection. Candidate count does not equal validated charts.",
      "sources":series}
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    for item in series:
        print("AI_FIGURE_LABEL_CANDIDATES",item["publisher"],"pdf_pages="+str(item["report_pages"]),
              "candidate_labels="+str(item["extracted_candidate_labels"]))
if __name__=="__main__": main()
