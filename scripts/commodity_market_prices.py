#!/usr/bin/env python3
"""SLI public commodity benchmark snapshots (not licensed live trading data).

Indicative futures: Yahoo Finance public, unofficial, use only where provider permits.
Monthly reference: IMF primary commodity prices republished via FRED (delayed).
Never equate COMEX copper with LME copper, spot Brent with futures or Australian
thermal coal with Indonesian ESDM HBA. A missing quote stays missing.
"""
from __future__ import annotations
import csv, datetime as dt, io, json, math, os, time, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"commodity-market-prices.json"
UTC=dt.timezone.utc
FUTURES={
 "brent_future":{"ticker":"BZ=F","name":"Brent crude futures","sector":"energy","unit":"USD/bbl","market":"ICE Brent continuous"},
 "wti_future":{"ticker":"CL=F","name":"WTI crude futures","sector":"energy","unit":"USD/bbl","market":"NYMEX WTI continuous"},
 "natural_gas_future":{"ticker":"NG=F","name":"US natural gas futures","sector":"energy","unit":"USD/MMBtu","market":"NYMEX Henry Hub continuous"},
 "copper_future":{"ticker":"HG=F","name":"Copper futures (COMEX)","sector":"minerals","unit":"USD/lb","market":"COMEX HG; not LME copper"},
 "gold_future":{"ticker":"GC=F","name":"Gold futures","sector":"minerals","unit":"USD/troy oz","market":"COMEX GC"},
 "silver_future":{"ticker":"SI=F","name":"Silver futures","sector":"minerals","unit":"USD/troy oz","market":"COMEX SI"},
}
# Historical IMF reference prices, MONTHLY observations, not current spot prices.
MONTHLY={
 "nickel":{"series":"PNICKUSDM","name":"Nickel · IMF monthly","sector":"minerals","unit":"USD/metric ton"},
 "copper_monthly":{"series":"PCOPPUSDM","name":"Copper · IMF monthly","sector":"minerals","unit":"USD/metric ton"},
 "aluminium":{"series":"PALUMUSDM","name":"Aluminium · IMF monthly","sector":"minerals","unit":"USD/metric ton"},
 "tin":{"series":"PTINUSDM","name":"Tin · IMF monthly","sector":"minerals","unit":"USD/metric ton"},
 "coal_australia":{"series":"PCOALAUUSDM","name":"Coal Australia · IMF monthly","sector":"energy","unit":"USD/metric ton"},
 "palm_oil":{"series":"PPOILUSDM","name":"Palm oil · IMF monthly","sector":"energy","unit":"USD/metric ton"},
}
MARKET_URL="https://finance.yahoo.com/quote/"
FRED_URL="https://fred.stlouisfed.org/series/"
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; Strategic Latitude public research; dated citations)","Accept":"application/json,text/csv,*/*"}

def get_json(url):
 request=urllib.request.Request(url,headers=HEADERS)
 with urllib.request.urlopen(request,timeout=20) as res:
  return json.loads(res.read(1600000).decode("utf-8"))

def get_text(url):
 request=urllib.request.Request(url,headers=HEADERS)
 with urllib.request.urlopen(request,timeout=18) as res:
  return res.read(1200000).decode("utf-8-sig")

def valid_price(val):
 return isinstance(val,(float,int)) and not isinstance(val,bool) and math.isfinite(val) and 0 < val < 1_000_000_000

def futures_snapshot(key,cfg,now):
 ticker=cfg["ticker"]
 url="https://query1.finance.yahoo.com/v8/finance/chart/"+urllib.parse.quote(ticker,safe="")+"?range=1mo&interval=1d"
 js=get_json(url)
 result=((js.get("chart") or {}).get("result") or [None])[0]
 if not result:raise ValueError("No quote returned")
 meta=result.get("meta") or {}
 closes=((result.get("indicators") or {}).get("quote") or [{}])[0].get("close") or []
 timestamps=result.get("timestamp") or []
 values=[(int(t),float(v)) for t,v in zip(timestamps,closes) if valid_price(v)]
 if not values:raise ValueError("No dated futures closes")
 values=sorted(set(values),key=lambda x:x[0])
 quote=meta.get("regularMarketPrice")
 quote_ts=meta.get("regularMarketTime")
 # Preferred source is exchange-clock metadata, NOT collector's current clock.
 if not valid_price(quote) or not isinstance(quote_ts,(int,float)):
  ts,value=values[-1]
 else:
  ts,value=int(quote_ts),float(quote)
 elapsed=(now-dt.datetime.fromtimestamp(ts,UTC)).total_seconds()
 if elapsed < -180 or elapsed > 8*86400:raise ValueError("Stale/future market quote withheld")
 prev=float(meta["chartPreviousClose"]) if valid_price(meta.get("chartPreviousClose")) else None
 if prev is None and len(values)>=2:prev=values[-2][1]
 # Some Yahoo metadata can mix previous session of expiring contracts;
 # change is labelled indicative, never marketed as exchange official settlement.
 change=value-prev if prev and prev>0 else None
 hist=[{"observed_at_utc":dt.datetime.fromtimestamp(t,UTC).isoformat(),"value":round(v,6)} for t,v in values[-23:]]
 return {
  "id":key,"name":cfg["name"],"sector":cfg["sector"],"tier":"indicative_futures",
  "value":round(value,6),"previous":round(prev,6) if prev else None,
  "change":round(change,6) if change is not None else None,
  "change_percent":round(100*change/prev,4) if change is not None else None,
  "unit":cfg["unit"],"observed_at_utc":dt.datetime.fromtimestamp(ts,UTC).isoformat(),
  "source":"Yahoo Finance public chart endpoint (unofficial; unlicensed redistribution)",
  "source_url":MARKET_URL+urllib.parse.quote(ticker,safe=""),"symbol":ticker,
  "market":cfg["market"],"refresh_class":"Indicative / may be delayed",
  "history":hist,"licensing_note":"For commercial real-time redistribution obtain a licensed market-data feed.",
 }

def monthly_snapshot(key,cfg,now):
 series=cfg["series"]
 url="https://fred.stlouisfed.org/graph/fredgraph.csv?id="+urllib.parse.quote(series)
 rows=[]
 for r in csv.DictReader(io.StringIO(get_text(url))):
  day=r.get("DATE") or r.get("observation_date") or ""
  raw=(r.get(series) or "").strip()
  try:
   value=float(raw)
   date=dt.date.fromisoformat(day)
  except (ValueError,TypeError):continue
  if valid_price(value) and date<=now.date():rows.append((date,value))
 if not rows:raise ValueError("No IMF monthly observations")
 rows.sort()
 day,value=rows[-1]
 if (now.date()-day).days>300:raise ValueError("Monthly source older than 300 days: withheld")
 prev=rows[-2][1] if len(rows)>1 else None
 change=value-prev if prev else None
 return {
  "id":key,"name":cfg["name"],"sector":cfg["sector"],"tier":"monthly_reference",
  "value":round(value,5),"previous":round(prev,5) if prev else None,
  "change":round(change,5) if change is not None else None,
  "change_percent":round(100*change/prev,4) if change is not None else None,
  "unit":cfg["unit"],"observation_period":day.strftime("%Y-%m"),
  "observed_at_utc":day.isoformat()+"T00:00:00+00:00",
  "source":"International Monetary Fund primary commodity prices via FRED",
  "source_url":FRED_URL+series,"symbol":series,
  "market":"IMF world monthly benchmark; historical period average",
  "refresh_class":"Monthly / delayed, NOT intraday",
  "history":[{"observed_at_utc":d.isoformat()+"T00:00:00+00:00","value":round(v,5)} for d,v in rows[-24:]],
  "licensing_note":"IMF/FRED publisher terms apply; cite original series; verify before commercial redistribution.",
 }

def main():
 now=dt.datetime.now(UTC)
 try:old=json.loads(OUT.read_text("utf-8"))
 except (ValueError,OSError):old={}
 available=[];errors={};last_good={}
 for cfg_group,reader in ((FUTURES,futures_snapshot),(MONTHLY,monthly_snapshot)):
  for key,cfg in cfg_group.items():
   try:
    available.append(reader(key,cfg,now))
   except Exception as e:
    errors[key]=type(e).__name__+": "+str(e)[:150]
    # Do NOT silently mark an old value as fresh. Reused values retain observed timestamp.
    prior=next((v for v in old.get("quotes",[]) if v.get("id")==key),None)
    if prior and valid_price(prior.get("value")):
     try:
      at=dt.datetime.fromisoformat(prior["observed_at_utc"].replace("Z","+00:00"))
      threshold=dt.timedelta(days=7 if key in FUTURES else 300)
      if dt.timedelta(0)<=now-at<=threshold:
       available.append({**prior,"availability":"last_good_source_unavailable"})
       last_good[key]=True
     except (ValueError,TypeError,KeyError):pass
   time.sleep(0.15)
 status="ok" if not errors else "partial" if available else "unavailable"
 out={
  "schema_version":1,"checked_at_utc":now.isoformat(),"status":status,
  "market_data_notice":"Futures are INDICATIVE public Yahoo quotes (may be delayed, market closed, or upstream unavailable). Not licensed live LME prices. IMF/FRED series are monthly averages, NOT intraday quotes.",
  "license_notice":"Market-data redistribution, especially for commercial products, may require provider licences. Obtain a licensed data API before promoting this as real-time trading-grade market data.",
  "cadence":"Automated every 30 minutes subject to GitHub Action scheduling. Browser checks published raw repository JSON every 3 minutes.",
  "quotes":available,"errors":errors,"fallback_ids":list(last_good),
  "official_indonesia_reference":[
   {"id":"hba","title":"Indonesia HBA · coal benchmark","period":"ESDM decree, periodically issued","value":None,"url":"https://jdih.esdm.go.id/","note":"Not Australian thermal coal futures; do not substitute IMF Australia price."},
   {"id":"hma","title":"Indonesia HMA · metal benchmark","period":"ESDM decree, periodically issued","value":None,"url":"https://jdih.esdm.go.id/","note":"Regulatory benchmark. Check relevant commodity/period and decree."},
   {"id":"icp","title":"Indonesia ICP · crude reference","period":"ESDM monthly decree","value":None,"url":"https://www.esdm.go.id/id/media-center/arsip-berita","note":"Not a real-time Brent futures contract."}
  ]
 }
 OUT.parent.mkdir(exist_ok=True)
 # Preserve previous dataset if all providers are down, but mark checking failure in metadata.
 if not available and old.get("quotes"):
  out["quotes"]=old["quotes"];out["status"]="upstream_unavailable_last_good"
  out["fallback_ids"]=[q.get("id") for q in old["quotes"]]
 OUT.write_text(json.dumps(out,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps({"status":out["status"],"count":len(out["quotes"]),"errors":errors,"checked_at_utc":out["checked_at_utc"]},ensure_ascii=False))
if __name__=="__main__":main()
