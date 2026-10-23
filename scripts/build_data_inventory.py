#!/usr/bin/env python3
"""Auditable inventory of committed SLI JSON. Counts are structural, not verified economic observations."""
import json
from pathlib import Path
from datetime import datetime, timezone

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
OUT=DATA/"sli-data-inventory.json"
EXCLUDE={"sli-data-inventory.json"}
META_MARKERS=("config","membership","glossary","translation","dictionary","schema","style","navigation","cache","test","manifest","metadata")
DATE_KEYS=("observation_date","data_as_of","updated_at","last_updated","published_at","as_of","reference_date","date")
COLLECTION_KEYS=("records","observations","rows","items","data","features","projects","indicators","series","entries","actors","regulations","provinces","sources","nodes")

def primary_collection(obj):
    if isinstance(obj,list): return obj,"root"
    if not isinstance(obj,dict): return None,None
    candidates=[(k,v) for k,v in obj.items() if k in COLLECTION_KEYS and isinstance(v,list)]
    if not candidates: return None,None
    k,v=max(candidates,key=lambda x:len(x[1]))
    return v,k

def find_dates(obj):
    found=[]
    def scan(v,depth=0):
        if depth>3: return
        if isinstance(v,dict):
            for k,x in v.items():
                if k.lower() in DATE_KEYS and isinstance(x,str): found.append(x[:10])
                elif isinstance(x,(dict,list)): scan(x,depth+1)
        elif isinstance(v,list):
            for x in v[:15]: scan(x,depth+1)
    scan(obj)
    return sorted([x for x in found if len(x)==10 and x[4:5]=="-" and x[7:8]=="-"],reverse=True)

items=[]
for p in sorted(DATA.glob("*.json")):
    if p.name in EXCLUDE: continue
    name=p.stem.lower()
    entry={"file":p.relative_to(ROOT).as_posix(),"bytes":p.stat().st_size,"category":"metadata" if any(k in name for k in META_MARKERS) else "candidate_dataset"}
    try:
        obj=json.loads(p.read_text(encoding="utf-8-sig"))
        rows,key=primary_collection(obj)
        entry["primary_collection"]=key
        entry["primary_records"]=len(rows) if rows is not None else None
        entry["root_type"]=type(obj).__name__
        entry["top_level_keys"]=len(obj) if isinstance(obj,dict) else None
        dates=find_dates(obj)
        entry["latest_date_found"]=dates[0] if dates else None
        entry["status"]="parsed"
        entry["validation"]="structural_only"
    except (ValueError,UnicodeError) as e:
        entry.update(status="invalid_json",error=str(e)[:160],primary_records=None,validation="failed")
    items.append(entry)

parsed=[x for x in items if x["status"]=="parsed"]
candidates=[x for x in parsed if x["category"]=="candidate_dataset"]
measured=[x for x in candidates if x["primary_records"] is not None]
out={
 "generated_at_utc":datetime.now(timezone.utc).isoformat(),
 "scope":"Committed root data/*.json files on the workflow checkout; excludes private D1/R2, APIs and nested folders.",
 "methodology":"One primary list per JSON, selected from recognized keys; counts are not de-duplicated across files. Objects/maps and nested series may not count as rows. No verified unique indicator total is claimed.",
 "totals":{"json_files":len(items),"candidate_dataset_files":len(candidates),"metadata_files":len(parsed)-len(candidates),"files_with_measurable_primary_list":len(measured),"primary_records_structural_sum":sum(x["primary_records"] for x in measured),"unmeasurable_candidate_files":len(candidates)-len(measured),"invalid_json_files":len(items)-len(parsed),"verified_unique_indicators":None,"verified_unique_observations":None},
 "datasets":items
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(out["totals"],ensure_ascii=False))
