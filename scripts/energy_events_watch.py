#!/usr/bin/env python3
"""SLI upcoming Indonesia energy events: 5 dated organiser-sourced listings, rolling and cautious.
Never invent new events, dates, venues or upgrade news mentions to confirmed listings.
"""
from __future__ import annotations
import datetime as dt
import hashlib
import html
import json
import re
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path
from zoneinfo import ZoneInfo

CATALOG=Path("data/energy-events-catalog.json")
OUTPUT=Path("data/energy-events.json")
TZ=ZoneInfo("Asia/Jakarta")
NOW=dt.datetime.now(TZ)
TODAY=NOW.date()
AGENT="SLI-Public-Energy-Events/1.0 (contact: repo README)"
MONTHS={"jan":1,"feb":2,"mar":3,"apr":4,"mei":5,"may":5,"jun":6,
        "jul":7,"agu":8,"aug":8,"sep":9,"okt":10,"oct":10,
        "nov":11,"des":12,"dec":12}
def safe_source(url: str):
    host=(urllib.parse.urlparse(url).hostname or "").lower()
    return (host=="iesr.or.id" or host.endswith(".iesr.or.id")
            or host in ("www.the-eic.com","the-eic.com","aseansolarstorage.metal.com",
                        "www.terrapinn.com","terrapinn.com","iceevent.org",
                        "carbondigitalconference.com","www.carbondigitalconference.com"))
def get_html(url: str, max_read: int=900000):
    if not url.startswith("https://") or not safe_source(url):
        raise ValueError("Not on permitted official organiser list")
    req=urllib.request.Request(url,headers={"User-Agent":AGENT,"Accept":"text/html"})
    with urllib.request.urlopen(req,timeout=18) as r:
        if not safe_source(r.geturl()): raise ValueError("Redirect to unapproved host")
        raw=r.read(max_read)
    return html.unescape(raw.decode("utf-8","replace"))
class Extract(HTMLParser):
    def __init__(self):
        super().__init__();self.text=[];self.anchors=[];self.h1=[];self.in_h1=False
    def handle_starttag(self,tag,attrs):
        if tag=="a": self.anchors.append(dict(attrs).get("href",""))
        if tag=="h1":self.in_h1=True
    def handle_endtag(self,tag):
        if tag=="h1":self.in_h1=False
    def handle_data(self,data):
        d=" ".join(data.split())
        if d:self.text.append(d)
        if d and self.in_h1:self.h1.append(d)
def flattened(markup):
    p=Extract();p.feed(markup);return p," ".join(p.text)
def date_from_page(text):
    # Official IESR event detail pages display "Date" followed by "Okt 20 2026".
    tail=text[-15000:]
    for match in re.finditer(r"\b([A-Za-z]{3})\s+(\d{1,2})\s+(20\d{2})\b",tail):
        month=MONTHS.get(match.group(1).lower())
        if not month:continue
        try:return dt.date(int(match.group(3)),month,int(match.group(2)))
        except ValueError:continue
    return None
def is_qualifying(title):
    return bool(re.search(r"energi|energy|listrik|electric|renewable|surya|solar|grid|emisi|dekarbon|carbon|storage|geothermal|biofuel|iklim|net zero",title,re.I))
