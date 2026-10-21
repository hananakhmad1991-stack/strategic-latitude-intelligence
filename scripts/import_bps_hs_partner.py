#!/usr/bin/env python3
"""Stage BPS HS × partner × period data. No implicit publication to charts.

This script accepts a *normalized transcription* of rows from an official BPS
export/download, not a guessed HS and country join. It never accesses private
endpoints or reverse-engineers the BPS website's request tokens.

Usage:
 python scripts/import_bps_hs_partner.py --csv inputs/bps_hs_partner.csv --output data/bps-hs-partner-matrix.json
 python scripts/import_bps_hs_partner.py --csv inputs/bps_hs_partner.csv --output data/bps-hs-partner-matrix.json --approval inputs/bps_review.json

Approval JSON contract:
 {"reviewed_by":"<nonempty reviewer>", "source_csv_sha256":"<exact CSV SHA256>",
  "approved_cell_count":N, "independent_cell_checks":N,
  "review_note":"<meaningful manual review description>"}
Reviewed metadata is a documented human attestation; NOT a cryptographic BPS signature.
"""
import argparse
import csv
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlparse

HEADERS = {"direction","period","hs_code","partner_country","value_usd","net_weight_kg","source_url","source_locator"}
DIRECTIONS={"exports":"FOB","imports":"CIF"}
INVALID_PARTNERS={"WORLD","ALL","TOTAL","OTHERS","OTHER","ASEAN","EU","EUROPEAN UNION","UNKNOWN","UNSPECIFIED","N/A","-"}
SCHEMA="sli-bps-hs-partner-matrix-v1"

def allowed_url(value):
    try:
        parsed=urlparse(value)
        host=(parsed.hostname or "").lower()
        return parsed.scheme=="https" and (host=="bps.go.id" or host.endswith(".bps.go.id")) and not parsed.username and not parsed.password
    except ValueError:
        return False

def parse_decimal(value, field, allow_blank=False):
    value=(value or "").strip()
    if not value and allow_blank:return None
    # Standardized dot-decimal input only; no silent id-ID vs en-US coercion.
    if not re.fullmatch(r"(?:0|[1-9][0-9]*)(?:\.[0-9]{1,9})?",value):
        raise ValueError(f"{field}: expected non-negative dot-decimal (no grouping), got {value!r}")
    try: n=Decimal(value)
    except InvalidOperation: raise ValueError(f"{field}: invalid decimal")
    if not n.is_finite():raise ValueError(f"{field}: non-finite")
    return n

def read_observations(csv_path):
    if csv_path.stat().st_size>50_000_000:raise ValueError("CSV exceeds 50MB validation limit")
    with csv_path.open(encoding="utf-8-sig",newline="") as fh:
        reader=csv.DictReader(fh)
        if not reader.fieldnames or not HEADERS.issubset(set(reader.fieldnames)):
            raise ValueError("Missing canonical columns: "+",".join(sorted(HEADERS)))
        observations=[]; keys=set()
        for line,row in enumerate(reader,start=2):
            if line>200002:raise ValueError("Over 200,000 rows; split by source batch")
            if None in row:raise ValueError(f"line {line}: extra columns")
            direction=(row["direction"] or "").strip().lower()
            period=(row["period"] or "").strip()
            hs=(row["hs_code"] or "").strip()
            country=(row["partner_country"] or "").strip()
            source_url=(row["source_url"] or "").strip()
            locator=(row["source_locator"] or "").strip()
            if direction not in DIRECTIONS:raise ValueError(f"line {line}: exports or imports required")
            if not re.fullmatch(r"20[0-9]{2}(?:-(?:0[1-9]|1[0-2]))?",period):raise ValueError(f"line {line}: YYYY or YYYY-MM required")
            if not re.fullmatch(r"[0-9]{2}(?:[0-9]{2}){0,4}",hs):raise ValueError(f"line {line}: HS2/4/6/8/10 required, preserve leading zeros")
            if len(country)<2 or len(country)>100 or country.upper() in INVALID_PARTNERS or re.search(r"[<>]",country):
                raise ValueError(f"line {line}: named individual partner required, not aggregate/placeholder")
            if not allowed_url(source_url):raise ValueError(f"line {line}: official BPS HTTPS source URL required")
            if len(locator)<10 or len(locator)>250:raise ValueError(f"line {line}: exact original query/table/page locator required")
            value=parse_decimal(row["value_usd"],"value_usd")
            weight=parse_decimal(row["net_weight_kg"],"net_weight_kg",allow_blank=True)
            if value==0:raise ValueError(f"line {line}: ambiguous zero; exclude unobserved cells instead")
            k=(direction,period,hs,country.casefold())
            if k in keys:raise ValueError(f"line {line}: duplicate HS-partner-period-direction")
            keys.add(k)
            observations.append({
              "direction":direction,"period":period,"hs_code":hs,"hs_level":len(hs),"hs_version":"HS2022",
              "partner_country":country,"value_usd":float(value),"net_weight_kg":float(weight) if weight is not None else None,
              "value_basis":DIRECTIONS[direction],"source_url":source_url,"source_locator":locator
            })
    if not observations:raise ValueError("No observed bilateral cells; do not promote blank dataset")
    observations.sort(key=lambda x:(x["period"],x["direction"],x["hs_code"],x["partner_country"]))
    return observations

