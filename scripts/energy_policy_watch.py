#!/usr/bin/env python3
"""Discover official energy policy release candidates. Never promote RSS headlines into enacted-law claims."""
from __future__ import annotations
import datetime as dt
import email.utils
import json
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

OUT = Path("data/energy-policy-leads.json")
SOURCES = [
 ("ESDM legal instrument candidates", "site:jdih.esdm.go.id (peraturan energi OR keputusan menteri ESDM OR permen ESDM)"),
 ("Official energy policy announcements", "site:esdm.go.id (kebijakan energi OR subsidi energi OR tarif listrik OR bauran energi OR CCS)"),
 ("Official upstream and CCS implementation", "site:migas.esdm.go.id (CCS OR CCUS OR peraturan OR kebijakan OR penyimpanan karbon)"),
]
AGENT="SLI-Policy-Discovery/1.0 public-source RSS (+https://github.com/hananakhmad1991-stack/strategic-latitude-intelligence)"

def get_feed(query: str) -> bytes:
    url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query+" when:21d","hl":"id","gl":"ID","ceid":"ID:id"})
    request=urllib.request.Request(url,headers={"User-Agent":AGENT,"Accept":"application/rss+xml"})
    with urllib.request.urlopen(request,timeout=22) as response:
        return response.read(700000)

def read_item(node, group: str):
    title=" ".join((node.findtext("title") or "").split())[:260]
    link=(node.findtext("link") or "").strip()
    if not title or not link.startswith("https://"):
        return None
    published=(node.findtext("pubDate") or "").strip()
    try:
        when=email.utils.parsedate_to_datetime(published).astimezone(dt.timezone.utc)
    except (ValueError,TypeError,IndexError):
        return None
    if not 0 <= (dt.datetime.now(dt.timezone.utc)-when).days <= 45:
        return None
    source=node.find("source")
    publisher=(source.text or "").strip() if source is not None else "Attributed release candidate"
    # RSS publisher and URL are discovery evidence, not legal authenticity.
    return {"group":group,"title":title,"publisher":publisher,
            "url":link,"published_at_utc":when.isoformat(),
            "status":"Unverified official-source candidate", "requires_review":True}

def main():
    errors=[];rows=[];dedup=set()
    for group,q in SOURCES:
        try:
            raw=get_feed(q);tree=ET.fromstring(raw)
            for item in tree.findall("./channel/item"):
                doc=read_item(item,group)
                if not doc:continue
                key=re.sub(r"\W+","",doc["title"].lower())[:160]
                if key in dedup:continue
                dedup.add(key);rows.append(doc)
        except Exception as exc:
            errors.append({"group":group,"error":type(exc).__name__+": "+str(exc)[:170]})
    rows.sort(key=lambda x:x["published_at_utc"],reverse=True)
    previous={}
    if OUT.exists():
        try:previous=json.loads(OUT.read_text(encoding="utf-8"))
        except (ValueError,OSError):pass
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    if not rows and errors and previous.get("items"):
        previous.update(checked_at_utc=now,scan_errors=errors,stale_previous_results=True,
                        disclaimer="Latest scan failed; displayed candidates are carried over and NOT verified enactments.")
        output=previous
    else:
        output={
         "checked_at_utc":now,"window_days":21,"items":rows[:18],
         "scan_errors":errors,"stale_previous_results":False,
         "disclaimer":"Google News RSS is only a discovery index. Headlines and publisher labels are not proof of passage, effective date, regulatory scope or legal validity. Verify original legal publication in JDIH before updating the curated enacted-policy register."
        }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Policy candidates:",len(output.get("items",[])),"scan errors:",len(errors))

if __name__=="__main__":main()
