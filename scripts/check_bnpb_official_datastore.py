#!/usr/bin/env python3
"""Read-only official CKAN BNPB DataStore check. NO auto promotion / no WAF bypass.

2025 publication must NOT be silently overwritten: the source has a known
1-incident earthquake total discrepancy, 28 national versus 29 province sum.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import urllib.error
import urllib.request
from urllib.parse import urlencode

ROOT=pathlib.Path(__file__).resolve().parents[1]
SNAPSHOT=ROOT/"data/sli-bnpb-provincial-2025.json"
RESOURCE="df39e8c3-117e-40fa-b518-ff1037743955"
ENDPOINT="https://data.bnpb.go.id/api/3/action/datastore_search"
FIELDS={
 "floods":"BANJIR",
 "extreme_weather":"CUACA EKSTREM",
 "volcanic_eruptions":"ERUPSI GUNUNG API",
 "coastal_events":"GELOMBANG PASANG DAN ABRASI",
 "earthquakes":"GEMPABUMI",
 "wildfires":"KEBAKARAN HUTAN DAN LAHAN",
 "droughts":"KEKERINGAN",
 "landslides":"TANAH LONGSOR",
 "tsunami":"TSUNAMI",
}
def norm_key(text):
 return re.sub(r"\s+"," ",str(text).strip().upper())

def strict_count(value,label):
 if value is None or isinstance(value,bool):
  raise ValueError(f"Missing or invalid numeric observation: {label}")
 if isinstance(value,int) and value>=0:return value
 if isinstance(value,float) and value>=0 and value.is_integer():return int(value)
 if isinstance(value,str) and re.fullmatch(r"\d+",value.strip()):return int(value.strip())
 raise ValueError(f"Non-count value in source: {label}")

def reconcile_datastore(payload,snapshot):
 if payload.get("success") is not True or not isinstance(payload.get("result"),dict):
  raise ValueError("Publisher DataStore did not return success")
 result=payload["result"]
 if result.get("resource_id") not in (None,RESOURCE):
  raise ValueError("Publisher resource identity mismatched")
 records=result.get("records")
 if not isinstance(records,list) or not 38<=len(records)<=60:
  raise ValueError("Expected complete BNPB provincial source records")
 total=result.get("total")
 if total is not None and (not isinstance(total,int) or total>len(records)):
  raise ValueError("DataStore pagination incomplete")
 current=snapshot.get("records")
 if snapshot.get("year")!=2025 or not isinstance(current,list) or len(current)!=38:
  raise ValueError("Curated SLI 2025 snapshot schema/coverage invalid")
 curated={}
 for item in current:
  code=strict_count(item.get("admin_code"),"SLI admin_code")
  if code in curated:raise ValueError("Duplicate stored province codes")
  curated[code]=item
 source={}
 for row in records:
  if not isinstance(row,dict):raise ValueError("Invalid source record")
  fields={norm_key(k):v for k,v in row.items()}
  province=str(fields.get("PROVINSI") or "").strip()
  if norm_key(province) in ("INDONESIA","TOTAL","JUMLAH","") or not province:
   continue
  code=strict_count(fields.get("KODE WILAYAH PROVINSI"),"BNPB province code")
  if code in source:raise ValueError("Duplicate source province code")
  observed={target:strict_count(fields.get(source_key),f"{province}/{source_key}")
    for target,source_key in FIELDS.items()}
  source[code]={"source_province":province,"observed":observed}
 if len(source)!=38 or set(source)!=set(curated):
  raise ValueError("Province universe differs from 38 approved administrative provinces")
 changes=[]
 for code,row in sorted(source.items()):
  s=curated[code]
  for name,v in row["observed"].items():
   old=s.get(name)
   if not isinstance(old,int):raise ValueError("Stored hazard field missing: "+name)
   if old!=v:changes.append({"province_code":code,"hazard":name,
    "previous":old,"candidate":v})
 return {"status":"matches_curated_snapshot" if not changes else "drift_pending_human_review",
  "year":2025,"resource_id":RESOURCE,"source_records":len(records),
  "matched_provinces":len(source),"observed_fields_per_province":len(FIELDS),
  "differences":changes[:150],"differences_total":len(changes),
  "auto_promote":False,
  "known_discrepancy":"The published 2025 INDONESIA earthquake total 28 differs from province sum 29; never auto-correct."}

def fetch_datastore():
 url=ENDPOINT+"?"+urlencode({"resource_id":RESOURCE,"limit":80})
 req=urllib.request.Request(url,headers={"User-Agent":"StrategicLatitudeIntelligence/1.0 dataset-provenance-check","Accept":"application/json"})
 # Exactly one official read; no public relays, no auth/cookie scraping, no redirects to other hosts.
 class NoRedirect(urllib.request.HTTPRedirectHandler):
  def redirect_request(self,req,fp,code,msg,headers,newurl):
   return None
 opener=urllib.request.build_opener(NoRedirect)
 with opener.open(req,timeout=20) as response:
  if response.status!=200:raise RuntimeError("Publisher non-200 DataStore response")
  size=response.headers.get("Content-Length")
  if size and int(size)>2_000_000:raise ValueError("Publisher response exceeds cap")
  raw=response.read(2_000_001)
  if len(raw)>2_000_000:raise ValueError("Publisher response exceeds cap")
  return json.loads(raw.decode("utf-8"))

def main():
 cli=argparse.ArgumentParser()
 cli.add_argument("--out",default="artifacts/bnpb-ckan-source-check.json")
 a=cli.parse_args()
 out=ROOT/a.out
 data={"schema":"sli-bnpb-2025-official-ckan-source-check-v1",
  "checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
  "publisher":"BNPB","endpoint":ENDPOINT,
  "resource_id":RESOURCE,"no_numeric_publication":True,"auto_promote":False}
 code=1
 try:
  current=json.loads(SNAPSHOT.read_text(encoding="utf-8"))
  candidate=fetch_datastore()
  data.update(reconcile_datastore(candidate,current))
  code=0 if data["status"]=="matches_curated_snapshot" else 2
 except urllib.error.HTTPError as e:
  data.update(status="official_publisher_access_blocked" if e.code in (401,403,429) else "official_source_unavailable",
              http_status=e.code,review_required=True)
 except (urllib.error.URLError,TimeoutError,OSError) as e:
  data.update(status="official_source_unavailable",error_type=type(e).__name__,review_required=True)
 except (ValueError,TypeError,KeyError,json.JSONDecodeError) as e:
  data.update(status="publisher_schema_or_data_review_required",error_type=type(e).__name__,review_required=True)
 out.parent.mkdir(parents=True,exist_ok=True)
 out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("BNPB official DataStore:",data["status"],"differences",data.get("differences_total","not_checked"))
 print("Curated observation data are unchanged; human review needed for any drift.")
 return code

if __name__=="__main__":
 raise SystemExit(main())
