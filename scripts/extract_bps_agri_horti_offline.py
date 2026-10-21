#!/usr/bin/env python3
"""BPS uploaded PDFs: OFFLINE private review extraction only.

Run on the operator machine with both original PDFs. Never write extracted
source text, business-directory contacts or licensed tables into public SLI
web data or GitHub. Use the source register only for table locations.
"""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REGISTER = ROOT / "data/sli-bps-agri-horti-2026-source-register.json"

def digest(file):
    h=hashlib.sha256()
    with file.open("rb") as fh:
        for chunk in iter(lambda:fh.read(2**20),b""):
            h.update(chunk)
    return h.hexdigest()

def safe_destination(dest):
    dest=dest.expanduser().resolve()
    if dest == ROOT or ROOT in dest.parents:
        raise ValueError("Private PDF extraction output MUST be outside public GitHub repository")
    return dest

def extract(agriculture,horticulture,output):
    import fitz  # pymupdf; install explicitly in local operator environment
    reg=json.loads(REGISTER.read_text(encoding="utf-8"))
    if reg["schema"]!="sli-bps-agri-horti-2026-source-register-v1":
        raise ValueError("Unexpected source catalog")
    paths={"agri2025":Path(agriculture),"horti2026":Path(horticulture)}
    output=safe_destination(Path(output))
    output.mkdir(parents=True,exist_ok=True)
    inventory={"schema":"sli-bps-private-table-candidates-v1",
      "release_policy":"PRIVATE_OPERATOR_REVIEW_ONLY_DO_NOT_PUBLISH",
      "contacts_and_business_directories":"EXCLUDED",
      "documents":[]}
    for doc in reg["documents"]:
        path=paths[doc["id"]]
        if not path.is_file() or digest(path)!=doc["source_sha256"]:
            raise ValueError("Source PDF missing or changed; compare SHA256 and re-review cover metadata: "+doc["id"])
        d=fitz.open(path)
        if len(d)!=doc["total_pdf_pages"]:
            raise ValueError("Unexpected page count "+doc["id"])
        pages=sorted(set(page for t in reg["tables"] if t["document_id"]==doc["id"] for page in t.get("statistical_pdf_pages",[t["pdf_page"]])))
        records=[]
        for n in pages:
            # Only registered statistical pages; whole >500-page phone directory omitted.
            text=d[n-1].get_text("text",sort=True)
            refs=[t["id"] for t in reg["tables"] if t["document_id"]==doc["id"] and n in t.get("statistical_pdf_pages",[t["pdf_page"]])]
            records.append({"pdf_page":n,"table_ids":refs,"text":text,"numeric_status":"unverified_raw_text",
              "source_locator":"PDF page "+str(n), "manual_visual_table_review_required":True})
        # No public write: this file contains copyrighted table text and possibly marginal
        # textual names. Never publish/share it without a rights and privacy review.
        result={"schema":"sli-bps-private-statistical-pages-v1","source_sha256":doc["source_sha256"],
          "data_access":"PRIVATE_ONLY","commercial_permission":"NOT_ON_FILE","pages":records}
        outfile=output/(doc["id"]+"_private_review.json")
        outfile.write_text(json.dumps(result,ensure_ascii=False,indent=1)+"\n",encoding="utf-8")
        inventory["documents"].append({"id":doc["id"],"source_pdf_pages":len(d),
          "statistical_pages_extracted":len(records),"source_sha256":doc["source_sha256"],
          "review_only_path":str(outfile),"numeric_publication_allowed":False})
    (output/"inventory.json").write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return inventory

if __name__=="__main__":
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--agriculture",required=True,help="Original uploaded indikator-pertanian-2025.pdf")
    ap.add_argument("--horticulture",required=True,help="Original uploaded statistik-perusahaan-hortikultura-dan-usaha-hortikultura-lainnya-2026.pdf")
    ap.add_argument("--output",required=True,help="Directory OUTSIDE the git repository")
    a=ap.parse_args()
    report=extract(a.agriculture,a.horticulture,a.output)
    print("PRIVATE source candidate pages:",sum(x["statistical_pages_extracted"] for x in report["documents"]))
    print("No original PDF or extracted numerical cells are written to public SLI.")
