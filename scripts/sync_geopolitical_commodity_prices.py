#!/usr/bin/env python3
"""Build multi-commodity monthly observations (as available from 1960) from World Bank Pink Sheet.
No imputation, no invented 2026 observations; write only after full parse and validation.
"""
from __future__ import annotations
import datetime as dt
import io
import json
import re
import sys
import time
import urllib.request
from pathlib import Path
from openpyxl import load_workbook

URLS = [
 "https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx",
 "https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/related/CMO-Historical-Data-Monthly.xlsx",
 "https://thedocs.worldbank.org/en/doc/5d903e848db1d1b83e0ec8f744e55570-0350012021/related/CMO-Historical-Data-Monthly.xlsx"
]
TARGET = Path("data/sli-geopolitical-commodity-prices.json")
# Display only source-published benchmarks. Missing years stay null, not interpolated.
# These are World Bank Pink Sheet column labels; units follow World Bank commodity definitions.
COLS = {
 "brent": [r"^crude oil,? brent$",r"^crude oil - brent$"],
 "wti": [r"^crude oil,? wti$",r"^crude oil,? west texas intermediate$"],
 "dubai": [r"^crude oil,? dubai$"],
 "oil_average": [r"^crude oil,? average$"],
 "coal_australia": [r"^coal,? australian$",r"^coal,? australia$"],
 "coal_south_africa": [r"^coal,? south african$",r"^coal,? south africa$"],
 "gas_us": [r"^natural gas,? us$",r"^natural gas,? u\\.?s\\.?$"],
 "gas_europe": [r"^natural gas,? europe$",r"^natural gas,? european$"],
 "lng_japan": [r"^liquefied natural gas,? japan$",r"^natural gas,? japan$"],
 "gold": [r"^gold$"],
 "silver": [r"^silver$"],
 "copper": [r"^copper$"],
 "nickel": [r"^nickel$"],
 "tin": [r"^tin$"],
 "aluminum": [r"^aluminum$",r"^aluminium$"],
 "iron_ore": [r"^iron ore$"],
 "zinc": [r"^zinc$"],
 "lead": [r"^lead$"],
 "cobalt": [r"^cobalt$"],
 # Global agricultural/food references from the SAME World Bank Pink Sheet monthly workbook.
 "rice_thai_5": [r"^rice,?\s*thai,?\s*5\s*%$",r"^rice,?\s*thai,?\s*5 percent$"],
 "wheat_us_hrw": [r"^wheat,?\s*(?:us|u\.s\.),?\s*hrw$"],
 "maize": [r"^maize$",r"^corn,?\s*us$"],
 "soybeans": [r"^soybeans?$"],
 "palm_oil": [r"^palm\s*oil$"],
 "sugar_world": [r"^sugar,?\s*world$"],
 "urea": [r"^urea$"],
 "coffee_robusta": [r"^coffee,?\s*robusta$"],
 "cocoa": [r"^cocoa$"],
}
UNITS = {
 "brent":"USD/bbl","wti":"USD/bbl","dubai":"USD/bbl","oil_average":"USD/bbl",
 "coal_australia":"USD/mt","coal_south_africa":"USD/mt",
 "gas_us":"USD/mmbtu","gas_europe":"USD/mmbtu","lng_japan":"USD/mmbtu",
 "gold":"USD/troy oz","silver":"USD/troy oz",
 "copper":"USD/mt","nickel":"USD/mt","tin":"USD/mt",
 "aluminum":"USD/mt","iron_ore":"USD/dmt","zinc":"USD/mt","lead":"USD/mt","cobalt":"USD/mt",
 "rice_thai_5":"USD/mt","wheat_us_hrw":"USD/mt","maize":"USD/mt",
 "soybeans":"USD/mt","palm_oil":"USD/mt","sugar_world":"USD/kg","urea":"USD/mt",
 "coffee_robusta":"USD/kg","cocoa":"USD/kg"
}
# Cobalt and other optional series are omitted automatically if source lacks them.

def month_of(value):
 if isinstance(value, (dt.datetime, dt.date)):
  return f"{value.year:04d}-{value.month:02d}"
 if isinstance(value, str):
  s=value.strip()
  m=re.match(r"^(19\d{2}|20\d{2})\s*[Mm/\-]\s*(\d{1,2})$",s)
  if m and 1<=int(m.group(2))<=12: return f"{int(m.group(1)):04d}-{int(m.group(2)):02d}"
  m=re.match(r"^(19\d{2}|20\d{2})-(\d\d)-\d\d",s)
  if m: return f"{m.group(1)}-{m.group(2)}"
 return None

