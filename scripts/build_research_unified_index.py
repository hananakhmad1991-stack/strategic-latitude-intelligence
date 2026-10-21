#!/usr/bin/env python3
"""Deterministic, PUBLIC source-linked SLI dashboard index for owner-only research.
Scheduled builds MIRROR source-dated evidence; they do not fact-check, adjudicate
legal validity, promote project milestones, modify AI model weights, or use APIs.
"""
from __future__ import annotations
import argparse, hashlib, json, pathlib, re, urllib.parse
from collections import Counter
from itertools import chain
from sli_research_source_adapters import adapted_rows

ROOT=pathlib.Path(__file__).resolve().parents[1]
DATA=ROOT/"data"
INDEX=DATA/"sli-research-unified-index.json"
AUDIT=ROOT/"artifacts/sli-research-stage-review.json"
BASELINE=DATA/"sli-research-project-stage-baseline.json"

# Source-linked public dashboards only. No user data, private account artefacts or
# unreviewed news/event feeds; those already have distinct evidence channels.
EXCLUDE={
 "site-search-index.json","sli-secondary-news-index.json","sli-reviewed-secondary-news.json",
 "investment-news.json","investment-media.json","regulatory-monitor.json",
 "research-signal-radar.json","energy-ccs-updates.json","energy-events.json",
 "sli-publication-watch.json","sli-automation-health.json","sli-unified-glossary.json",
 "handbook-2025-pages.json","sli-research-unified-index.json",
 "sli-research-project-stage-baseline.json","sli-research-evidence-preview.json",
 "sli-research-province-preview.json","sli-research-assistant-config.json",
 "sli-verified-legal-provisions.json",
}
LIMIT_PER_DATASET=22
LIMIT_TOTAL=1400
MAX_BYTES=1250000
MAX_DEPTH=8
URL_FIELDS=("source_url","source","url","source_link","reference_url","publication_url")
TITLE_FIELDS=("project","name","title","label","indicator","metric_name","entity","operator","measure","commodity")
MEANING_FIELDS=(
 "stage","status","status_note","verification_class","review","value","unit","year",
 "period","source_date","evidence_date","date","updated_at","project_stage","actual_capex",
 "reported_amount","amount_basis","investment_basis","investment_usd_billion",
 "currency","it_capacity_mw_planned","operational_it_mw_verified","investor","location",
 "region","province","geo","operator","partners","topic","sector","target",
 "realization","note","storage_basis","mw","mw_kind","capacity_mw",
 "investment_kind","investment_usd_bn","investment_not_confirmed",
)
STAGE_SOURCES={"sli-project-registry.json":"records","energy-governance-ccs.json":"ccs.projects","ai-intelligence.json":"projects"}
SENSITIVE=re.compile(r"(?i)(password|api[_ -]?key|private[_ -]?key|access[_ -]?token|bearer|authorization|credential)")
DATE=re.compile(r"^(?:19|20)\d{2}(?:-\d{2}(?:-\d{2})?)?$")
def safeurl(x):
 if not isinstance(x,str):return None
 try:
  u=urllib.parse.urlparse(x.strip())
  if u.scheme!="https" or not u.hostname or u.username or u.password or u.port not in (None,443):return None
  # urlparse accepts pseudo-domains with spaces, e.g. https:// official source.
  if "." not in u.hostname or re.search(r"\s",u.hostname) or not re.fullmatch(r"[a-zA-Z0-9.-]+",u.hostname):return None
  if u.hostname in ("localhost","127.0.0.1") or u.hostname.endswith((".internal",".local")):return None
  return x.strip()[:700]
 except (ValueError,TypeError):return None
def clean(x,maxlen=180):
 if isinstance(x,bool):return str(x).lower()
 if not isinstance(x,(int,float,str)) or isinstance(x,str) and SENSITIVE.search(x):return ""
 return " ".join(str(x).split())[:maxlen]
