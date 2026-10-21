#!/usr/bin/env python3
"""Offline BPS 2026: recheck only source-flagged 85 watermark + 1 ambiguous cells.

Requires exact BPS source PDF and PRIVATE JSON audit from the ChatGPT operator
review package. Outputs only outside the public SLI repo, never republishes PDF
cells. The small 7pt Aptos text spans encode table data; the diagonal watermark
is separate large Arial text, incorrectly merged in PyMuPDF's table extraction.
"""
import argparse, hashlib, json, re
from pathlib import Path
import fitz

REPO=Path(__file__).resolve().parents[1]
EXPECTED_SHA256="af5dcf57f3510e2d390885035f4a0aeef5a52851e9a69fa6e9028b3bf8e5a355"
PAGES=(53,56,59,133,134,135)

def private_file(path):
    path=Path(path).expanduser().resolve()
    if path==REPO or REPO in path.parents:
        raise ValueError("Unlicensed BPS numeric review data may not be written under public repository")
    return path

def audit(pdf,audit_json,output):
    pdf=Path(pdf)
    if not pdf.is_file() or hashlib.sha256(pdf.read_bytes()).hexdigest()!=EXPECTED_SHA256:
        raise ValueError("Source PDF SHA256 does not match the 668-page original")
    flags=json.loads(Path(audit_json).read_text(encoding="utf-8"))
    items=flags["contaminated_candidates"]+flags["invalid_candidates"]
    if len(items)!=86:
        raise ValueError("Expected 85 previously marked watermark cells + 1 ambiguous cell")
    doc=fitz.open(pdf)
    if len(doc)!=668:raise ValueError("Expected 668 original source pages")
    caches={}
    for number in PAGES:
        page=doc[number-1]
        t=page.find_tables()
        if len(t.tables)!=1:raise ValueError("Expected exactly one table per pilot source page")
        spans=[s for b in page.get_text("dict")["blocks"] for ln in b.get("lines",[]) for s in ln.get("spans",[])]
        caches[number]=(t.tables[0],spans)
    matched=0;unmatched=[]
    for item in items:
        m=re.fullmatch(r"([0-9.]+) PDF ([0-9]+) CSV row ([0-9]+) col ([0-9]+)",item["location"])
        if not m:raise ValueError("Invalid original audit cell locator")
        tableid,pg,row,col=m.group(1),*map(int,m.groups()[1:])
        table,spans=caches[pg]
        box=table.rows[row-1].cells[col-1]
        if box is None:raise ValueError("Missing original source cell")
        data=[s["text"].strip() for s in spans if fitz.Rect(s["bbox"]).intersects(fitz.Rect(box))
              and s["size"]<11 and "Aptos" in s["font"]]
        raw="".join(data).strip().replace(" ","")
        if re.fullmatch(r"[0-9.]+",raw):
            independent=int(raw.replace(".",""))
        elif raw in ("–","—","-",""):
            independent=None
        else:
            unmatched.append({"source_cell":item["location"],"error":"not a clear numeric or dash source cell"})
            continue
        if independent==item.get("tentative_value"):
            matched+=1
        else:unmatched.append({"source_cell":item["location"],"error":"native source differs from candidate"})
    # Source-print discrepancy checks: never impute source dash to zero or residual.
    checks={}
    for tableid,pg,col,official in [("6.1",133,2,5155),("6.2",134,3,209)]:
        tab,spans=caches[pg]
        rows=tab.extract()
        if int(rows[-1][col].replace(".",""))!=official:raise ValueError("National total changed from reviewed original PDF")
        parts=[];dashes=0
        for i in range(1,len(rows)-1):
            box=tab.rows[i].cells[col]
            if box is None:continue
            toks=[s["text"].strip() for s in spans if fitz.Rect(s["bbox"]).intersects(fitz.Rect(box))
                  and s["size"]<11 and "Aptos" in s["font"]]
            value="".join(toks).strip().replace(" ","")
            if re.fullmatch(r"[0-9.]+",value):parts.append(int(value.replace(".","")))
            elif value in ("–","—","-"):dashes+=1
            else:raise ValueError("Ambiguous original source cell in table "+tableid)
        checks[tableid]={"published_national_total":official,"sum_numeric_provincial_cells":sum(parts),
                        "source_dash_cells":dashes,"difference_not_imputed":official-sum(parts)}
    if checks["6.1"]["difference_not_imputed"]!=1 or checks["6.2"]["difference_not_imputed"]!=14:
        raise ValueError("Expected source discrepancy changed, requires full re-review")
    out={"schema":"sli-bps-watermark-audit-summary-v1","source_sha256":EXPECTED_SHA256,
         "flags_reviewed":len(items),"matching_native_source_cells":matched,"mismatched_cells":unmatched,
         "publisher_discrepancies":checks,"original_business_directory_excluded":True,
         "public_numeric_release_allowed":False,"all_82_tables_cell_verified":False,
         "rights_status":"written_BPS_commercial_permission_not_on_file",
         "note":"This is a text-layer crosscheck and does not substitute for visual inspection of every table."}
    target=private_file(output);target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return out
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--pdf",type=Path,required=True)
    parser.add_argument("--flags",type=Path,required=True,help="Private original six_tables_internal_numeric_crosscheck.json")
    parser.add_argument("--output",type=Path,required=True,help="Must be outside the public git checkout")
    a=parser.parse_args()
    report=audit(a.pdf,a.flags,a.output)
    print("Source-native validated",report["matching_native_source_cells"],"/",report["flags_reviewed"])
    print("Publisher discrepancies unchanged; numeric publication not authorized.")
    if report["mismatched_cells"]:raise SystemExit("Original source cell mismatches require visual review")
