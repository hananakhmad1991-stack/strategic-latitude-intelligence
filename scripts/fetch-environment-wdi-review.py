#!/usr/bin/env python3
"""Retrieve World Bank WDI Indonesia environment metrics as a REVIEW CANDIDATE ONLY.
No automatic git commits; preserves exact numeric observations, original years and source URL.
"""
import base64
import json
import pathlib
import urllib.parse
import urllib.request
from datetime import datetime, timezone

INDICATORS = {
    "AG.LND.FRST.ZS": {"name": "Forest area", "unit": "% of land area", "topic": "Forests", "scope": "land cover (not deforestation alerts)"},
    "EN.ATM.CO2E.PC": {"name": "CO2 emissions per capita", "unit": "metric tons per person", "topic": "Emissions", "scope": "fossil-fuel and industrial CO2 per capita; check latest WDI metadata"},
    "EN.ATM.PM25.MC.M3": {"name": "PM2.5 mean annual exposure", "unit": "micrograms per cubic meter", "topic": "Air quality", "scope": "modelled population exposure; not live station AQI"},
    "EG.FEC.RNEW.ZS": {"name": "Renewable energy consumption", "unit": "% total final energy consumption", "topic": "Transition", "scope": "total final energy demand, NOT installed generation capacity or RUPTL target"},
}
def load(code):
    url = "https://api.worldbank.org/v2/country/IDN/indicator/" + code + "?format=json&per_page=100"
    request = urllib.request.Request(url, headers={"User-Agent": "SLI-worldbank-public-data-review/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=22) as response:
        if response.geturl().split("/")[2].lower() != "api.worldbank.org":
            raise ValueError("unexpected World Bank redirect host")
        raw = response.read(1500000)
        if len(raw) >= 1500000:
            raise ValueError("World Bank response too large")
    parsed = json.loads(raw.decode("utf-8"))
    if not isinstance(parsed, list) or len(parsed) != 2 or not isinstance(parsed[1], list):
        raise ValueError("invalid World Bank WDI API response")
    series = []
    for row in parsed[1]:
        year = row.get("date")
        value = row.get("value")
        if not (isinstance(year,str) and len(year)==4 and year.isdigit() and 2000<=int(year)<=2026):
            continue
        if value is None:
            continue
        if not isinstance(value,(int,float)) or not (float("-inf")<float(value)<float("inf")):
            raise ValueError("invalid WDI numeric value")
        if row.get("countryiso3code") != "IDN":
            raise ValueError("response contained non-IDN country data")
        series.append({"year":int(year), "value":value, "publisher_observation": "World Bank WDI"})
    series.sort(key=lambda x:x["year"])
    if len(series) < 8:
        raise ValueError(code+" has fewer than eight historical observations")
    return url, series

data={"schema":"sli-indonesia-environment-worldbank-wdi-candidate-v1",
      "collected_at":datetime.now(timezone.utc).isoformat(),
      "publisher":"World Bank World Development Indicators",
      "geography":"Indonesia (IDN)",
      "status":"candidate_original_api_checked_pending_editorial_review",
      "observations":[], "indicators":[], "review_warning":"Secondary World Bank cross-country indicators are dated annual model/statistical series; do NOT interpret as province forecasts, live fire alerts or 2026 observations."}
for code,detail in INDICATORS.items():
    url,series=load(code)
    data["indicators"].append({"indicator_code":code,**detail,
        "unit_of_observation":"Indonesia nation-year", "api_url":url,
        "latest_year":series[-1]["year"], "latest_value":series[-1]["value"],
        "coverage_years":[series[0]["year"],series[-1]["year"]], "data_status":"source_api_series_extracted"})
    data["observations"].extend({"indicator_code":code,**row} for row in series)
    print("WORLD_BANK_WDI_SOURCE_OK "+code+" observations="+str(len(series))+
          " latest="+str(series[-1]["year"])+":"+str(series[-1]["value"]))
pathlib.Path("artifacts").mkdir(exist_ok=True)
out=pathlib.Path("artifacts/sli-indonesia-environment-wdi-review.json")
out.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("WDI_ENV_JSON_BASE64="+base64.b64encode(json.dumps(data,ensure_ascii=False,separators=(",",":")).encode()).decode())
