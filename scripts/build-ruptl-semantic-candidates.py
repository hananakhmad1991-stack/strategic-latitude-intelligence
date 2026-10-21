#!/usr/bin/env python3
"""Conservative semantic crosswalk of 970 RUPTL PDF table-grid candidates.

No candidate is automatically promoted to an independent physical project.
Values with merged/split PDF columns remain unknown. Official original 2025
plan is never evidence of actual COD or operation in 2026.
"""
import collections,json,re,unicodedata,argparse
from pathlib import Path
BASE=Path("data")
RAW=BASE/"sli-ruptl-970-raw-grid-candidates-review.json"
ORIGINAL=BASE/"sli-ruptl-primary-pdf-2025-2034.json"
PROV=BASE/"sli-ruptl-provincial-source-projects-2025.json"
EXPANDED=BASE/"sli-ruptl-expanded-22-annex-source-rows.json"
OUT=BASE/"sli-ruptl-970-semantic-candidates-2025.json"
# The source prints footnoted types (PLTBg1)), hybrids (PLTS+BESS),
# slash-delimited gas (PLTG/GU), and PumpStorage in technology CELLS.
TECH=re.compile(r"^(?:PLT.{1,21}|BESS|PUMP\s*STORAGE|PS)\s*$",re.I)
PROGRAM=re.compile(r"kuota|tersebar|lisdes|dedieselisasi|pembangkit\s*ebt|isolated|microgrid",re.I)
CLEAN=lambda x: " ".join(str(x or "").split())
def identity(s):
    t=unicodedata.normalize("NFKD",str(s or "")).casefold()
    return re.sub(r"[^a-z0-9]","",t)
def capacity(cell):
    raw=CLEAN(cell)
    # Scan commonly merges decimals: "98 ," may actually be "9,8";
    # only preserve the raw string until visually/source-cell reviewed.
    if re.fullmatch(r"\d{1,5}",raw) and raw!="0":
        return int(raw)
    return None
def candidate(row):
    cells=[CLEAN(x) for x in row["raw_cells"]]
    p=next((i for i,x in enumerate(cells[1:],1) if TECH.match(x)),None)
    if p is None:return {"technology":None,"project_label":None,"capacity_as_extracted":None,"capacity_unreviewed_mw":None,"status_2025":None,"developer_class":None,"planned_year_tokens":[],"parse_method":"no_recognized_technology_cell"}
    labelidx=next((i for i in range(p+1,min(len(cells),p+4)) if cells[i] and not re.fullmatch(r"[-\d., ]+",cells[i])),None)
    name=cells[labelidx] if labelidx is not None else None
    capidx=next((i for i in range((labelidx or p)+1,min(len(cells),(labelidx or p)+5)) if cells[i] and re.fullmatch(r"[\d.,xX* \-]+",cells[i]) and not re.fullmatch(r"(?:20[2-3]\d\s*)+",cells[i])),None)
    cap=cells[capidx] if capidx is not None else None
    year_tokens=[]
    for s in cells[max((capidx or p)+1,p+2):]:
        if re.fullmatch(r"(?:20[2-3]\d(?:\s+|$))+",s):year_tokens.extend(re.findall(r"20[2-3]\d",s))
    stages=("konstruksi","konstru ksi","rencana","pengadaan","pendanaan","ppa","committed","konstr uksi")
    stage=next((s for s in cells if s.casefold().strip() in stages),None)
    developer=next((s for s in reversed(cells) if re.fullmatch(r"(?:PLN|IPP|SH\s*PLN\s*-?|BUMN|BUMD)",s,re.I)),None)
    return {"technology":cells[p] if p is not None else None,"project_label":name,"capacity_as_extracted":cap,
      "capacity_unreviewed_mw":capacity(cap) if cap else None,"status_2025":stage,"developer_class":developer,
      "planned_year_tokens":year_tokens,"parse_method":"heuristic_original_pdf_grid_not_source_verified"}
