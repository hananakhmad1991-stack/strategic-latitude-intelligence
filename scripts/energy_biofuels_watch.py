#!/usr/bin/env python3
"""Attributable Indonesia biofuels headline discovery, NOT realtime production metering.
Publishes dated candidates only; never overwrites verified baseline volumes or legal status.
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

OUT=Path("data/energy-biofuels-watch.json")
TRACKS=[
 ("Policy","(biodiesel OR bioetanol OR biofuel OR B50 OR E10 OR E20) (Kepmen OR peraturan OR mandatori OR kebijakan) Indonesia"),
 ("Capacity","(kapasitas produksi biodiesel OR pabrik biodiesel OR pabrik FAME OR investasi biodiesel) Indonesia"),
 ("Production","(realisasi biodiesel OR produksi biodiesel OR penyaluran biodiesel OR konsumsi biodiesel) Indonesia"),
 ("Feedstock","(biodiesel OR bioetanol) (CPO OR sawit OR tebu OR singkong OR bahan baku) Indonesia"),
 ("Distribution","(biodiesel OR B50 OR biosolar) (terminal OR SPBU OR distribusi OR pasokan) Indonesia"),
 ("Bioethanol","(bioetanol OR E10 OR E20 OR etanol bahan bakar) (ESDM OR Pertamina OR Indonesia)"),
 ("Sustainability","(biodiesel OR bioetanol) (emisi OR deforestasi OR pangan OR penggunaan lahan OR sertifikasi) Indonesia"),
 ("SAF","(bioavtur OR sustainable aviation fuel OR green refinery) (Pertamina OR Cilacap OR Dumai OR Indonesia)"),
 ("Prices","(HIP biodiesel OR harga biodiesel OR BPDP biodiesel) Indonesia")
]
TOPIC=re.compile(r"\b(biodiesel|bioetanol|bioethanol|biosolar|biofuel|b50|b40|e10|e20|e50|fame|bioavtur|sustainable aviation fuel|green refinery|bahan bakar nabati|bbn|hip bbn)\b",re.I)
ALLOWED=re.compile(r"^(ANTARA|Kompas|detik|CNBC Indonesia|Bisnis|Kontan|Katadata|Tempo|The Jakarta Post|CNN Indonesia|Bloomberg Technoz|Kementerian ESDM|Ditjen EBTKE|BPH Migas|BPDP|Pertamina|Kementerian Perdagangan|Kementerian Pertanian|GAPKI|APROBI)",re.I)
OFFICIAL_ENDINGS=("esdm.go.id","bpdp.or.id","pertamina.com","go.id")
NOW=dt.datetime.now(dt.timezone.utc)
def official_url(url):
 host=(urllib.parse.urlsplit(url or "").hostname or "").lower()
 return any(host==suffix or host.endswith("."+suffix) for suffix in OFFICIAL_ENDINGS)
def fetch(track):
 category,query=track
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query+" when:10d","hl":"id","gl":"ID","ceid":"ID:id"})
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-Biofuels-Public-RSS/1.0","Accept":"application/rss+xml"})
 with urllib.request.urlopen(req,timeout=18) as response:
  tree=ET.fromstring(response.read(850000))
 entries=[]
 for item in tree.findall("./channel/item"):
  title=" ".join((item.findtext("title") or "").split())[:230]
  href=(item.findtext("link") or "").strip()
  pubnode=item.find("source")
  publisher=(pubnode.text or "").strip() if pubnode is not None else ""
  publisher_url=pubnode.attrib.get("url","") if pubnode is not None else ""
  try:
   published=email.utils.parsedate_to_datetime(item.findtext("pubDate") or "").astimezone(dt.timezone.utc)
  except (TypeError,ValueError,IndexError,OverflowError):
   continue
  if not title or not href.startswith("https://") or not TOPIC.search(title):continue
  if not (ALLOWED.search(publisher) or official_url(publisher_url)):continue
  if published>NOW+dt.timedelta(hours=2) or published<NOW-dt.timedelta(days=11):continue
  if re.search(r"\b(Malaysia|Brazil|Eropa|Amerika Serikat|US EPA)\b",title,re.I) and not re.search(r"\b(Indonesia|RI|sawit nasional|B50)\b",title,re.I):continue
  entries.append({"category":category,"title":title,"url":href,"publisher":publisher,
   "published_at_utc":published.isoformat(),"source_category":"Official publisher" if official_url(publisher_url) else "Attributed media",
   "status":"Unverified headline candidate; consult original document, publication date and legal or operational evidence"})
  if len(entries)==5:break
 return entries

def main():
 OUT.parent.mkdir(parents=True,exist_ok=True)
 all_items=[];seen=set();errors=[];counts=[]
 for track in TRACKS:
  category=track[0];count=0
  try:
   for entry in fetch(track):
    key=re.sub(r"\W+","",entry["title"].lower())[:155]
    if key in seen:continue
    seen.add(key);all_items.append(entry);count+=1
  except Exception as exc:
   errors.append({"category":category,"error":type(exc).__name__+": "+str(exc)[:160]})
  counts.append({"category":category,"found":count})
  time.sleep(0.4)
 all_items.sort(key=lambda r:r["published_at_utc"],reverse=True)
 previous={}
 if OUT.exists():
  try:previous=json.loads(OUT.read_text("utf-8"))
  except (ValueError,OSError):pass
 if not all_items and errors and previous.get("items"):
  result=previous
  result.update(checked_at_utc=NOW.isoformat(),errors=errors,stale_previous_results=True)
 else:
  result={"checked_at_utc":NOW.isoformat(),"items":all_items[:30],"counts":counts,"errors":errors,
   "stale_previous_results":False,"methodology":"Google News RSS headline discovery only. No article-body scraping; respect original publisher terms. Headline is not independently checked supply, amended law, site-level capacity or audited production.",
   "baseline_updates":"No automatic modification of data/energy-biofuels.json; expert review required for official publications and regulatory amendments."}
 OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps({"checked_at_utc":NOW.isoformat(),"found":len(result.get("items",[])),"errors":errors,"categories":counts},ensure_ascii=False))
if __name__=="__main__":
 main()