def download():
 err=None
 for url in URLS:
  for attempt in range(2):
   try:
    request=urllib.request.Request(url,headers={"User-Agent":"SLI-research-data/1.0 (World Bank public statistics)","Accept":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*"})
    with urllib.request.urlopen(request,timeout=50) as resp:
     blob=resp.read(12000000)
    if blob[:2]!=b"PK": raise ValueError("Expected XLSX ZIP, not HTML")
    return blob,url
   except Exception as exc:
    err=exc
    if attempt==0: time.sleep(2)
 raise RuntimeError(f"World Bank monthly workbook unavailable: {err}")

def find_header(sheet):
 for r,values in enumerate(sheet.iter_rows(min_row=1,max_row=min(sheet.max_row,25),values_only=True),1):
  cells={col: str(value or "").strip().lower() for col,value in enumerate(values[:100],1)}
  matches={}
  for key,pats in COLS.items():
   for col,label in cells.items():
    if any(re.search(p,label) for p in pats):
     matches[key]=col
     break
  if {"brent","gold","copper","nickel"}.issubset(matches):
   return r,matches
 raise RuntimeError("Pink Sheet workbook commodity headers not found")

def parse(blob):
 book=load_workbook(io.BytesIO(blob),read_only=True,data_only=True)
 best=None
 for sheet in book:
  try:
   hr,columns=find_header(sheet)
   if best is None or len(columns)>len(best[2]): best=(sheet,hr,columns)
  except RuntimeError: pass
 if not best: raise RuntimeError("No sheet with expected World Bank commodity columns")
 sheet,header,columns=best
 items={}
 today=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m")
 for row in sheet.iter_rows(min_row=header+1,values_only=True):
  month=month_of(row[0])
  if not month and len(row)>1: month=month_of(row[1])
  if not month or month < "1960-01" or month > today: continue
  obj={"month":month}
  for key,column in columns.items():
   raw=row[column-1] if column<=len(row) else None
   try:
    numeric=float(raw)
    if not (numeric>0 and numeric<1000000): continue
    obj[key]=round(numeric,4)
   except (ValueError,TypeError): continue
  if len(obj)>1: items[month]=obj
 observations=[items[k] for k in sorted(items)]
 if len(observations)<600 or observations[0]["month"]>"1960-03":
  raise RuntimeError(f"Incomplete World Bank monthly data: {len(observations)} valid rows")
 cutoff=(dt.date.today().replace(day=1)-dt.timedelta(days=125)).strftime("%Y-%m")
 if observations[-1]["month"]<cutoff:
  raise RuntimeError(f"World Bank source stale: {observations[-1]['month']} < {cutoff}")
 return observations, columns

def main():
 blob,url=download()
 obs,columns=parse(blob)
 # Preserve full historical coverage for existing metals/energy plus globally standard
 # food benchmarks. Never manufacture missing observations or silent currency conversion.
 required_food={"rice_thai_5","wheat_us_hrw","maize","soybeans","palm_oil","sugar_world"}
 missing=required_food-set(columns)
 if missing: raise RuntimeError("World Bank food benchmarks missing; refusing incomplete update: "+", ".join(sorted(missing)))
 for key in required_food:
  n=sum(1 for o in obs if key in o)
  if n<350: raise RuntimeError(f"Food benchmark {key}: only {n} monthly observations")
 first_last={}
 for key in columns:
  available=[o["month"] for o in obs if key in o]
  if available: first_last[key]={"first":available[0],"last":available[-1],"count":len(available),"unit":UNITS[key]}
 out={
  "schema_version":"sli-geopolitical-commodity-prices-v2",
  "source":"World Bank Commodity Markets — Pink Sheet, monthly historical data",
  "source_url":url,
  "period":"Monthly, nominal US dollars, no seasonal adjustment",
  "earliest_month":obs[0]["month"],
  "latest_month":obs[-1]["month"],
  "unit_by_series":{k:UNITS[k] for k in first_last},
  "series_coverage":first_last,
  "methodology":"World Bank Pink Sheet monthly nominal benchmark quotations, NOT Indonesian consumer/farmgate prices. Food benchmarks: Thai 5% rice, US HRW wheat, maize, soybeans, palm oil, world sugar and urea. USD/mt vs USD/kg retain original physical units. Missing observations omitted, no interpolation; benchmark coverage varies by commodity and early political events predate price data.",
  "observations":obs
 }
 encoded=json.dumps(out,ensure_ascii=False,separators=(",",":"))+"\n"
 if TARGET.exists() and TARGET.read_text(encoding="utf-8")==encoded:
  print(f"Unchanged through {obs[-1]['month']}")
  return
 TARGET.parent.mkdir(parents=True,exist_ok=True)
 TARGET.write_text(encoded,encoding="utf-8")
 print(f"Updated {len(obs)} World Bank monthly observations from {obs[0]['month']} to {obs[-1]['month']} ({url})")

if __name__=="__main__":
 try: main()
 except Exception as e:
  print(f"PRICE SYNC FAILED: {e}",file=sys.stderr)
  sys.exit(1)
