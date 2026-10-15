#!/usr/bin/env python3
import datetime as dt, importlib.util, json
from unittest.mock import patch
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("commodity",ROOT/"scripts/commodity_market_prices.py")
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
assert len(m.FUTURES)==6 and len(m.MONTHLY)==6
assert m.FUTURES["copper_future"]["unit"]=="USD/lb"
assert m.MONTHLY["copper_monthly"]["unit"]=="USD/metric ton"
assert m.MONTHLY["nickel"]["series"]=="PNICKUSDM"
assert not m.valid_price(-7) and not m.valid_price(True) and not m.valid_price(None)
now=dt.datetime(2026,10,16,5,0,tzinfo=dt.timezone.utc)
ts=int(dt.datetime(2026,10,15,21,0,tzinfo=dt.timezone.utc).timestamp())
prior=ts-86400
def yy(url):
 return {"chart":{"result":[{"timestamp":[prior,ts],"indicators":{"quote":[{"close":[4.5,4.6]}]},"meta":{"regularMarketPrice":4.62,"regularMarketTime":ts,"chartPreviousClose":4.5}}]}}
with patch.object(m,"get_json",side_effect=yy):
 v=m.futures_snapshot("copper_future",m.FUTURES["copper_future"],now)
 assert v["value"]==4.62 and abs(v["change_percent"]-2.6667)<.001
 assert v["tier"]=="indicative_futures" and len(v["history"])==2
 assert v["observed_at_utc"].startswith("2026-10-15")
assert "LME" in m.FUTURES["copper_future"]["market"]
csv="DATE,PNICKUSDM\n2026-07-01,16632.36136\n2026-08-01,17000\n2026-09-01,17500\n"
with patch.object(m,"get_text",return_value=csv):
 n=m.monthly_snapshot("nickel",m.MONTHLY["nickel"],now)
 assert n["value"]==17500 and n["change_percent"]>2
 assert n["observation_period"]=="2026-09" and n["tier"]=="monthly_reference"
assert "HBA" in m.__doc__ or "HBA" in (ROOT/"scripts/commodity_market_prices.py").read_text()
seed=json.loads((ROOT/"data/commodity-market-prices.json").read_text())
assert seed["schema_version"]==1
assert isinstance(seed.get("quotes"),list)
for x in seed["quotes"]:
 assert x["unit"] and x["source_url"].startswith("https://")
 assert x["tier"] in ("indicative_futures","monthly_reference")
 assert x["value"]>0 and x["observed_at_utc"]
assert seed["status"] in ("awaiting_first_scan","ok","partial","unavailable","upstream_unavailable_last_good")
print("PASS: commodity price units, ticker provenance, missing values, dated futures & monthly benchmark")
