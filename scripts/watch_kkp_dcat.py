#!/usr/bin/env python3
"""Watch public KKP DCAT metadata as review leads, never auto-promote numeric claims.
No API keys, model calls, source data overwrites or automatic changes to KKP facts.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
BASELINE=ROOT/"docs/sli-kkp-dcat-baseline.json"
MAX_BYTES=3_000_000
CATALOG="https://portaldata.kkp.go.id/api/portal/data_dcat"

def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))

def public_source(url):
    if not isinstance(url,str) or not url.startswith("https://"):return False
    try:
        parsed=urlparse(url)
        return parsed.hostname=="portaldata.kkp.go.id" and not parsed.username and not parsed.password
    except (ValueError,TypeError):
        return False

def evaluate(baseline, catalog):
    if baseline.get("schema")!="sli-kkp-dcat-watch-v1" or baseline.get("catalog")!=CATALOG:
        raise ValueError("Invalid pinned KKP watch baseline")
    if not isinstance(catalog,dict) or not isinstance(catalog.get("dataset"),list):
        raise ValueError("KKP DCAT response lacks dataset list")
    indexes={}
    for item in catalog["dataset"]:
        if not isinstance(item,dict):continue
        identifier=item.get("identifier")
        if isinstance(identifier,str) and identifier:
            indexes[identifier]=item
    updates,absent,links=[],[],[]
    for expected in baseline["watch"]:
        entry=indexes.get(expected["id"])
        if not entry:
            absent.append({"topic":expected["topic"],"id":expected["id"],"reason":"not_in_current_catalog"})
            continue
        changed=entry.get("modified")
        if changed!=expected["modified"]:
            updates.append({"topic":expected["topic"],"id":expected["id"],
                "old_modified":expected["modified"],"current_modified":changed,
                "reason":"metadata_version_changed_not_statistical_revision"})
        distributions=entry.get("distribution") or []
        safe=[d.get("downloadURL") for d in distributions if isinstance(d,dict) and public_source(d.get("downloadURL"))]
        if safe:links.append({"topic":expected["topic"],"public_distribution_count":len(safe)})
    status="review_candidates" if updates or absent else "metadata_unchanged"
    return {"schema":"sli-kkp-dcat-review-v1","status":status,"baseline_date":baseline["baseline_date"],
        "retrieved_dataset_count":len(catalog["dataset"]),"watched":len(baseline["watch"]),
        "metadata_changes":updates,"missing_catalog_entries":absent,
        "distribution_coverage":links,
        "numeric_values_rewritten":False,"model_called":False,
        "policy":"Changes in public KKP DCAT are review candidates only, not new observations, current policy, confirmed stats or an authorized commercial license."}

def fetch():
    request=Request(CATALOG,headers={"User-Agent":"SLI-KKP-Source-Metadata-QA/1.0","Accept":"application/json"})
    with urlopen(request,timeout=20) as response:
        payload=response.read(MAX_BYTES+1)
    if len(payload)>MAX_BYTES:raise ValueError("KKP catalog exceeds bounded response size")
    return json.loads(payload)

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--catalog-file",help="Offline catalog fixture; never network")
    parser.add_argument("--out",default="artifacts/sli-kkp-dcat-review.json")
    args=parser.parse_args()
    source=read_json(BASELINE)
    try:
        catalogue=read_json(args.catalog_file) if args.catalog_file else fetch()
        report=evaluate(source,catalogue)
    except Exception as error:
        if args.catalog_file:raise
        report={"schema":"sli-kkp-dcat-review-v1","status":"upstream_unavailable",
            "reason":type(error).__name__,"metadata_changes":[],"missing_catalog_entries":[],
            "numeric_values_rewritten":False,"model_called":False,
            "policy":"Official catalog unavailable: retain last verified values; never replace missing with zero."}
    report["checked_utc"]=dt.datetime.now(dt.timezone.utc).isoformat()
    path=Path(args.out);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("KKP DCAT review:",report["status"],"new metadata candidates:",len(report["metadata_changes"]))
    if args.catalog_file and report["status"]=="upstream_unavailable":
        raise SystemExit(1)

if __name__=="__main__":main()
