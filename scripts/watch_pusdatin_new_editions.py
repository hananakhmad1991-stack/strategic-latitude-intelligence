#!/usr/bin/env python3
"""Official Pusdatin publication discovery and safe candidate staging.
No numeric auto-promotion: differing edition layouts, units and revisions require review.
The runner may receive HTTP 403 from the publisher; never claim ingestion on failure.
"""
import argparse
import datetime as dt
import hashlib
from html.parser import HTMLParser
import html
import json
import os
from pathlib import Path
import re
import sys
import urllib.parse
import urllib.request

ROOT=Path(__file__).resolve().parents[1]
PUBLISHER="https://satudata.pertanian.go.id"
LISTING=PUBLISHER+"/datasets/publikasi"
EDITION=re.compile(r"\bStatistik\s+Terkini\s+Ekonomi\s+Pertanian\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(20\d\d)\b",re.I)
MONTH={name.lower():i for i,name in enumerate(["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"],1)}
MAX_BYTES=26_000_000

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links=[]
        self.active=[]
    def handle_starttag(self,tag,attrs):
        if tag=="a":
            self.active.append({"href":dict(attrs).get("href",""),"parts":[]})
    def handle_data(self,s):
        for a in self.active:a["parts"].append(s)
    def handle_endtag(self,tag):
        if tag=="a" and self.active:
            item=self.active.pop()
            item["text"]=" ".join("".join(item["parts"]).split())
            self.links.append(item)

def official_url(value):
    if not value:return None
    u=urllib.parse.urlparse(urllib.parse.urljoin(PUBLISHER,value))
    if u.scheme!="https" or u.hostname!="satudata.pertanian.go.id":return None
    if u.username or u.password:return None
    return u.geturl()

def get_html(url,timeout=25):
    safe=official_url(url)
    if not safe:raise ValueError("Non-official or invalid Pusdatin URL")
    req=urllib.request.Request(safe,headers={"User-Agent":"SLI-Pusdatin-Publication-Watch/1.0 (+research source review)","Accept":"text/html,application/xhtml+xml"})
    with urllib.request.urlopen(req,timeout=timeout) as res:
        body=res.read(4_000_001)
        if len(body)>4_000_000:raise ValueError("Suspiciously large HTML listing")
        return body.decode("utf-8","replace")

def listing_detail_urls(markup):
    links=Links();links.feed(markup)
    found=[]
    for item in links.links:
        url=official_url(item["href"])
        if url and re.search(r"/details/publikasi/\d+(?:$|\?)",url) and url not in found:found.append(url)
    # Keep exact official detail IDs only; never trust document text to generate an external URL.
    return found[:12]

def parse_edition(markup):
    # Listing/details may contain a page title and also "latest" or related entries.
    # Capture ONLY the first clearly named September-style publisher publication.
    text=" ".join(re.sub(r"<[^>]+>"," ",html.unescape(markup)).split())
    m=EDITION.search(text)
    if not m:return None
    return {"title":m.group(0),"edition":f"{int(m.group(2)):04d}-{MONTH[m.group(1).lower()]:02d}"}

def extract_pdf(markup):
    links=Links();links.feed(markup)
    possible=[]
    for l in links.links:
        u=official_url(l["href"])
        if u and re.search(r"\.pdf(?:$|\?)",u,re.I):possible.append(u)
    if not possible:
        for m in re.finditer(r'(?i)(?:https?:)?//satudata\.pertanian\.go\.id/[^"\'<>\s]+\.pdf',markup):
            u=official_url(html.unescape(m.group(0)))
            if u:possible.append(u)
    return possible[0] if possible else None

def source_candidate(detail_url,markup):
    edition=parse_edition(markup)
    if not edition:return None
    version=edition["edition"]
    date=re.search(r"(?:Tanggal\s+Publikasi|Tanggal\s+Rilis)[^0-9]{0,90}(20\d\d-\d\d-\d\d)",re.sub(r"<[^>]+>"," ",markup),re.I)
    return {**edition,"detail_url":detail_url,"pdf_url":extract_pdf(markup),
            "published_on":date.group(1) if date else None,"status":"discovered_unreviewed"}