def promote(csv_path,observations,approval_path):
    if not approval_path:return {"status":"pending_manual_primary_review","review_status":"not_reviewed","review":None}
    obj=json.loads(approval_path.read_text(encoding="utf-8"))
    digest=hashlib.sha256(csv_path.read_bytes()).hexdigest()
    if obj.get("source_csv_sha256")!=digest:raise ValueError("Approval SHA256 mismatches exact CSV bytes")
    if obj.get("approved_cell_count")!=len(observations):raise ValueError("Approval row count mismatch")
    if obj.get("independent_cell_checks")!=len(observations):
        raise ValueError("Every cell must be independently checked against its primary BPS query/table")
    if not isinstance(obj.get("reviewed_by"),str) or len(obj["reviewed_by"].strip())<3:
        raise ValueError("Named independent reviewer required")
    if not isinstance(obj.get("review_note"),str) or len(obj["review_note"].strip())<20:
        raise ValueError("Substantive review note required")
    return {"status":"verified","review_status":"primary_cell_review_attested",
            "review":{"reviewed_by":obj["reviewed_by"].strip(),"review_note":obj["review_note"].strip(),
                      "approved_cell_count":len(observations),"source_csv_sha256":digest}}

def run(csv_path,output_path,approval_path=None):
    if not csv_path.is_file():raise ValueError("Source CSV not found")
    rows=read_observations(csv_path)
    review=promote(csv_path,rows,approval_path)
    document={
      "schema":SCHEMA,**review,
      "as_of":datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
      "publisher":"Badan Pusat Statistik (BPS)",
      "primary_query_url":"https://www.bps.go.id/id/exim",
      "hs_classification":"HS 2022","unit":"USD",
      "value_basis":DIRECTIONS,
      "source_csv_sha256":hashlib.sha256(csv_path.read_bytes()).hexdigest(),
      "verified_cells":len(rows) if review["status"]=="verified" else 0,
      "candidate_cells":len(rows),
      "observations":rows if review["status"]=="verified" else [],
      "candidate_observations":rows if review["status"]!="verified" else [],
      "caveat":"Only individually documented HS×named-country×period observations. No unverified residual and no allocation from national marginals."
    }
    output_path.parent.mkdir(parents=True,exist_ok=True)
    output_path.write_text(json.dumps(document,ensure_ascii=False,indent=2,allow_nan=False)+"\n",encoding="utf-8")
    return document

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--csv",required=True,type=Path,help="Normalized official BPS-query transcription, as documented")
    p.add_argument("--output",default=Path("data/bps-hs-partner-matrix.json"),type=Path)
    p.add_argument("--approval",type=Path,help="Explicit independent cell-review attestation; absent means staging only")
    args=p.parse_args()
    try:
        result=run(args.csv,args.output,args.approval)
    except (ValueError,OSError,KeyError,json.JSONDecodeError) as e:
        p.exit(2,f"FAIL CLOSED: {e}\n")
    print(f"{result['status']}: {result['candidate_cells']} candidate BPS source cells, {result['verified_cells']} published verified cells")
