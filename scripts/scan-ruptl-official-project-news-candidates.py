#!/usr/bin/env python3
"""Read-only official PLN/ESDM/operator RUPTL project-name mention discovery.

NO article text or project name match is an approved project status; editorial
review of project identity, unit/capacity, event type and exact date is required.
"""
import html
import json
import re
import ssl
import unicodedata
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

PAGES=[
 ("PLN", "https://www.pln.co.id/news/press-release", "www.pln.co.id"),
 ("ESDM Berita", "https://www.esdm.go.id/id/media-center/arsip-berita", "www.esdm.go.id"),
 ("ESDM Siaran Pers", "https://www.esdm.go.id/id/media-center/siaran-pers", "www.esdm.go.id"),
 ("Medco Power operator evidence", "https://medcopower.co.id/id/project/medco-solar-bali-timur/", "medcopower.co.id"),
 ("Indo Raya Tenaga operator evidence", "https://www.irt.co.id/id_ID/2025/05/plant-commercial-operation-date-cod/", "www.irt.co.id")
]
class Links(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True)
  self.anchor_url=None;self.parts=[];self.links=[]
 def handle_starttag(self,tag,attrs):
  if tag=="a" and self.anchor_url is None:
   self.anchor_url=dict(attrs).get("href");self.parts=[]
 def handle_data(self,value):
  if self.anchor_url is not None:self.parts.append(value)
 def handle_endtag(self,tag):
  if tag=="a" and self.anchor_url is not None:
   self.links.append((self.anchor_url," ".join(" ".join(self.parts).split())))
   self.anchor_url=None;self.parts=[]

def normalize(txt):
 txt=unicodedata.normalize("NFKC",txt).casefold()
 return re.sub(r"[^a-z0-9]+"," ",txt).strip()
def mentions(title,terms):
 n=" "+normalize(title)+" "
 return [x for x in terms if " "+normalize(x)+" " in n]
def get_html(url,allowed_host):
 req=Request(url,headers={"User-Agent":"SLI-Evidence-Candidate-Review/1.0","Accept":"text/html"})
 with urlopen(req,timeout=22,context=ssl.create_default_context()) as response:
  host=urlparse(response.geturl()).hostname
  if host!=allowed_host:raise ValueError("Source redirected outside approved publisher host")
  raw=response.read(850000)
  typ=response.headers.get("Content-Type","").lower()
  if "html" not in typ:raise ValueError("Source response was not HTML")
 return raw.decode("utf-8",errors="replace")

def main():
 src=json.loads(Path("data/sli-ruptl-provincial-source-projects-2025.json").read_text())
 older=json.loads(Path("data/sli-ruptl-primary-pdf-2025-2034.json").read_text())
 terms=list(set([x["source_project_label"] for x in src["source_rows"]]+
               [x["project_name"] for x in older["individual_project_source_records"]["records"]]))
 # Very short/generic labels are too prone to matching generic locality pages.
 terms=[x for x in terms if len(normalize(x))>=7 and
         normalize(x) not in {"jawa bali 2","jawa bali 3","jawa bali 6"}]
 pages=[];found={}
 for publisher,url,host in PAGES:
  page={"publisher":publisher,"source_url":url,"status":None}
  try:
   raw=get_html(url,host);reader=Links();reader.feed(raw)
   page["status"]="source_html_read_candidate_only"
   page["anchors_checked"]=len(reader.links)
   for href,title in reader.links:
    if not title or not href:continue
    destination=urljoin(url,html.unescape(href))
    parsed=urlparse(destination)
    if parsed.scheme not in ("https",) or parsed.hostname not in ("www.pln.co.id","web.pln.co.id","www.esdm.go.id","medcopower.co.id","www.irt.co.id"):continue
    hit=mentions(title,terms)
    if not hit:continue
    key=(destination,publisher)
    found[key]={"source_publisher":publisher,"article_candidate_url":destination,
      "linked_anchor_text":title[:220],"matched_project_label_candidates":sorted(set(hit)),
      "original_event_date":None,"actual_COD":None,"observed_capacity":None,
      "candidate_status":"mention_in_official_page_link_review_required"}
  except Exception as exc:
   page["status"]="source_transport_or_format_unavailable"
   page["warning"]=type(exc).__name__+":"+str(exc)[:200]
  pages.append(page)
 output={
 "schema":"sli-ruplt-official-announcement-mention-watch-v1",
 "checked_at":datetime.now(timezone.utc).isoformat(),
 "source_pages":pages,
 "matched_link_candidates":list(found.values())[:120],
 "candidate_count":len(found),
 "status":"review_only_no_numeric_promotion",
 "auto_published_project_status_changes":0,
 "method_limit":"Official newsroom link titles only; match does NOT confirm same asset, physical commissioning, COD, implementation stage or contract. Known operator pages monitored for availability; exact historic approved observations live separately.",
 "editor_checklist":["Open official article and check its own publication/event dates",
 "Match generating unit, technology, exact project name, and geographic system to RUPTL source row",
 "Verify whether event concerns plant, transmission, substation, tender, or announcement",
 "Compare installed MW, MWp, MWac, MWh and source table definitions before capacity comparison",
 "Add an independently reviewed dated event only via GitHub PR, never from watcher output alone"]
 }
 p=Path("artifacts/sli-ruplt-official-news-candidates-review-only.json")
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n")
 print("RUPTL_OFFICIAL_SOURCE_WATCH pages="+str(len(pages))+" readable="+str(sum(x["status"]=="source_html_read_candidate_only" for x in pages))+
       " candidate_links="+str(output["candidate_count"])+" auto_approved=0")
if __name__=="__main__": main()
