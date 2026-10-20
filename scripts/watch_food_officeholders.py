#!/usr/bin/env python3
"""Read-only official public bio monitor; NEVER promotes scraped titles to current officeholders.

A name in an article, even an official one, does not establish legal appointment.
This monitor reports possible changes for manual verification only. No API secrets,
AI calls, credential handling, database writes or production deployments.
"""
import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import urllib.error
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
REGISTRY=ROOT/"data"/"food-institution-leadership.json"
DEFAULT_OUTPUT=ROOT/"artifacts"/"food-leadership-monitor.json"

class Content(HTMLParser):
    def __init__(self):
        super().__init__()
        self.bits=[]
        self.ignored=0
    def handle_starttag(self,tag,attrs):
        if tag in {"script","style","noscript"}:self.ignored+=1
    def handle_endtag(self,tag):
        if tag in {"script","style","noscript"}:self.ignored=max(0,self.ignored-1)
    def handle_data(self,data):
        if not self.ignored:self.bits.append(data)

def normalise(s):
    return re.sub(r"\s+"," ",s).strip().casefold()

def evaluate_profile(raw,expected):
    parser=Content()
    parser.feed(raw)
    body=normalise(" ".join(parser.bits))
    name=normalise(expected)
    # Detect current bio pattern, not historical replacement mentions elsewhere.
    mention=re.search(re.escape(name),body)
    if mention and "kini menjabat sebagai kepala badan pangan nasional" in body[mention.start():mention.start()+850]:
        return {"status":"expected_name_near_current_role","requires_human_verification":False}
    return {"status":"official_profile_changed_or_expected_role_not_detected","requires_human_verification":True}

def run():
    data=json.loads(REGISTRY.read_text(encoding="utf8"))
    item=next(a for a in data["appointments"] if a["institution_id"]=="bapanas")
    source=next(a["url"] for a in item["sources"] if a["type"]=="official_head_profile")
    result={"schema":"sli-food-leadership-monitor-v1",
            "checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
            "institution_id":"bapanas","last_human_verified_officeholder":item["person"],
            "last_human_verified_on":item["last_official_confirmation"],
            "source":source,
            "method":"Public official biography text check only; cannot legally certify incumbent; never overwrite registry"}
    try:
        req=urllib.request.Request(source,headers={"User-Agent":"Mozilla/5.0 (compatible; SLI-Primary-Source-Review/1.0)"})
        with urllib.request.urlopen(req,timeout=17) as response:
            ctype=response.headers.get("Content-Type","")
            if "html" not in ctype.lower():raise ValueError("Unexpected source response format")
            raw=response.read(600000).decode("utf8","ignore")
        evaluated=evaluate_profile(raw,item["person"])
        result.update(evaluated)
        result["content_hash_sha256"]=hashlib.sha256(raw.encode("utf8")).hexdigest()
    except Exception as exc:
        # An inaccessible source is NOT evidence that an incumbent changed.
        result.update(status="source_inaccessible_needs_retry",requires_human_verification=False,
                      source_availability_warning=str(exc)[:160])
    return result

def main():
    args=argparse.ArgumentParser()
    args.add_argument("--out",default=str(DEFAULT_OUTPUT))
    ns=args.parse_args()
    result=run()
    output=Path(ns.out)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(result["status"],"needs human review:",result["requires_human_verification"])
    # Never fail site, patch profile or deploy because a publisher blocks crawlers.
if __name__=="__main__":main()
