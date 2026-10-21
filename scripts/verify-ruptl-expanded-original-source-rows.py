#!/usr/bin/env python3
"""Recheck each hand-selected RUPTL source row directly against the full original PDF.

This accepts an original PAGE/CELL transcription only. It never asserts
uniqueness of generating facilities or any realized/operational status.
"""
import argparse,hashlib,json,re
from pathlib import Path
import pymupdf as fitz

def norm(s):
    return " ".join(str(s or "").replace("\n"," ").split()).casefold()
def compact(s):
    return re.sub(r"\s+","",norm(s))
def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--pdf",type=Path,required=True)
    cli.add_argument("--source-rows",type=Path,default=Path("data/sli-ruptl-expanded-22-annex-source-rows.json"))
    cli.add_argument("--report",type=Path,default=Path("artifacts/sli-ruptl-44-original-source-row-proof.json"))
    a=cli.parse_args()
    data=json.loads(a.source_rows.read_text(encoding="utf8"))
    digest=hashlib.sha256(a.pdf.read_bytes()).hexdigest()
    if digest!=data["source_sha256"]:raise ValueError("Original RUPTL checksum mismatch")
    if data["new_source_row_count"]!=44 or len(data["rows"])!=44:
        raise ValueError("Unexpected source sample coverage")
    checked=[]
    pdf=fitz.open(str(a.pdf))
    try:
        if len(pdf)!=1253:raise ValueError("Unexpected number of official PDF pages")
        for row in data["rows"]:
            page_no=row["pdf_page"]
            page=pdf[page_no-1]
            numbered=[]
            for gi,table in enumerate(page.find_tables().tables):
                for ri,cells in enumerate(table.extract()):
                    if not cells:continue
                    target=str(row["original_source_row_no"])
                    first=compact(cells[0])
                    split_no=(len(cells)>1 and first in ("","-") and compact(cells[1])==target)
                    if first!=target and not split_no:continue
                    values=[norm(x) for x in cells]
                    full= " | ".join(values)
                    match_label=compact(row["source_project_label"]) in [compact(v) for v in values]
                    # Named projects and quota/plan entries must match a source TABLE CELL,
                    # not an unrelated adjacent paragraph or a web mention.
                    match_cap=compact(row["capacity_as_printed"]) in [compact(v) for v in values]
                    match_kind=compact(row["technology"]) in [compact(v) for v in values]
                    match_status=compact(row["stage_as_printed_2025"]) in [compact(v) for v in values]
                    match_owner=compact(row["developer_class_as_printed"]) in [compact(v) for v in values]
                    match_years=all(
                        v is None or compact(v) in [compact(z) for z in values]
                        for v in [row["planned_cod_ared"],row["planned_cod_re_base"]]
                    )
                    if all([match_label,match_cap,match_kind,match_status,match_owner,match_years]):
                        numbered.append({"pdf_page":page_no,"source_table":row["table"],
                            "source_row_no":row["original_source_row_no"],"grid_index":gi,
                            "row_index":ri,"cells":cells})
            if len(numbered)!=1:
                raise ValueError("Source row not uniquely matched "+row["id"]+
                                 " "+row["table"]+" p"+str(page_no)+" found "+str(len(numbered)))
            checked.append({"record_id":row["id"],
                "source_pdf_page":page_no,"source_table":row["table"],
                "grid_index":numbered[0]["grid_index"],
                "row_index":numbered[0]["row_index"],"row_cells_original":numbered[0]["cells"],
                "status":"checked_against_original_pdf_page_table_cells_not_unique_asset"})
    finally:
        pdf.close()
    audit={"schema":"sli-ruplt-44-source-row-proof-v1",
        "source_sha256":digest,"source_pdf_pages":1253,
        "checked_source_row_count":len(checked),
        "distinct_geographic_subannexes":len({v["annex_id"] for v in data["rows"]}),
        "all_rows_accepted_as_reality_evidence":False,
        "auto_approved_actual_cod":0,
        "rows":checked,
        "methodology":"Exact project/technology/capacity/stage/developer/COD source table CELL match within original numbered PDF page and row. Does NOT prove site identity, uniqueness or present-day status."}
    a.report.parent.mkdir(exist_ok=True,parents=True)
    a.report.write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print("RUPTL_44_SOURCE_ROWS_CONFIRMED="+str(len(checked))+
          " annexes="+str(audit["distinct_geographic_subannexes"])+" actual_COD_auto_approved=0")
if __name__=="__main__":main()
