#!/usr/bin/env python3
"""Source-attributed CCS/CCUS headline discovery; never promote a project stage from a headline."""
from __future__ import annotations
import datetime as dt
import email.utils
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT=Path("data/energy-ccs-updates.json")
SOURCES=[
 ("Tangguh UCC","(Tangguh CCUS OR Ubadari UCC) (bp OR ESDM)"),
 ("Jatibarang","(Jatibarang CCS OR Jatibarang CO2 injection) Pertamina"),
 ("Gundih","(Gundih CCUS OR Gundih carbon capture) Pertamina"),
 ("Sukowati","(Sukowati CCUS OR Sukowati CO2 EOR) Pertamina"),
 ("Abadi Masela","(Abadi Masela CCS OR Masela CO2) INPEX"),
 ("Sunda Asri","(Sunda Asri CCS OR Asri Basin carbon storage)"),
 ("Arun / Aceh","(Arun CCS OR Aceh carbon storage) PGE"),
 ("National CCS regulation","(CCS CCUS Indonesia) (ESDM OR migas.esdm.go.id OR kementerian)"),
]
AGENT="SLI-Public-CCS-Review-Watcher/1.0"
NOW=dt.datetime.now(dt.timezone.utc)
def load(q):
    url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":q+" when:30d","hl":"id","gl":"ID","ceid":"ID:id"})
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":AGENT}),timeout=20) as response:
        return ET.fromstring(response.read(600000))
def read(item,group):
    t=" ".join((item.findtext("title") or "").split())[:250]
    u=(item.findtext("link") or "").strip()
    if not t or not u.startswith("https://"):return None
    try:when=email.utils.parsedate_to_datetime(item.findtext("pubDate")).astimezone(dt.timezone.utc)
    except (ValueError, TypeError):return None
    if when>NOW+dt.timedelta(days=1) or when<NOW-dt.timedelta(days=35):return None
    publisher=item.find("source")
    p=(publisher.text or "").strip() if publisher is not None else "News index"
    return {"track":group,"title":t,"publisher":p,"url":u,"published_at_utc":when.isoformat(),
        "status":"Unverified source lead", "requires_review":True,
        "investment_not_confirmed":True,"injected_tonnes_not_confirmed":True,
        "project_stage_not_confirmed":True}
def main():
    result=[];errors=[];seen=set()
    for group,q in SOURCES:
        try:
            feed=load(q)
            for row in feed.findall("./channel/item"):
                d=read(row,group)
                if not d:continue
                key=re.sub(r"\W+","",d["title"].lower())[:160]
                if key in seen:continue
                seen.add(key);result.append(d)
        except Exception as ex:
            errors.append({"track":group,"error":type(ex).__name__+": "+str(ex)[:160]})
    result.sort(key=lambda x:x["published_at_utc"],reverse=True)
    previous={}
    if OUT.exists():
        try:previous=json.loads(OUT.read_text(encoding="utf-8"))
        except (ValueError,OSError):pass
    if not result and errors and previous.get("updates"):
        previous.update(checked_at_utc=NOW.isoformat(),errors=errors,stale_previous_results=True)
        output=previous
    else:
        output={"checked_at_utc":NOW.isoformat(),"updates":result[:40],"errors":errors,
            "stale_previous_results":False,
            "disclaimer":"Discovery is automatic, but CCS/CCUS FID, operational status, measured tonnes injected, commercial storage and booked investment are NOT automatically inferred from headlines. Original dated company and regulator evidence is required for changing verified project baselines."}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("CCS/CCUS leads:",len(output.get("updates",[])),"errors:",len(errors))
if __name__=="__main__":main()