def main():
    a=argparse.ArgumentParser()
    a.add_argument("--output",type=Path,default=OUT);opts=a.parse_args()
    raw=json.loads(RAW.read_text());old=json.loads(ORIGINAL.read_text())
    prov=json.loads(PROV.read_text());extra=json.loads(EXPANDED.read_text())
    sha=old["source"]["sha256"]
    if not (sha==raw["source_pdf_sha256"]==prov["source"]["sha256"]==extra["source_sha256"]):raise ValueError("Full original PDF source checksum mismatch")
    if raw["total_raw_grid_candidates"]!=970 or len(raw["sections"])!=34:raise ValueError("Unexpected source grid coverage")
    known=[]
    old_group={"Aceh":"A.1","DKI Jakarta":"B.1","Sulawesi Utara":"C.1"}
    for r in old["individual_project_source_records"]["records"]:
        known.append({"id":r["id"],"annex_id":old_group[r["province"]],"table":r["table"],"page":r["pdf_page"],
            "label":r["project_name"],"technology":r["technology"],"capacity_as_printed":r["capacity_as_printed"],"year":r["cod_ared"]})
    for r in prov["source_rows"]:
        known.append({"id":r["id"],"annex_id":r["annex_id"],"table":r["table"],"page":r["pdf_page"],
            "label":r["source_project_label"],"technology":r["technology"],"capacity_as_printed":r["capacity_as_printed"],"year":r["planned_cod_ared"]})
    for r in extra["rows"]:
        known.append({"id":r["id"],"annex_id":r["annex_id"],"table":r["table"],"page":r["pdf_page"],
            "label":r["source_project_label"],"technology":r["technology"],"capacity_as_printed":r["capacity_as_printed"],"year":r["planned_cod_ared"],
            "printed_row_no":str(r["original_source_row_no"])})
    if len(known)!=92:raise ValueError("Unexpected curated sample count")
    anchor_by_page=collections.defaultdict(list)
    for a in known:anchor_by_page[(a["annex_id"],a["page"],a["table"])].append(a)
    rows=[]
    for section in raw["sections"]:
        for r in section["rows"]:
            c=candidate(r)
            potential=anchor_by_page[(section["annex_id"],r["page"],r["table"])]
            matched=[]
            for a in potential:
                same_label=identity(a["label"])==identity(c["project_label"])
                same_tech=identity(a["technology"])==identity(c["technology"])
                row_number=a.get("printed_row_no")
                if row_number is not None and str(r["original_row_no"])!=row_number:continue
                if same_label and same_tech:matched.append(a)
            match=matched[0] if len(matched)==1 else None
            project_label=match["label"] if match else c["project_label"]
            stage=c["status_2025"]
            kind="program_quota_or_area" if project_label and PROGRAM.search(project_label) else ("named_source_label_not_distinct_asset" if project_label else "unresolved_source_cell")
            out={"source_key":r["source_key"],"annex_id":section["annex_id"],"geographic_heading":section["geographic_heading"],"source_pdf_page":r["page"],"source_table":r["table"],
              "original_source_row_no":r["original_row_no"],"original_cells":r["raw_cells"],
              "technology_candidate":match["technology"] if match else c["technology"],
              "source_label_candidate":project_label,"source_label_key":identity(project_label),
              "record_kind_candidate":kind,"capacity_source_cell_unreviewed":c["capacity_as_extracted"],
              "capacity_mw_verified_from_curated_source_row":None,
              "capacity_mw_unreviewed_machine_candidate":c["capacity_unreviewed_mw"],
              "stage_2025_candidate":stage,"developer_class_candidate":c["developer_class"],
              "planned_year_tokens_machine_only":c["planned_year_tokens"],
              "sample_source_row_match_id":match["id"] if match else None,
              "sample_source_row_match_status":"unique_page_table_label_technology_match" if match else ("ambiguous" if len(matched)>1 else "no_curated_sample_match"),
              "parse_method":c["parse_method"],
              "physical_asset_identity_verified":False,
              "actual_2026_operational_status":None,"verified_actual_cod":None,
              "realized_capacity_mw":None,"geo_coordinates":None}
            if match:
                # Curated source-row MW is publication-backed only for plain, known MW
                # Capacity numeric remains a PLAN amount, not physically commissioned.
                printed=match["capacity_as_printed"]
                if re.fullmatch(r"\d+(?:,\d+)?",printed):
                    # Thousands delimiter "1.000" retained null without extra attribution
                    numeric=float(printed.replace(",",".")) if "," in printed else float(printed)
                    out["capacity_mw_verified_from_curated_source_row"]=numeric
            rows.append(out)
    if len(rows)!=970 or len({x["source_key"] for x in rows})!=970:raise ValueError("Incomplete candidate set")
    by_name=collections.defaultdict(list)
    for r in rows:
        if r["source_label_key"] and r["record_kind_candidate"]!="program_quota_or_area":
            by_name[(identity(r["technology_candidate"]),r["source_label_key"])].append(r["source_key"])
    collisions={k:v for k,v in by_name.items() if len(v)>1}
    for r in rows:
        dup=collisions.get((identity(r["technology_candidate"]),r["source_label_key"]),[])
        r["name_collision_source_keys"]=dup if len(dup)>1 else []
        r["name_collision_not_proof_same_asset"]=bool(dup)
    counters={
       "source_grid_candidates":len(rows),
       "recognized_technology":sum(bool(x["technology_candidate"]) for x in rows),
       "candidate_name_present":sum(bool(x["source_label_candidate"]) for x in rows),
       "program_quota_area_candidates":sum(x["record_kind_candidate"]=="program_quota_or_area" for x in rows),
       "curated_sample_matched_uniquely":sum(x["sample_source_row_match_id"] is not None for x in rows),
       "unresolved_curated_samples":len(known)-len({x["sample_source_row_match_id"] for x in rows if x["sample_source_row_match_id"]}),
       "name_collision_candidates":sum(x["name_collision_not_proof_same_asset"] for x in rows),
       "verified_distinct_physical_assets_from_machine_extract":0,
       "actual_2026_status_confirmed_from_2025_pdf":0}
    out={"schema":"sli-ruptl-970-semantic-candidate-ledger-v1","source_pdf_sha256":sha,"source_pages":1253,
         "source_url":old["source"]["source_url"],
         "scope":"Machine-extracted source row with cautious semantic candidates, not final site identity. 92 hand-reviewed sample rows are matched only when source label+technology+page are unique.",
         "counters":counters,
         "caveats":["Published date/status in 2025 document is not realisation in 2026",
                    "Original combined/split PDF cells are not repaired automatically",
                    "Candidate name duplicates are an editorial review queue, not asset merging",
                    "No regional MW total or number of distinct generating assets is calculated from 970 machine rows"],
         "rows":rows}
    opts.output.parent.mkdir(parents=True,exist_ok=True)
    opts.output.write_text(json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n")
    print("RUPTL_SEMANTIC_REVIEW_ONLY",json.dumps(counters,ensure_ascii=False))
if __name__=="__main__":main()
