#!/usr/bin/env python3
"""Recompute SLI September 2026 official-PDF numeric glyph proof locally.

Requires the unchanged *user-supplied original* 89-page PDF, not a source URL.
This verifies row numeric multisets and 5 native-glyph fallback rows; it does
NOT independently certify all 2,163 commodity/row labels or publisher facts.

Usage:
 python scripts/audit_pusdatin_pdf_adaptive.py --pdf /path/to/original.pdf
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

import fitz

ROOT=Path(__file__).resolve().parents[1]
PROOF=ROOT/"data/pusdatin-september-adaptive-pdf-proof.json"
NUM=re.compile(r"^(?:-?\d[\d.,]*|[-—])$")
def canonical(s):
    if s in ("-","—"):return "x"
    return str(round(float(s.replace(".","").replace(",","."))*100))
def fnv(value):
    h=2166136261
    for byte in value.encode("utf8"):h=((h^byte)*16777619)&0xffffffff
    return h
def pdf_page(n):
    if n<=27:return n+16
    if n==28:return 47
    if n==29:return 48
    if n<=43:return n+21
    if n<=62:return n+23
    return 88
def column_count(n):
    return 12 if n<=27 or n==29 else (10 if n in (28,63) else 11)
def glyph_rows(document,n,tolerance):
    page=document[pdf_page(n)-1]
    lines=[l for b in page.get_text("dict")["blocks"] if "lines" in b for l in b["lines"]]
    vertical=sum(abs(l["dir"][1])>.5 for l in lines)>len(lines)/2
    words=page.get_text("words")
    y=0 if vertical else 1
    x=1 if vertical else 0
    groups=[]
    for word in sorted(words,key=lambda w:(w[y],-w[x] if vertical else w[x])):
        axis=word[y]
        if groups and abs(axis-groups[-1][0])<tolerance:
            groups[-1][1].append(word)
        else:groups.append([axis,[word]])
    data=[]
    for _,group in groups:
        bits=[w[4] for w in sorted(group,key=lambda w:-w[1] if vertical else w[0])]
        k=column_count(n)
        if len(bits)<=k or not all(NUM.fullmatch(v) for v in bits[-k:]):continue
        if not any(re.search("[a-zA-Z]",v) for v in bits[:-k]):continue
        data.append(bits[-k:])
    return data
def native_fallback(document,row):
    text=document[row["page"]-1].get_text("text")
    lines=[s.strip() for s in text.splitlines() if s.strip()]
    candidates=[]
    for i,label in enumerate(lines):
        if not label.lower().endswith(row["label"].lower()):continue
        vals=[]
        for text_part in lines[i+1:i+15]:
            fragments=text_part.split()
            if not all(NUM.fullmatch(v) for v in fragments):break
            vals.extend(fragments)
            if len(vals)>=12:break
        if len(vals)==12 and vals[0]==row["first"]:
            candidates.append(vals)
    if len(candidates)!=1:
        raise RuntimeError(f"Native text row ambiguity T{row['table']} {row['label']}: {len(candidates)} found")
    vals=list(map(canonical,candidates[0]))
    sha=hashlib.sha256(",".join(vals).encode("utf8")).hexdigest()
    if sha!=row["sha256"] or vals!=row["values"]:
        raise RuntimeError("Source PDF native fallback has changed: T"+str(row["table"]))
    return candidates[0]
def verify(path):
    proof=json.loads(PROOF.read_text(encoding="utf8"))
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    if digest!=proof["source_original_pdf_sha256"]:
        raise RuntimeError("Wrong original PDF SHA-256; do not change the baseline silently")
    with fitz.open(str(path)) as document:
        if len(document)!=89:raise RuntimeError("Expected exactly 89 source pages")
        result=[]
        for item in proof["pdf_table_evidence"]:
            n=item["table"]
            numeric=glyph_rows(document,n,item["pdf_row_baseline_tolerance_pt"])
            for fallback in (r for r in proof["pdf_fallback_rows"] if r["table"]==n):
                numeric.append(native_fallback(document,fallback))
            hashes=[fnv(",".join(map(canonical,row))) for row in numeric]
            multiset=fnv("|".join(map(str,sorted(hashes))))
            valid=(len(numeric)==item["pdf_numeric_rows"] and multiset==item["pdf_multiset_fnv32"])
            result.append({"table":n,"page":item["pdf_page"],"numeric_rows":len(numeric),"match":valid})
        return {"schema":"sli-pusdatin-pdf-adaptive-local-replay-v1",
                "original_pdf_sha256":digest,"tables":result,"passed":sum(r["match"] for r in result),
                "expected":63,"numeric_matrix_only_not_full_visual_label_certification":True}
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--pdf",required=True,type=Path)
    ap.add_argument("--out",default="artifacts/sli-pusdatin-pdf-local-replay.json",type=Path)
    args=ap.parse_args()
    if not args.pdf.is_file():ap.error("Original PDF file not found")
    result=verify(args.pdf)
    args.out.parent.mkdir(parents=True,exist_ok=True)
    args.out.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print("PDF original numeric matrices:",result["passed"],"/",result["expected"],"matched")
    return 0 if result["passed"]==result["expected"] else 2
if __name__=="__main__":sys.exit(main())
