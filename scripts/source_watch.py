#!/usr/bin/env python3
"""SLI public-source release watcher. No AI, scraping behind logins, or automatic data publication."""
import datetime as dt
import html
import json
import os
import re
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

SOURCES = [
 {"id":"esdm_heesi","publisher":"ESDM","title":"Handbook of Energy and Economic Statistics","url":"https://www.esdm.go.id/en/publication/handbook-of-energy-economic-statistics-of-indonesia-HEESI","match":r"Handbook of Energy and Economic Statistics of Indonesia\s*(20\d{2})","alert_year":2026},
 {"id":"bps_imports","publisher":"BPS","title":"Foreign Trade Statistics (Imports)","url":"https://www.bps.go.id/id/publication/2026/08/04/29900d4157c9ba7ad7fc72ea/statistik-perdagangan-luar-negeri-indonesia-impor-2025","match":r"Statistik Perdagangan Luar Negeri Indonesia Impor\s*(20\d{2})","alert_year":2026},
 {"id":"den_index","publisher":"ESDM / DEN","title":"National Energy Security Index (DEN)","url":"https://www.esdm.go.id/id/media-center/arsip-berita/indeks-ketahanan-energi-indonesia-masuk-kategori-tahan","match":r"Indeks Ketahanan Energi(?: Nasional)?\s*(?:Indonesia)?\s*(?:tahun)?\s*(20\d{2})","alert_year":2026},
 {"id":"wec_trilemma","publisher":"World Energy Council","title":"World Energy Trilemma Indonesia","url":"https://trilemma.worldenergy.org/#!/country-profile?country=Indonesia&year=2023","match":r"World Energy Trilemma(?: Index)?\s*(20\d{2})","alert_year":2026}
]
class Extract(HTMLParser):
 def __init__(self): super().__init__(); self.text=[]
 def handle_data(self,data): self.text.append(data)
def fetch(url):
 request=urllib.request.Request(url,headers={"User-Agent":"SLI-Research-Watcher/0.1 (+https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence)","Accept":"text/html"})
 with urllib.request.urlopen(request,timeout=18) as response:
  body=response.read(1000000).decode("utf-8","replace")
  parser=Extract();parser.feed(body)
  return " ".join(" ".join(parser.text).split())
def main():
 results=[];alerts=[]
 for src in SOURCES:
  row={k:v for k,v in src.items() if k not in ("match","alert_year")}
  try:
   text=fetch(src["url"]); years=sorted({int(y) for y in re.findall(src["match"],text,flags=re.I)})
   row.update(status="checked",detected_years=years,detail="Possible release years inferred from public webpage text; manual review required.")
   if src["id"]=="wec_trilemma":row["detail"]="WEC interactive site may render via JavaScript; HTML checking cannot reliably detect new editions. Check manually."
   if src["id"]=="den_index":row["detail"]="DEN does not provide a dedicated index-release feed here; no match is not proof of no new edition. Check manually."
   if src["id"] in ("esdm_heesi","bps_imports") and any(y>=src["alert_year"] for y in years):
    alerts.append({"id":src["id"],"publisher":src["publisher"],"years":years,"url":src["url"],"review_only":True})
  except Exception as exc:
   row.update(status="unavailable",detail=type(exc).__name__+": "+str(exc)[:160])
  results.append(row)
 out={"checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),"alerts":alerts,"sources":results,"disclaimer":"Candidate detections only. No dashboard data is updated automatically."}
 Path("monitor-report.json").write_text(json.dumps(out,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(out,indent=2))
if __name__=="__main__":main()
