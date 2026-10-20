#!/usr/bin/env python3
"""Synchronize SLI's global search results with its official/curated IDX issuer catalogue.

Only public ticker and name locators; a search hit never establishes a live price,
ownership percentage, current listing eligibility or financial performance.
"""
import argparse
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CATALOG=ROOT/"data"/"sli-idx-issuer-universe.json"
SEARCH=ROOT/"data"/"site-search-index.json"
PREFIX="sli-idx-issuer-"

def build(index, catalog):
    if index.get("schema")!="sli-search-1" or catalog.get("schema")!="sli-idx-issuer-universe-v1":
        raise ValueError("Bad catalogue/search schema")
    base=[e for e in index["entries"] if not e.get("id","").startswith(PREFIX)]
    status=catalog.get("source_status")
    official=status=="official_exchange_bulk_snapshot"
    entries=[]
    for n in catalog["records"]:
        ticker=n["ticker"]
        sector=n["sector"]
        desc=("Snapshot direktori emiten resmi BEI, dapat berubah" if official
              else "Katalog kandidat emiten BEI · perlu konfirmasi status pencatatan")
        entries.append({
            "id": PREFIX+ticker,
            "title": ticker+" · "+n["name"],
            "description": desc+" · sektor "+sector+" · periksa profil dan sumber BEI",
            "page":"investment",
            "anchor":"",
            "kind":"record",
            "path":"sli-entities.html",
            "issuer":ticker,
            "source":"data/sli-idx-issuer-universe.json",
            "keywords":ticker+" "+n["name"]+" idx bei emiten saham public company issuer kapitalisasi keuangan "+sector,
        })
    out={**index,"entries":base+entries,"updated":catalog["as_of"]}
    if len({r["id"] for r in out["entries"]})!=len(out["entries"]):
        raise ValueError("Duplicate global search destination ID")
    return out

def main():
    p=argparse.ArgumentParser();p.add_argument("--check",action="store_true")
    args=p.parse_args()
    original=json.loads(SEARCH.read_text(encoding="utf-8"))
    catalogue=json.loads(CATALOG.read_text(encoding="utf-8"))
    expected=build(original,catalogue)
    indexed=[x for x in original["entries"] if x["id"].startswith(PREFIX)]
    if args.check:
        if len(indexed)!=len(catalogue["records"]):
            raise SystemExit("Mismatch IDX catalogue/global search: "+str(len(indexed))+"/"+str(len(catalogue["records"])))
        if {x["issuer"] for x in indexed}!={x["ticker"] for x in catalogue["records"]}:
            raise SystemExit("Global search IDX ticker set is stale")
        if any(x["path"]!="sli-entities.html" for x in indexed):
            raise SystemExit("Global search points away from Entity Intelligence")
        print("Checked",len(indexed),"indexed issuer deep-links;","total site search:",len(original["entries"]))
        return
    new=json.dumps(expected,ensure_ascii=False,indent=2)+"\n"
    if original != expected:
        temp=SEARCH.with_suffix(".json.tmp");temp.write_text(new,encoding="utf-8");temp.replace(SEARCH)
        print("Reindexed",len(catalogue["records"]),"ticker-linked company search records")
    else:
        print("Issuer search unchanged")

if __name__=="__main__":
    main()
