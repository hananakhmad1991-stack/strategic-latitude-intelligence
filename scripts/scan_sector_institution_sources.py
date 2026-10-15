#!/usr/bin/env python3
"""Daily verify presence and changes in original institutional/issuer rosters.
Never invent incumbents or replace source-dated people from ambiguous page text.
"""
import concurrent.futures
import datetime as dt
import hashlib
import json
import pathlib
import re
import urllib.request
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
INPUT=ROOT/"data"/"sector-command-hierarchy.json"
OUTPUT=ROOT/"data"/"sector-leadership-watch.json"

class PlainText(HTMLParser):
    def __init__(self): super().__init__();self.skip=0;self.bits=[]
    def handle_starttag(self,t,attrs):
        if t in ("script","style","noscript"):self.skip+=1
    def handle_endtag(self,t):
        if t in ("script","style","noscript"):self.skip=max(0,self.skip-1)
    def handle_data(self,s):
        if not self.skip:self.bits.append(s)
def check(obj):
    req=urllib.request.Request(obj["source"],headers={"User-Agent":"Mozilla/5.0 (compatible; SLIResearchMonitor/1.0; source-attribution review)"})
    try:
        with urllib.request.urlopen(req,timeout=15) as res:
            ctype=res.headers.get("Content-Type","").lower()
            payload=res.read(400000)
            if "pdf" in ctype: raise ValueError("Non-HTML primary source: check manually")
        raw=payload.decode("utf-8","ignore")
        parser=PlainText();parser.feed(raw)
        txt=re.sub(r"\s+"," "," ".join(parser.bits)).casefold()
        leader=obj["person"]
        terms=[x.casefold() for x in leader.split() if len(x)>2]
        confirmed=bool(terms) and all(x in txt for x in terms)
        return {"sector":obj["sector"],"id":obj["id"],"name":obj["title"],"person":leader,
                "source":obj["source"],"page_sha256":hashlib.sha256(txt.encode()).hexdigest(),
                "status":"name_present_in_source" if confirmed else "name_not_detected_needs_review"}
    except Exception as exc:
        return {"sector":obj["sector"],"id":obj["id"],"name":obj["title"],"person":obj["person"],
                "source":obj["source"],"status":"source_access_unavailable","error":str(exc)[:140]}

def main():
    d=json.loads(INPUT.read_text(encoding="utf-8"))
    old={}
    if OUTPUT.exists():
        try:old=json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception:pass
    targets=[]
    for sector,info in d["sectors"].items():
        for item in info["nodes"]:
            if item.get("person") and (item.get("relation")!="root") and item.get("source","").startswith("https://"):
                targets.append({"sector":sector,**item})
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    with concurrent.futures.ThreadPoolExecutor(max_workers=7) as pool:
        checks=list(pool.map(check,targets))
    old_map={(x["sector"],x["id"]):x for x in old.get("checks",[])}
    for item in checks:
        previous=old_map.get((item["sector"],item["id"]),{})
        changed=item.get("page_sha256") and previous.get("page_sha256") and item["page_sha256"]!=previous["page_sha256"]
        item["page_content_changed_since_previous_scan"]=bool(changed)
        if item["status"]=="source_access_unavailable" and previous.get("last_success_utc"):
            item["last_success_utc"]=previous["last_success_utc"]
        elif item["status"]!="source_access_unavailable":
            item["last_success_utc"]=now
    status={"checked_at_utc":now,"method":"Official/issuer source text monitor. Name appearance is not appointment verification. Automated scans NEVER overwrite actor identities; missing names trigger human review.","checks":checks}
    OUTPUT.write_text(json.dumps(status,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Reviewed",len(checks),"leaders; source warnings",sum(x["status"]!="name_present_in_source" for x in checks))
if __name__=="__main__":main()
