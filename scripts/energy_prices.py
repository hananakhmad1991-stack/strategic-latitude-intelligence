#!/usr/bin/env python3
"""Fetch public FRED daily EIA price series. Never represent old observations as live."""
import csv,datetime as dt,io,json,urllib.request
from pathlib import Path
SERIES={"brent":{"id":"DCOILBRENTEU","label":"Brent spot","unit":"USD/bbl"},"wti":{"id":"DCOILWTICO","label":"WTI spot","unit":"USD/bbl"},"henry_hub":{"id":"DHHNGSP","label":"Henry Hub natural gas","unit":"USD/MMBtu"}}
def retrieve(series):
 url="https://fred.stlouisfed.org/graph/fredgraph.csv?id="+series
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-Open-Source-Research/1.0","Accept":"text/csv"})
 with urllib.request.urlopen(req,timeout=25) as response:
  csvtext=response.read(3000000).decode("utf-8-sig")
 rows=list(csv.DictReader(io.StringIO(csvtext)))
 available=[]
 for row in rows:
  raw=row.get(series,"").strip()
  if raw in (".",""):continue
  try:available.append((row.get("DATE",row.get("observation_date")),float(raw)))
  except (ValueError,TypeError):continue
 if not available or not available[-1][0]:raise ValueError("No usable dated observations")
 return available[-1]
def main():
 now=dt.datetime.now(dt.timezone.utc);output={"checked_at_utc":now.isoformat(),"source":"FRED (EIA energy series), downloaded from public FRED graph CSV","data":{},"errors":{},"disclaimer":"Delayed historical observations, not real-time executable quotes; date is the observation date."}
 for key,config in SERIES.items():
  try:
   day,value=retrieve(config["id"])
   age=(now.date()-dt.date.fromisoformat(day)).days
   if age<0 or age>12:raise ValueError("Latest available observation is stale ("+str(age)+" days), withholding.")
   output["data"][key]={"value":value,"date":day,"unit":config["unit"],"series":config["id"],"label":config["label"],"age_days":age,"source_url":"https://fred.stlouisfed.org/series/"+config["id"]}
  except Exception as e:output["errors"][key]=type(e).__name__+": "+str(e)[:180]
 Path("data").mkdir(exist_ok=True);p=Path("data/energy-prices.json")
 if output["data"]:
  p.write_text(json.dumps(output,indent=2)+"\n",encoding="utf-8")
 else:
  print("No validated new observations. Preserving existing published dataset.")
 print(json.dumps(output,indent=2))
if __name__=="__main__":main()