def rec_source(row):
 for key in URL_FIELDS:
  if u:=safeurl(row.get(key)):return u
 return None
def rec_title(row):
 for key in TITLE_FIELDS:
  x=clean(row.get(key),160)
  if x and not x.lower().startswith("https:"):return x
 return None
def walk(value,path=(),depth=0):
 if depth>MAX_DEPTH:return
 if isinstance(value,dict):
  # A source must be local to a record, never inferred from an unrelated sibling.
  # Example/schema fields are documentation, never dated empirical observations.
  if len(path)>=1 and not any(p.lower() in ("schema","example","template") for p in path) and rec_source(value) and rec_title(value):
   yield path,value
  if depth<MAX_DEPTH:
   for key,child in value.items():
    if isinstance(child,(list,dict)) and not SENSITIVE.search(str(key)):
     yield from walk(child,path+(str(key),),depth+1)
 elif isinstance(value,list):
  for i,child in enumerate(value[:700]):yield from walk(child,path+(str(i),),depth+1)
def stage_entries(file_name,raw):
 pointer=STAGE_SOURCES.get(file_name)
 if not pointer:return {}
 obj=raw
 for p in pointer.split("."):
  obj=obj.get(p,{}) if isinstance(obj,dict) else {}
 if not isinstance(obj,list):return {}
 out={}
 for i,r in enumerate(obj):
  if not isinstance(r,dict):continue
  name=clean(r.get("id") or r.get("name") or r.get("project") or str(i),140)
  stage=clean(r.get("stage") or r.get("status"),120)
  if name and stage:out[file_name+"|"+name]=stage
 return out
