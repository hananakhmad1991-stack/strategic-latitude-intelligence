#!/usr/bin/env python3
"""Indonesia EV car / motorcycle / charging / battery & policy headline discovery.
Only source-attributed public headline candidates. Never overwrite baseline market data,
claim enacted EV incentives from news, or infer verified real-time vehicle registrations.
"""
from __future__ import annotations
import datetime as dt
import email.utils
import json
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path("data/energy-ev-watch.json")
NOW = dt.datetime.now(dt.timezone.utc)
TRACKS=[
 ("Cars","(mobil listrik OR battery electric vehicle OR BEV) (penjualan OR Gaikindo OR produksi OR retail) Indonesia"),
 ("Motorcycles","(motor listrik OR sepeda motor listrik OR AISMOLI) (penjualan OR insentif OR produksi OR registrasi) Indonesia"),
 ("Charging","(SPKLU OR SPBKLU OR battery swapping) (PLN OR kendaraan listrik OR pengisian) Indonesia"),
 ("Policy","(mobil listrik OR motor listrik OR kendaraan listrik OR KBLBB) (perpres OR PMK OR subsidi OR insentif OR TKDN OR peraturan) Indonesia"),
 ("Industry","(pabrik mobil listrik OR pabrik motor listrik OR kendaraan listrik) (produksi OR investasi OR ekspor OR peresmian) Indonesia"),
 ("Batteries","(baterai kendaraan listrik OR EV battery OR battery) (pabrik OR ekspor OR nikel OR daur ulang) Indonesia")
]
EV_TITLE=re.compile(r"mobil listrik|motor listrik|kendaraan listrik|electric vehicle|\bbev\b|\bphev\b|\bev\b|\bspklu\b|\bspbklu\b|battery swap|baterai kendaraan|baterai mobil|baterai motor|\bkblbb\b|\bgaikindo\b.*listrik|\btkdn\b.*listrik",re.I)
REPUTABLE=re.compile(r"^(ANTARA|Kompas|detik|CNBC Indonesia|Bisnis|Katadata|Kontan|Tempo|The Jakarta Post|CNN Indonesia|Bloomberg Technoz|GAIKINDO|AISI|AISMOLI|Kementerian |Ditjen |PT PLN|PLN|Pertamina|Sekretariat Negara|Presiden RI)",re.I)
OFFICIAL_HOSTS=("esdm.go.id","kemenperin.go.id","dephub.go.id","kemenhub.go.id","setneg.go.id","pln.co.id","gaikindo.or.id","aisi.or.id","go.id")
def official(host):
 host=(host or "").lower()
 return any(host==x or host.endswith("."+x) for x in OFFICIAL_HOSTS)
def scan(category,query):
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query+" when:10d","hl":"id","gl":"ID","ceid":"ID:id"})
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-EV-Research-Public-RSS/1.0","Accept":"application/rss+xml"})
 with urllib.request.urlopen(req,timeout=18) as response:
  root=ET.fromstring(response.read(850000))
 results=[]
 for item in root.findall("./channel/item"):
  title=" ".join((item.findtext("title") or "").split())[:240]
  link=(item.findtext("link") or "").strip()
  source=item.find("source")
  publisher=(source.text or "").strip() if source is not None else ""
  publisher_uri=source.attrib.get("url","") if source is not None else ""
  host=urllib.parse.urlsplit(publisher_uri).hostname or ""
  try:published=email.utils.parsedate_to_datetime(item.findtext("pubDate") or "").astimezone(dt.timezone.utc)
  except (TypeError,ValueError,IndexError,OverflowError):continue
  if not title or not EV_TITLE.search(title) or not link.startswith("https://"):continue
  if not (REPUTABLE.search(publisher) or official(host)):continue
  if published<NOW-dt.timedelta(days=11) or published>NOW+dt.timedelta(hours=2):continue
  # Only domestic EV developments or globally relevant Indonesian manufacturing.
  if re.search(r"\b(Tesla|India|Malaysia|China|Amerika|Eropa|Singapura)\b",title,re.I) and not re.search(r"Indonesia|RI\b|Tanah Air|Jakarta|Jawa|Batam|Kalimantan|Sulawesi|Papua|PLN|Kemenperin|Gaikindo",title,re.I):continue
  results.append({"category":category,"title":title,"url":link,"publisher":publisher,"published_at_utc":published.isoformat(),
  "source_status":"Attributable official/association" if official(host) else "Attributable media",
  "verification":"Unverified headline lead; inspect source document, observation period, units and legal effectiveness"})
  if len(results)>=6:break
 return results

def main():
 OUT.parent.mkdir(parents=True,exist_ok=True)
 all_items=[];seen=set();errors=[];counts=[]
 for category,query in TRACKS:
  count=0
  try:
   for entry in scan(category,query):
    key=re.sub(r"\W+","",entry["title"].casefold())[:155]
    if key in seen:continue
    seen.add(key);all_items.append(entry);count+=1
  except Exception as exc:
   errors.append({"category":category,"error":type(exc).__name__+": "+str(exc)[:140]})
  counts.append({"category":category,"found":count})
  time.sleep(.4)
 all_items.sort(key=lambda x:x["published_at_utc"],reverse=True)
 previous={}
 if OUT.exists():
  try:previous=json.loads(OUT.read_text(encoding="utf-8"))
  except (OSError,ValueError):pass
 if not all_items and errors and previous.get("items"):
  result={**previous,"checked_at_utc":NOW.isoformat(),"errors":errors,"stale_previous_results":True}
 else:
  result={"checked_at_utc":NOW.isoformat(),"items":all_items[:30],"counts":counts,"errors":errors,"stale_previous_results":False,
   "scope":"Indonesian EV, charging, battery manufacturing and regulation — publicly attributable RSS headline discovery",
   "methodology":"Headlines are not verified article-body evidence. Publication times are NOT registration or incident dates. Legal changes require primary JDIH instruments; market statistics require matched GAIKINDO/SRUT/AISMOLI vintage.",
   "baseline_update_policy":"Never automatically update data/energy-ev.json with unreviewed headlines or infer EV stock from wholesale vehicle sales."}
 OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps({"found":len(result.get("items",[])),"errors":len(errors),"checked_at":NOW.isoformat(),"counts":counts},ensure_ascii=False))
if __name__=="__main__":main()
