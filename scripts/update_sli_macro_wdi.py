#!/usr/bin/env python3
"""World Bank WDI annual macro history sync, preserves old values on source failure."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone
from pathlib import Path
import json, requests, time

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/"data/sli-macro-worldbank-config.json"
OUT=ROOT/"data/sli-macro-worldbank-history.json"
cfg=json.loads(CONFIG.read_text(encoding="utf-8"))
prev=json.loads(OUT.read_text(encoding="utf-8"))
now=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
headers={"User-Agent":"SLI-Independent-Research/1.0 (open public World Bank WDI data)","Accept":"application/json"}
def fetch_indicator(row):
    url=f"{cfg['api_base']}{row['code']}"
    error=None
    for attempt in range(3):
        try:
            r=requests.get(url,params={"format":"json","per_page":150,"date":"1990:2026"},headers=headers,timeout=(10,40))
            r.raise_for_status()
            j=r.json()
            if not isinstance(j,list) or len(j)!=2 or not isinstance(j[1],list):
                raise ValueError("Unexpected WDI response schema")
            points=[]
            for obj in j[1]:
                if not isinstance(obj,dict) or obj.get("value") is None:
                    continue
                date=str(obj.get("date",""))
                if not date.isdigit() or len(date)!=4:
                    continue
                value=obj["value"]
                if isinstance(value,bool) or not isinstance(value,(int,float)):
                    continue
                points.append({"year":int(date),"value":float(value)*row.get("scale",1)})
            points.sort(key=lambda x:x["year"])
            if not points:
                raise ValueError("API returned no numeric annual observations")
            return row["id"],{
                "id":row["id"],"indicator":row["code"],"name":row["label"],"category":row["category"],"unit":row["unit"],
                "source":"World Bank WDI","source_url":url+"?format=json",
                "frequency":"annual","points":points,"first_year":points[0]["year"],"last_year":points[-1]["year"],
                "data_status":"source_api_verified_series","last_verified_utc":now},None
        except Exception as e:
            error=str(e)[:210]
            time.sleep((attempt+1)*2)
    return row["id"],None,error
series=dict(prev.get("series",{}))
statuses={}
with ThreadPoolExecutor(max_workers=4) as exe:
    fs=[exe.submit(fetch_indicator,item) for item in cfg["indicators"]]
    for f in as_completed(fs):
        id,record,error=f.result()
        if record is not None:
            series[id]=record
            statuses[id]={"status":"ok","last_year":record["last_year"],"observations":len(record["points"])}
            print(f"{id}: {len(record['points'])} years to {record['last_year']}")
        else:
            statuses[id]={"status":"error","error":error,"preserved_prior":id in series}
            print(f"{id}: ERROR {error}")
ok=sum(v["status"]=="ok" for v in statuses.values())
out={
    "schema_version":"1.0","provider":"World Bank WDI","country":"IDN",
    "last_attempt_utc":now,
    "last_success_utc":now if ok else prev.get("last_success_utc"),
    "status":"updated" if ok==len(cfg["indicators"]) else ("partial_update" if ok else "all_sources_failed"),
    "attempted_indicators":len(cfg["indicators"]),"successful_indicators_this_run":ok,
    "api_docs":"https://datahelpdesk.worldbank.org/knowledgebase/articles/898599-indicator-api-queries",
    "notes":["Annual WDI observations do not describe current-month official national release dates.",
             "Unemployment is ILO modeled WDI, not February BPS Sakernas.",
             "Gini WDI is 0-100 and cannot be drawn directly on BPS 0-1 scale.",
             "World Bank poverty line definitions may differ; read indicator code and source notes.",
             "WDI fiscal balance/debt data can be sparse; unavailable is not zero."],
    "indicator_status":statuses,"series":series
}
OUT.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Finished: {ok}/{len(cfg['indicators'])} successful, {len(series)} series available")
if ok==0:
    raise SystemExit("No WDI series updated; do not publish as successful source refresh")