def build():
 parser=argparse.ArgumentParser()
 parser.add_argument("--check",action="store_true",help="Fail when committed index is stale")
 parser.add_argument("--bootstrap-stage-baseline",action="store_true",help="Explicit operator-only action, do not use in CI")
 args=parser.parse_args()
 baseline={}
 if BASELINE.exists():baseline=json.loads(BASELINE.read_text(encoding="utf-8")).get("stages",{})
 stages={}
 coverage=[]
 rows=[];seen=set()
 for file in sorted(DATA.glob("*.json")):
  if file.name in EXCLUDE:
   coverage.append({"dataset":file.name,"indexed":0,"classification":"excluded_specialized_or_metadata"})
   continue
  try:raw=json.loads(file.read_text(encoding="utf-8"))
  except (UnicodeError,json.JSONDecodeError) as e:raise SystemExit(f"Malformed {file.name}: {e}")
  stages.update(stage_entries(file.name,raw))
  candidates=0
  # Food governance has 24 source-linked entities; keep all rather than drop two
  # due to the standard 22-record quota. Other datasets retain their normal cap.
  quota=30 if file.name=="sli-marine-fisheries-kkp.json" else (28 if file.name=="food-governance-hierarchy.json" else LIMIT_PER_DATASET)
  for path,r in chain(walk(raw),adapted_rows(file.name,raw)):
   # Source-curated KKP numeric observations only: never index estimate-only,
   # catalog-only thematic entries, or DCAT metadata as historic realized data.
   if file.name=="sli-marine-fisheries-kkp.json" and (not path or path[0] not in ("records","province_seaweed_2024")):continue
   if candidates>=quota or len(rows)>=LIMIT_TOTAL:break
   url=rec_source(r);title=rec_title(r)
   if not url or not title:continue
   # Dedupe exact source+title in same dataset; preserve distinct dated source references.
   sig=(file.name,title.lower(),url)
   if sig in seen:continue
   seen.add(sig)
   status=clean(r.get("stage") or r.get("status"),130)
   key=file.name+"|"+clean(r.get("id") or r.get("name") or r.get("project") or "",140)
   if key in baseline and status and status!=baseline[key]:
    status="PROJECT_STATUS_CHANGE_PENDING_PRIMARY_REVIEW"
   fields=[]
   for k in MEANING_FIELDS:
    if k=="stage" and status:
     fields.append("stage="+status);continue
    if k=="status" and status:
     fields.append("status="+status);continue
    if k in r:
     v=clean(r[k],220)
     if v and not v.lower().startswith("https:") and not (k=="status" and status):
      fields.append(k+"="+v)
   if not fields:continue
   date=clean(r.get("source_date") or r.get("evidence_date") or r.get("date") or r.get("period") or "",30)
   # Do not convert freshness checks into publisher dates.
   if not DATE.fullmatch(date):date="publication_date_unconfirmed"
   pointer="/".join(path)
   docid=hashlib.sha256((file.name+"|"+pointer+"|"+url).encode()).hexdigest()[:18]
   rows.append({
    "id":"dashboard_"+docid,"dataset":file.name,"path":pointer,
    "title":title,"source_url":url,"period":date,
    "publisher":clean(r.get("publisher") or r.get("operator") or r.get("entity") or "Public source (publisher unconfirmed)",90),
    "source_type":"public_dashboard_source_record_not_claim_verified",
    "verification_status":"project_stage_change_pending_review" if status=="PROJECT_STATUS_CHANGE_PENDING_PRIMARY_REVIEW" else "source_link_record_not_independently_checked",
    "text":"DASHBOARD SNAPSHOT (not an independent fact-check). "+
     title+". "+"; ".join(fields)[:570]+". Source URL belongs to this record; verify published article and observation period."
   })
   candidates+=1
  coverage.append({"dataset":file.name,"indexed":candidates,
   "classification":"source_linked_evidence" if candidates else "unindexed_no_safe_source_linked_records"})
  if len(rows)>=LIMIT_TOTAL:break
 report={"schema":"sli-unified-research-index-v1","policy":
  "Public SLI dashboard indexed excerpts with record-level HTTPS sources. Never treat as current primary documents, original article review, certified project stage or auto-retrained model.",
  "coverage":{"datasets_scanned":len(coverage),"datasets_indexed":sum(bool(x["indexed"]) for x in coverage),
   "rows":len(rows),"datasets":coverage},"records":rows}
 output=(json.dumps(report,ensure_ascii=False,sort_keys=True,separators=(",",":"))+"\n")
 if len(output.encode())>MAX_BYTES:raise SystemExit("Index exceeds safe Worker/network transfer limit")
 changes=[{"project_id":k,"approved_stage":baseline[k],"candidate_stage":v,
           "review":"needs_original_operator_or_regulator_release","auto_promote":False}
          for k,v in stages.items() if k in baseline and baseline[k]!=v]
 audit={"schema":"sli-project-review-queue-v1","requires_human_review":bool(changes),"changes":changes,
        "source":"PUBLIC SLI dashboard current project record vs approved stage snapshot; not a verified event"}
 if args.bootstrap_stage_baseline:
  BASELINE.write_text(json.dumps({"schema":"sli-approved-stage-v1","note":"Snapshot of existing publicly curated stage labels. DO NOT auto-update: a proposed change requires primary-source review.","stages":stages},indent=2,ensure_ascii=False,sort_keys=True)+"\n",encoding="utf-8")
  print("Operator-only baseline bootstrap saved; DO NOT run in scheduled CI.")
 elif not BASELINE.exists():raise SystemExit("Missing reviewed stage baseline. Bootstrap explicitly outside CI.")
 AUDIT.parent.mkdir(parents=True,exist_ok=True)
 AUDIT.write_text(json.dumps(audit,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 if args.check:
  if not INDEX.exists() or INDEX.read_text(encoding="utf-8")!=output:raise SystemExit("RESEARCH_INDEX_STALE: regenerate from current public dashboard datasets")
 else:INDEX.write_text(output,encoding="utf-8")
 print("Indexed",len(rows),"records from",report["coverage"]["datasets_indexed"],"of",len(coverage),"public datasets;",len(changes),"stage change candidates")
if __name__=="__main__":build()