def ie_sr_official_discovery(errors):
    """Admit only original IESR event details with a parseable dated event."""
    link="https://iesr.or.id/kegiatan/"
    try:
        directory=get_html(link)
    except Exception as exc:
        errors.append({"source":"IESR official agenda","error":type(exc).__name__+": "+str(exc)[:125]})
        return []
    p,_=flattened(directory)
    candidates=[];dedup=set()
    for href in p.anchors:
        u=urllib.parse.urljoin(link,href).split("#",1)[0]
        if "/agenda-iesr/" not in u or not safe_source(u) or u in dedup:continue
        dedup.add(u)
        if len(candidates)>=18:break
        candidates.append(u)
    events=[]
    for u in candidates:
        try:
            page=get_html(u)
            el,t=flattened(page)
            title=" ".join(el.h1).strip()
            date=date_from_page(t)
            if not date or date<TODAY or date>TODAY+dt.timedelta(days=500):continue
            if not title or not is_qualifying(title):continue
            key=hashlib.sha256(u.split("?",1)[0].encode()).hexdigest()[:12]
            events.append({
                "id":"iesr-auto-"+key,"title":title[:165],"start_date":date.isoformat(),
                "end_date":date.isoformat(),"venue":"Check organiser page",
                "city":"Indonesia / see source","category":"Energy Policy & Transition",
                "organizer":"Institute for Essential Services Reform (IESR)",
                "summary":"Agenda energi yang diumumkan melalui kalender resmi IESR.",
                "relevance":"Energy policy research and stakeholder dialogue","source_url":u,
                "source_type":"official organiser dated event detail",
                "verified_on":TODAY.isoformat(),"discovery_method":"organiser calendar date and event title",
                "auto_discovered":True
            })
        except Exception as exc:
            errors.append({"source":"IESR event detail","error":type(exc).__name__+": "+str(exc)[:105]})
    return events
def sort_by_nearest(event):
    # Python stable sort preserves curated organiser-event priority for same-day conferences.
    return event["start_date"]
def valid(event):
    try:
        st=dt.date.fromisoformat(event["start_date"])
        en=dt.date.fromisoformat(event["end_date"])
    except (TypeError,ValueError,KeyError):return False
    return en>=st and en>=TODAY and st<=TODAY+dt.timedelta(days=730) and bool(event.get("source_url"))
def check_seed(event,errors):
    e=dict(event)
    # Petromindo's terms restrict automated reuse, so only manually dated catalog facts.
    if e.get("automated_source_check") is False:
        e["source_check"]="manual-source-entry; no automated scraping"
        return e
    u=e["source_url"]
    try:
        doc=get_html(u)
        _,body=flattened(doc)
        compact=re.sub(r"\s+"," ",body)
        hints=e.get("date_hints",[])
        # Source pages can use different date typography; failure means review, not a reschedule.
        contains_date=any(h.casefold() in compact.casefold() for h in hints)
        e["source_check"]="organizer-page-date-visible" if contains_date else "organizer-page-reachable-date-recheck"
    except Exception as exc:
        e["source_check"]="organizer-site-temporarily-unavailable"
        errors.append({"source":u,"error":type(exc).__name__+": "+str(exc)[:125]})
    return e
def main():
    catalog=json.loads(CATALOG.read_text(encoding="utf-8"))
    if catalog.get("timezone")!="Asia/Jakarta":raise RuntimeError("Time zone mismatch")
    errors=[]
    seeds=[check_seed(e,errors) for e in catalog["events"] if valid(e)]
    discovered=ie_sr_official_discovery(errors)
    # New date/title combinations from the same IESR detail should never duplicate a vetted seed.
    known_urls={e["source_url"].split("?",1)[0].rstrip("/") for e in seeds}
    added=[]
    for e in discovered:
        u=e["source_url"].split("?",1)[0].rstrip("/")
        if u in known_urls:continue
        known_urls.add(u);added.append(e)
    all_events=sorted(seeds+added,key=sort_by_nearest)
    selected=all_events[:5]
    payload={
       "generated_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),
       "date_wib":TODAY.isoformat(),"time_zone":"Asia/Jakarta",
       "max_displayed":5,"events":selected,
       "candidate_pool_count":len(all_events),"discovered_from_official_iesr":len(added),
       "source_errors":errors[:18],"policy":"Five upcoming/ongoing Indonesian energy events sorted by event start date. Past events automatically drop. Replacements come from pre-vetted organiser-dated catalog entries plus newly dated original IESR event pages. Other unverified event discoveries are not automatically promoted.",
       "disclaimer":"Event plans may change. Opening, registration, programme and venue should be confirmed at organiser links before travel. Failed source checks do not prove cancellations; newly found dates are not guessed."
    }
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Energy events published:",len(selected),"pool:",len(all_events),"new official IESR:",len(added),"errors:",len(errors))
if __name__=="__main__":main()
