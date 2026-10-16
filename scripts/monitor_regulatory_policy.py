#!/usr/bin/env python3
"""Source-attributed regulatory candidate monitor. Never changes legal in-force status."""
from __future__ import annotations
import datetime as dt
import hashlib
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import requests
from bs4 import BeautifulSoup

ROOT=Path(__file__).resolve().parents[1]
CONF=ROOT/"data/regulatory-monitor-sources.json"
OUT=ROOT/"data/regulatory-monitor.json"
GRAPH=ROOT/"data/sli-policy-regulatory-graph-2026.json"
USER_AGENT="Mozilla/5.0 (compatible; SLI-RegulatorySourceReview/1.0; public research)"
SESSION=requests.Session()
SESSION.headers.update({"User-Agent":USER_AGENT,"Accept":"text/html,application/xhtml+xml"})
REGULATION_PATTERN=re.compile(r"(?:peraturan|undang.undang|keputusan|instruksi|perda|perpres|permen|ruu|rancangan)",re.I)
MAINTENANCE_PATTERN=re.compile(r"(sistem sedang dalam perbaikan|under maintenance|website sedang dalam perbaikan|layanan sementara tidak tersedia)",re.I)
TERMS={
 "electricity":["listrik","pln","ketenagalistrikan","gardu","pembangkit","transmisi","ruptl","rued","plts","pltu","plta","pltn"],
 "energy":["energi","ebt","biodiesel","biofuel","transisi","efisiensi","konservasi"],
 "oilgas":["migas","minyak","bbm","gas bumi","kilang","hulu","lpg","lng","gasifikasi"],
 "minerba":["minerba","mineral","nikel","batubara","smelter","tambang","hilirisasi"],
 "digital":["data center","pusat data","komdigi","kecerdasan buatan","artificial intelligence","cloud","ai ","pdp","siber"],
 "environment":["lingkungan","amdal","karhutla","emisi","air limbah","polusi"],
 "carbon":["karbon","ccs","ccus","iklim","emisi","perdagangan karbon"],
 "cross":["perizinan","investasi","oss","cipta kerja","omnibus","peraturan","perda","permen","perpres","undang-undang"]
}
def iso_now():return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
def clean(s):return re.sub(r"\s+"," ",s or "").strip()
def stable_url(url):
 p=urlsplit(url)
 return urlunsplit((p.scheme,p.netloc.lower(),p.path.rstrip("/") or "/", "", ""))
def sha(s):return hashlib.sha256(s.encode("utf-8")).hexdigest()
def get(url):
 try:
  r=SESSION.get(url,timeout=(8,19),allow_redirects=True)
  r.raise_for_status()
  if len(r.content)>4_000_000:raise ValueError("HTML exceeds 4 MB")
  if "pdf" in r.headers.get("content-type","").lower():raise ValueError("PDF response not HTML")
  doc=BeautifulSoup(r.text,"html.parser")
  if MAINTENANCE_PATTERN.search(clean(doc.get_text(" ",strip=True))[:3500]):
   raise ValueError("official portal in maintenance mode")
  return r,doc,None
 except Exception as e:
  return None,None,f"{type(e).__name__}: {str(e)[:175]}"
def classify(title,keywords):
 low=title.casefold()
 score=sum(1 for term in keywords if term in low)
 if not score:return None
 sectors=[s for s,words in TERMS.items() if any(x in low for x in words)]
 return {"sectors":sectors or ["cross"],"relevance_hits":score}
def listing(cfg,keywords):
 r,doc,error=get(cfg["url"])
 if error:return None,error
 out=[]
 seen=set()
 hostset=set(cfg["allowed_hosts"])
 for a in doc.find_all("a",href=True):
  title=clean(a.get_text(" ",strip=True))
  if len(title)<22 or len(title)>280:continue
  info=classify(title,keywords)
  if not info:continue
  url=urljoin(r.url,a["href"].strip())
  parsed=urlsplit(url)
  if parsed.scheme!="https" or parsed.netloc.lower() not in hostset:continue
  if not any(parsed.path.startswith(p) for p in cfg["allowed_path_prefixes"]):continue
  if stable_url(url)==stable_url(cfg["url"]):continue
  if stable_url(url) in seen:continue
  seen.add(stable_url(url))
  wrapper=a.find_parent(["article","li","div"]) or a.parent
  snippet=clean(wrapper.get_text(" ",strip=True))[:320] if wrapper else ""
  out.append({"id":sha(cfg["id"]+"|"+stable_url(url))[:20],"title":title,
      "url":stable_url(url),"issuer":cfg["label"],"source_id":cfg["id"],
      "kind":"official_regulation_candidate" if cfg["class"]=="official_regulation_listing" and REGULATION_PATTERN.search(title) else "official_policy_news",
      "classification":"unverified_primary_document_candidate","sectors":info["sectors"],
      "preview":snippet,"has_exact_instrument_number":bool(re.search(r"(?:nomor|no[.]?)\s*\d+.*(?:19|20)\d{2}",title,re.I))})
  if len(out)>=cfg["limit"]:break
 return out,None
def detail_digest(doc):
 # Restrict changes to title and metadata; never use changing navigation lists.
 title=clean((doc.find("h1") or doc.find("h2")).get_text(" ",strip=True)) if (doc.find("h1") or doc.find("h2")) else ""
 og=doc.find("meta",attrs={"property":"og:title"})
 if not title and og: title=clean(og.get("content",""))
 if not title and doc.title:title=clean(doc.title.get_text(" ",strip=True))
 descr=doc.find("meta",attrs={"name":"description"})
 description=clean(descr.get("content",""))[:350] if descr else ""
 if not title or len(title)<8 or "database peraturan" in title.casefold() or "sistem sedang" in title.casefold():
  return None
 return {"headline":title[:250],"digest":sha(clean(title.casefold()+"|"+description.casefold()))[:24],"description":description}
