#!/usr/bin/env python3
"""Detect candidate new publisher report/press-release links, never infer statistics."""
from concurrent.futures import ThreadPoolExecutor,as_completed
from datetime import datetime,timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin,urlsplit,urlunsplit
from urllib.request import Request,urlopen
import hashlib,json,re

ROOT=Path(__file__).resolve().parents[1]
CONF=json.loads((ROOT/"data/sli-publication-source-catalog.json").read_text(encoding="utf-8"))
DEST=ROOT/"data/sli-publication-watch.json"
PREV=json.loads(DEST.read_text(encoding="utf-8"))
NOW=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")

class Links(HTMLParser):
 def __init__(self):
  super().__init__();self.active=None;self.items=[]
 def handle_starttag(self,tag,attrs):
  if tag!="a":return
  href=dict(attrs).get("href")
  if href:self.active=[href,[]]
 def handle_data(self,s):
  if self.active:self.active[1].append(s)
 def handle_endtag(self,tag):
  if tag=="a" and self.active:
   href,words=self.active;self.items.append((href," ".join(" ".join(words).split())));self.active=None
def canonical(url):
 p=urlsplit(url)
 return urlunsplit((p.scheme,p.netloc.lower(),p.path.rstrip("/") or "/", "", ""))
def scan(s):
 result={"id":s["id"],"publisher":s["publisher"],"url":s["url"],"linked_datasets":s["datasets"],
   "health":"unavailable","last_attempt_utc":NOW,"observed_items":None,"error":None}
 try:
  req=Request(s["url"],headers={"User-Agent":"Mozilla/5.0 SLI-Open-Source-Report-Watcher/1.0","Accept":"text/html"})
  with urlopen(req,timeout=20) as resp:
   if "html" not in resp.headers.get("Content-Type","").lower():raise ValueError("Publisher returned non-HTML")
   raw=resp.read(1_100_000);final=resp.url
  parser=Links();parser.feed(raw.decode("utf-8","replace"))
  titles=re.compile(s["title_pattern"],re.I)
  hits=[];seen=set()
  for href,title in parser.items:
   title=" ".join(title.split())
   if len(title)<16 or len(title)>320 or not titles.search(title):continue
   candidate=urljoin(final,href)
   parsed=urlsplit(candidate)
   if parsed.scheme!="https" or parsed.netloc.lower() not in set(s["allowed_hosts"]):continue
   u=canonical(candidate)
   if u in seen or u==canonical(s["url"]):continue
   seen.add(u)
   key=hashlib.sha256((s["id"]+"|"+u).encode()).hexdigest()[:20]
   hits.append({"id":key,"publisher":s["publisher"],"source_id":s["id"],"title":title,
        "url":u,"linked_datasets":s["datasets"],"classification":"UNVERIFIED_SOURCE_EDITION_CANDIDATE"})
   if len(hits)>=45:break
  result["observed_items"]=len(hits)
  result["health"]="ok" if hits else "no_readable_publisher_links"
  if not hits:result["error"]="Publisher HTML returned no parseable matching anchors; no new-publication inference possible."
  return result,hits
 except Exception as error:
  result["error"]=type(error).__name__+": "+str(error)[:180]
  return result,[]
def main():
 prev_src={x["id"]:x for x in PREV.get("sources",[])}
 history={x["id"]:x for x in PREV.get("events",[])}
 statuses=[];new_ids=[]
 with ThreadPoolExecutor(max_workers=5) as pool:
  future={pool.submit(scan,s):s for s in CONF["sources"]}
  for f in as_completed(future):
   s=future[f];row,items=f.result()
   prior=prev_src.get(row["id"],{})
   baseline=bool(prior.get("last_success_utc"))
   row["last_success_utc"]=NOW if row["health"]=="ok" else prior.get("last_success_utc")
   if row["health"]=="ok":
    for item in items:
     if item["id"] in history:
      history[item["id"]]["last_seen_utc"]=NOW
      continue
     item.update(first_seen_utc=NOW,last_seen_utc=NOW,
                 review_state="pending_official_document_and_period_verification",
                 event_kind="new_candidate" if baseline else "initial_baseline")
     history[item["id"]]=item
     if baseline:new_ids.append(item["id"])
   statuses.append(row)
 statuses.sort(key=lambda a:a["id"])
 events=sorted(history.values(),key=lambda x:x["first_seen_utc"],reverse=True)[:200]
 result={"schema_version":"1.0","checked_at_utc":NOW,
         "state":"sources_scanned" if any(x["health"]=="ok" for x in statuses) else "all_sources_unavailable_or_unparsed",
         "source_count":len(statuses),
         "healthy_source_count":sum(x["health"]=="ok" for x in statuses),
         "scan_errors":sum(x["health"]!="ok" for x in statuses),
         "new_review_leads":len(new_ids),
         "events":events,"sources":statuses,"notes":CONF["notes"],
         "integrity":"No input datasets, reported national indicator values, legal status or project statuses are modified."}
 DEST.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 print(json.dumps({"sources":result["source_count"],"healthy":result["healthy_source_count"],
          "unavailable_or_unparsed":result["scan_errors"],"new_publisher_candidates":len(new_ids),
          "published_history":len(events)},ensure_ascii=False))
 for row in statuses:
  if row["health"]!="ok":print("SOURCE_REVIEW",row["id"],row["health"],row["error"])
if __name__=="__main__":main()
