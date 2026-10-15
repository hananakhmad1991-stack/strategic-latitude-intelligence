#!/usr/bin/env python3
"""Infrastructure change leads from public official-source headlines.
Never automatically edit installed MW, refinery capacity, RE or official DEN aspect scores
based on headlines or incomplete snippets.
"""
from __future__ import annotations
import datetime as dt
import email.utils,json,re,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
NOW=dt.datetime.now(dt.timezone.utc)
OUT=Path("data/energy-infrastructure-watch.json")
TRACK=[
 ("Refinery capacity & RDMP","(site:kpb.pertamina.com OR site:kpi.pertamina.com OR site:esdm.go.id) (kilang OR RFCC OR RDMP) (kapasitas OR operasi OR commissioning OR produksi)"),
 ("Electrification","(site:gatrik.esdm.go.id OR site:esdm.go.id OR site:web.pln.co.id) (rasio elektrifikasi OR rasio desa berlistrik OR listrik desa)"),
 ("Installed generation","(site:esdm.go.id OR site:gatrik.esdm.go.id OR site:web.pln.co.id) (kapasitas pembangkit OR PLTU OR PLTD OR PLTS OR PLTP)"),
 ("Household gas network","(site:migas.esdm.go.id OR site:esdm.go.id) (jargas OR jaringan gas rumah tangga OR sambungan rumah)"),
 ("National energy security index","(site:esdm.go.id OR site:den.go.id) (indeks ketahanan energi OR availability accessibility affordability acceptability)")
]
AGENT="SLI-Energy-Asset-Source-Monitor/1.0"
def scan(cat,query):
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query+" when:30d","hl":"id","gl":"ID","ceid":"ID:id"})
 req=urllib.request.Request(url,headers={"User-Agent":AGENT})
 with urllib.request.urlopen(req,timeout=18) as resp:tree=ET.fromstring(resp.read(700000))
 items=[]
 for item in tree.findall("./channel/item"):
  title=" ".join((item.findtext("title") or "").split())[:220]
  href=(item.findtext("link") or "").strip()
  try:published=email.utils.parsedate_to_datetime(item.findtext("pubDate") or "").astimezone(dt.timezone.utc)
  except (TypeError, ValueError, IndexError):continue
  if not title or not href.startswith("https://") or published < NOW-dt.timedelta(days=32) or published>NOW+dt.timedelta(days=1):continue
  publisher=item.find("source");name=(publisher.text or "").strip() if publisher is not None else "Public source"
  items.append({"topic":cat,"title":title,"publisher":name,"url":href,"published_at_utc":published.isoformat(),
   "verified":False,"status":"Discovery lead; source document & year definitions must be independently checked before altering the baseline"})
  if len(items)>=6:break
 return items
def main():
 rows=[];errors=[];seen=set()
 for topic,query in TRACK:
  try:
   for v in scan(topic,query):
    key=re.sub(r"\W+","",v["title"].lower())[:145]
    if key not in seen:seen.add(key);rows.append(v)
  except Exception as exc:
   errors.append({"topic":topic,"error":type(exc).__name__+": "+str(exc)[:170]})
 rows.sort(key=lambda x:x["published_at_utc"],reverse=True)
 previous={}
 if OUT.exists():
  try:previous=json.loads(OUT.read_text(encoding="utf-8"))
  except (ValueError,OSError):pass
 if not rows and errors and previous.get("leads"):
  previous.update(checked_at_utc=NOW.isoformat(),source_errors=errors,stale_previous_results=True)
  result=previous
 else:
  result={"checked_at_utc":NOW.isoformat(),"leads":rows[:20],"source_errors":errors,
   "stale_previous_results":False,"disclaimer":"Automatic official-domain news discovery is NOT proof of operational change or a revised statistical series. Official data require year, definition, primary report and ministry verification before changing benchmark figures."}
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print("Infrastructure candidate leads",len(result.get("leads",[])),"errors",len(errors))
if __name__=="__main__":main()