def main():
 conf=json.loads(CONF.read_text(encoding="utf-8"))
 graph=json.loads(GRAPH.read_text(encoding="utf-8"))
 old=json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
 now=iso_now()
 previous={x["id"]:x for x in old.get("sources",[])}
 prev_events={x["id"]:x for x in old.get("events",[])}
 legal_previous=old.get("watched_law_records",{})
 records=[]
 events=list(prev_events.values())
 added=[]
 fresh_sources=0
 keywords=[k.casefold() for k in conf["keywords"]]
 for cfg in conf["listing_sources"]:
  old_src=previous.get(cfg["id"],{})
  items,err=listing(cfg,keywords)
  record={"id":cfg["id"],"label":cfg["label"],"url":cfg["url"],
          "category":cfg["class"],"last_attempt_utc":now,
          "last_success_utc":now if err is None else old_src.get("last_success_utc"),
          "health":"ok" if err is None else "error","error":err,"observed_items":len(items) if items is not None else None,
          "previous_successful_baseline":bool(old_src.get("last_success_utc"))}
  if not err:
   fresh_sources+=1
   for item in items:
    if item["id"] in prev_events:
     prev_events[item["id"]]["last_seen_utc"]=now
     continue
    item["first_seen_utc"]=now
    item["last_seen_utc"]=now
    item["event_kind"]="new_candidate" if record["previous_successful_baseline"] else "baseline_observation"
    item["legal_status_update"]="NOT_AUTOMATICALLY_VERIFIED"
    item["review_state"]="pending_source_text_and_legal_review"
    events.append(item)
    if item["event_kind"]=="new_candidate":added.append(item["id"])
  records.append(record)
 # Watch direct official legal records separately. A changed title/metadata is an alert,
 # NEVER the legal conclusion that an instrument was amended or repealed.
 law_index={n["id"]:n for n in graph["nodes"]}
 watched={}
 for lawid in conf["watched_laws"]:
  node=law_index.get(lawid)
  if not node:continue
  old_item=legal_previous.get(lawid,{})
  r,doc,err=get(node["source"])
  parsed=detail_digest(doc) if not err else None
  if not err and parsed is None:err="Unreliable detail-page extraction"
  current={"id":lawid,"reference":node["ref"],"source_url":node["source"],
           "health":"error" if err else "ok",
           "last_attempt_utc":now,
           "last_success_utc":now if not err else old_item.get("last_success_utc"),
           "error":err,
           "digest":parsed["digest"] if parsed else old_item.get("digest"),
           "last_known_headline":parsed["headline"] if parsed else old_item.get("last_known_headline"),
           "latest_candidate_review":"no_new_change_detected" if not err else "source_unavailable"}
  if not err and old_item.get("digest") and old_item["digest"]!=parsed["digest"]:
   current["latest_candidate_review"]="source_page_metadata_changed_review_required"
   eventid=sha("law_detail|"+lawid+"|"+parsed["digest"])[:20]
   if eventid not in prev_events:
    ev={"id":eventid,"title":node["ref"]+" — official detail page changed",
      "url":node["source"],"issuer":node.get("owner") or "Official register",
      "source_id":"law_detail_"+lawid,"kind":"official_document_metadata_changed",
      "classification":"unverified_document_update","sectors":[node["sector"]],
      "preview":"Page headline/metadata fingerprint changed. Compare actual text and amendment/repeal clauses before updating any legal status.",
      "first_seen_utc":now,"last_seen_utc":now,"event_kind":"new_candidate",
      "legal_status_update":"NOT_AUTOMATICALLY_VERIFIED",
      "review_state":"pending_source_text_and_legal_review"}
    events.append(ev);added.append(eventid)
  watched[lawid]=current
 events=sorted(events,key=lambda v:v.get("first_seen_utc",""),reverse=True)[:conf.get("item_retention",150)]
 pending=sum(e["event_kind"]=="new_candidate" and e["review_state"].startswith("pending") for e in events)
 status="sources_available" if fresh_sources else "all_listing_sources_unavailable"
 result={"schema_version":"1.0","checked_at_utc":now,"monitoring_status":status,
         "legal_status_update_policy":"All discovered changes are candidates, not confirmed enactments, amendments or repeals. Legal register is not auto-overwritten.",
         "latest_new_candidates_count":len(added),"pending_candidate_review":pending,
         "successful_listing_sources":fresh_sources,"total_listing_sources":len(records),
         "sources":records,"watched_law_records":watched,"events":events,
         "monitoring_scope":"Public Indonesian legislation and policy news relevant to SLI energy, mineral, oilgas, environment, carbon, AI and investment",
         "notes":["Law issuer source downtime is reported explicitly and not interpreted as no changes.",
                  "Source page fingerprint is title/description only; status changes require legal text/official status verification.",
                  "First successful source scan is a baseline, not an invented historical alert.",
                  "News articles and draft consultations are not enacted regulation."]}
 OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"status":status,"listing_ok":fresh_sources,"listing_total":len(records),
                   "new_candidates":len(added),"observations_retained":len(events),
                   "source_errors":{s["id"]:s["error"] for s in records if s["error"]}},ensure_ascii=False))
 if not fresh_sources:
  print("WARNING: No listing sources accessible; preserve preexisting data and do not infer no changes.")
if __name__=="__main__":
 main()