def baseline():
    data=json.loads((ROOT/"data/pusdatin-agriculture-september-2026.json").read_text(encoding="utf-8"))
    return {"edition":data["publication"]["edition"],"pdf":data["publication"]["pdf"]}

def download_pdf(url,dest):
    url=official_url(url)
    if not url or not re.search(r"\.pdf(?:$|\?)",url,re.I):raise ValueError("PDF must be hosted by official publisher")
    req=urllib.request.Request(url,headers={"User-Agent":"SLI-Pusdatin-Publication-Watch/1.0","Accept":"application/pdf"})
    dest.parent.mkdir(parents=True,exist_ok=True)
    with urllib.request.urlopen(req,timeout=45) as res:
        head=res.read(8)
        if not head.startswith(b"%PDF-"):raise ValueError("Publisher URL did not return a PDF")
        h=hashlib.sha256();h.update(head)
        with dest.open("wb") as f:
            f.write(head);size=len(head)
            while True:
                block=res.read(65536)
                if not block:break
                size+=len(block)
                if size>MAX_BYTES:raise ValueError("PDF exceeds 26 MB safety cap")
                f.write(block);h.update(block)
        if size<100_000:raise ValueError("PDF unreasonably small; review source")
        return {"bytes":size,"sha256":h.hexdigest(),"artifact":str(dest)}

def audit_discovery(html_get=get_html,base=baseline):
    current=base()
    listing=html_get(LISTING)
    candidates=[]
    for url in listing_detail_urls(listing):
        try:
            record=source_candidate(url,html_get(url))
            if record:candidates.append(record)
        except Exception as err:
            candidates.append({"detail_url":url,"status":"detail_fetch_error","error":str(err)[:250]})
    newer=sorted((r for r in candidates if r.get("edition","")>current["edition"]),key=lambda r:r["edition"],reverse=True)
    return {"schema":"sli-pusdatin-next-edition-watch-v1","checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
        "baseline_edition":current["edition"],"listing_url":LISTING,"detail_urls_checked":len(listing_detail_urls(listing)),
        "candidate_count":len(candidates),"latest_new_candidate":newer[0] if newer else None,
        "candidates":candidates,"status":"new_candidate_review_required" if newer else "no_new_edition_observed",
        "auto_publish":False}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--out-dir",default="artifacts/pusdatin-source-watch")
    args=ap.parse_args();folder=Path(args.out_dir);folder.mkdir(parents=True,exist_ok=True)
    try:
        report=audit_discovery()
    except Exception as exc:
        report={"schema":"sli-pusdatin-next-edition-watch-v1","checked_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
            "status":"discovery_blocked","error":f"{type(exc).__name__}: {str(exc)[:350]}",
            "listing_url":LISTING,"auto_publish":False,"latest_new_candidate":None}
    candidate=report.get("latest_new_candidate")
    if candidate:
        if candidate.get("pdf_url"):
            try:
                filename="Pusdatin-Statistik-Terkini-"+candidate["edition"]+".pdf"
                candidate["download"]=download_pdf(candidate["pdf_url"],folder/filename)
                candidate["status"]="pdf_staged_unreviewed"
            except Exception as exc:
                candidate["status"]="pdf_download_blocked"
                candidate["download_error"]=f"{type(exc).__name__}: {str(exc)[:350]}"
        else:candidate["status"]="official_detail_pdf_link_not_found"
    (folder/"discovery.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    summary=os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary,"a",encoding="utf-8") as f:
            f.write("\n## Pusdatin next-edition watch\n")
            f.write("Status: **"+report["status"]+"**. Baseline: September 2026. No autonomous numerical promotion.\n")
            if candidate:f.write("Candidate: "+candidate["edition"]+" · "+candidate["detail_url"]+" · "+candidate["status"]+"\n")
            if report.get("error"):f.write("Official source unavailable: "+report["error"]+"\n")
    print(json.dumps({"status":report["status"],"edition":candidate and candidate["edition"],"candidate_status":candidate and candidate["status"],"detail_count":report.get("detail_urls_checked"),"error":report.get("error")},ensure_ascii=False))
    # Fail CI if the source is blocked rather than claiming successful synchronization.
    return 2 if report["status"]=="discovery_blocked" else 0

if __name__=="__main__":sys.exit(main())
