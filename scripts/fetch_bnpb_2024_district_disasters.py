#!/usr/bin/env python3
"""Read-only official BNPB CKAN 2024 district disaster-type resource collector.
Preserve publication granularity (district-year) and never convert missing cells to 0.
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request,urlopen

RESOURCE="a4daec53-1119-43ef-b05e-00ec3a4c42a4"
RESOURCE_PAGE="https://data.bnpb.go.id/dataset/data-bencana-indonesia/resource/"+RESOURCE
API="https://data.bnpb.go.id/api/3/action/datastore_search"
TYPES={
 "BANJIR":"flood_events",
 "CUACA EKSTREM":"extreme_weather_events",
 "ERUPSI GUNUNG API":"volcano_events",
 "GELOMBANG PASANG DAN ABRASI":"coastal_events",
 "GEMPABUMI":"earthquake_events",
 "KEBAKARAN HUTAN DAN LAHAN":"wildfire_events",
 "KEKERINGAN":"drought_events",
 "TANAH LONGSOR":"landslide_events",
 "TSUNAMI":"tsunami_events"
}
def get_json(offset):
    url=API+"?"+urlencode({"resource_id":RESOURCE,"offset":offset,"limit":100})
    request=Request(url,headers={"User-Agent":"SLI-scientific-evidence-read-only/1.0","Accept":"application/json"})
    with urlopen(request,timeout=32) as res:
        if res.geturl().split("/")[2].lower()!="data.bnpb.go.id":raise ValueError("Unexpected BNPB redirect host")
        raw=res.read(1000000)
        if len(raw)>=1000000:raise ValueError("Unexpectedly large datastore response")
    data=json.loads(raw.decode("utf-8"))
    if data.get("success") is not True or not isinstance(data.get("result",{}).get("records"),list):
        raise ValueError("BNPB datastore returned invalid payload")
    return data["result"]
def numeric(v):
    if v is None or str(v).strip() in ("","-","N/A","nan"):return None
    if isinstance(v,bool):raise ValueError("Boolean disaster count")
    try:f=float(v)
    except (TypeError,ValueError):raise ValueError("Non-numeric disaster count "+repr(v)[:60])
    if not f.is_integer() or not 0<=f<=100000:raise ValueError("Invalid disaster count "+repr(v))
    return int(f)
def main():
    raw=[];total=None
    for offset in range(0,1000,100):
        v=get_json(offset)
        if total is None:total=v.get("total")
        raw.extend(v["records"])
        if len(v["records"])<100 or (isinstance(total,int) and len(raw)>=total):break
    if len(raw)<450 or len(raw)>750:
        raise ValueError("Unexpected BNPB district resource coverage: "+str(len(raw)))
    records=[];seen=set()
    for x in raw:
        name=str(x.get("Nama Kabupaten/Kota") or "").strip()
        raw_code=x.get("Kode Wilayah Kabupaten / Kota")
        code=str(raw_code).strip().replace(".0","") if raw_code is not None else ""
        if name.upper() in ("INDONESIA","TOTAL","JUMLAH"):continue
        if not name or not code or code.lower() in ("nan","none"):continue
        if code in seen:raise ValueError("Duplicate district code "+code)
        seen.add(code)
        row={"admin_code":code,"district":name}
        for field,to in TYPES.items():row[to]=numeric(x.get(field))
        lat=x.get("Latitude");lon=x.get("Longitude")
        row["latitude"]=float(lat) if lat not in (None,"") else None
        row["longitude"]=float(lon) if lon not in (None,"") else None
        if row["latitude"] is not None and not -12<=row["latitude"]<=7:raise ValueError("Unreasonable Indonesia latitude")
        if row["longitude"] is not None and not 94<=row["longitude"]<=142:raise ValueError("Unreasonable Indonesia longitude")
        records.append(row)
    if len(records)<450:raise ValueError("Too few districts after filtering: "+str(len(records)))
    missing={v:sum(rec[v] is None for rec in records) for v in TYPES.values()}
    data={
       "schema":"sli-bnpb-district-2024-types-v1",
       "year":2024,"geography":"Indonesian kabupaten/kota, NOT provincial or asset",
       "publisher":"BNPB Pusat Data Informasi dan Komunikasi Kebencanaan",
       "official_resource_url":RESOURCE_PAGE,"ckan_resource_id":RESOURCE,
       "retrieved_at":datetime.now(timezone.utc).isoformat(),
       "status":"official_bnpb_original_2024_resource_candidate_pending_data_editor_review",
       "records":records,"district_count":len(records),"missing_counts_by_type":missing,
       "definition":"Count of BNPB reported events by disaster type and district in calendar year 2024, not population exposure or probabilistic asset hazard.",
       "known_limitations":"District code/administrative changes, source event revision, historical year 2024; zero means zero as published only if cell explicitly says 0, missing stays null.",
       "climate_indicators_crosswalk":[
        {"id":"CE-002","measures":["flood_events","coastal_events"],"coverage":"district/year 2024","boundary":"historical event counts only"},
        {"id":"CE-006","measures":["wildfire_events"],"coverage":"district/year 2024","boundary":"fire-event counts, NOT burned area or financial loss"},
        {"id":"CE-008","measures":["landslide_events"],"coverage":"district/year 2024","boundary":"historical occurrence counts only"}
       ]}
    out=Path("artifacts/sli-bnpb-district-2024-review.json");out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("BNPB_DISTRICT_SOURCE_OK districts="+str(len(records))+" missing="+json.dumps(missing,separators=(",",":")))
    print("BNPB_DISTRICT_SOURCE_RESOURCE="+RESOURCE_PAGE)
if __name__=="__main__":main()
