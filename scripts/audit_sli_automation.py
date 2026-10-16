#!/usr/bin/env python3
"""Whole-SLI dataset automation coverage + source freshness/Actions health audit.

This script OBSERVES source metadata, commits, and workflows. It does NOT modify
official statistics, project statuses, legal force, named officials or raw evidence.
A recent workflow success does not guarantee correctness of a publisher's data.
"""
import concurrent.futures
import datetime as dt
import json
import os
import pathlib
import re
import urllib.error
import urllib.request
from collections import Counter
from typing import Optional

ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data/sli-automation-health.json"
CONF=json.loads((ROOT/"data/sli-automation-policy.json").read_text(encoding="utf-8"))
NOW=dt.datetime.now(dt.timezone.utc)
WORKFLOW_ROOT=ROOT/".github/workflows"
KEYS=("checked_at_utc","last_success_utc","generated_at_utc","generated_at","updated_at","last_refresh_attempt_utc","as_of","updated","date_wib","last_source_audit","reference_year")
TIME_PATTERNS=("checked_at_utc","generated_at_utc","last_success_utc","generated_at","updated_at","as_of","updated","date_wib","last_source_audit")
REPO=os.getenv("GITHUB_REPOSITORY","hananakhmad1991-stack/strategic-latitude-intelligence")
TOKEN=os.getenv("GITHUB_TOKEN","")
USER_AGENT="SLI-Public-Dataset-Freshness-Audit/1.0"

def now_iso():return NOW.replace(microsecond=0).isoformat().replace("+00:00","Z")
def dateparse(value):
    if value is None or isinstance(value,bool):return None
    try:
        if isinstance(value,(int,float)):
            if not 1980<=value<=2200:return None
            return dt.datetime(int(value),12,31,tzinfo=dt.timezone.utc)
        s=str(value).strip()
        if re.fullmatch(r"20\d{2}",s):return dt.datetime(int(s),12,31,tzinfo=dt.timezone.utc)
        result=dt.datetime.fromisoformat(s.replace("Z","+00:00"))
        return result.replace(tzinfo=dt.timezone.utc) if result.tzinfo is None else result.astimezone(dt.timezone.utc)
    except (ValueError,OverflowError,TypeError):return None

def expected_hours(crons):
    intervals=[]
    for cron in crons:
        p=cron.split()
        if len(p)!=5:continue
        minute,hour,day,month,weekday=p
        if month!="*" or day!="*":intervals.append(31*24);continue
        if weekday!="*":intervals.append(7*24);continue
        if hour.startswith("*/"):
            try:intervals.append(float(hour[2:]));continue
            except ValueError:pass
        if hour=="*":
            if re.fullmatch(r"\d+,\d+",minute):
                nums=sorted(map(int,minute.split(",")))
                intervals.append(min(nums[1]-nums[0],60-nums[1]+nums[0])/60)
            else:intervals.append(1)
            continue
        if "," in hour:
            try:
                hours=sorted(int(x) for x in hour.split(","))
                intervals.append(min(b-a for a,b in zip(hours,hours[1:]+[hours[0]+24])))
            except (ValueError,TypeError):intervals.append(24)
        else:intervals.append(24)
    return min(intervals) if intervals else None

def get_workflows():
    records=[]
    for path in sorted(WORKFLOW_ROOT.glob("*.yml")):
        src=path.read_text(encoding="utf-8")
        crons=[m.group(1).strip() for m in re.finditer(r"^\s*-\s*cron:\s*['\"]?([^'\"\n]+)",src,re.M)]
        exports=[]
        for line in src.splitlines():
            if "git add" in line and not line.lstrip().startswith("#"):
                exports.extend(re.findall(r"data/[A-Za-z0-9_.\-/]+\.json",line))
        exports=sorted(set(exports))
        n=re.search(r"^name:\s*(.*?)\s*$",src,re.M)
        records.append({"id":path.name,"name":n.group(1).strip("'\"") if n else path.name,
                        "scheduled":bool(crons),"cron":crons,"manual_dispatch":"workflow_dispatch:" in src,
                        "expected_interval_hours":expected_hours(crons),
                        "datasets_written":exports,"last_run":None})
    return records

def lookup_workflow_run(w):
    if not TOKEN:
        return w["id"],None,"GITHUB_TOKEN unavailable; workflow status cannot be checked."
    url=f"https://api.github.com/repos/{REPO}/actions/workflows/{w['id']}/runs?per_page=1&branch=main"
    request=urllib.request.Request(url,headers={"Authorization":"Bearer "+TOKEN,
                     "Accept":"application/vnd.github+json","User-Agent":USER_AGENT,
                     "X-GitHub-Api-Version":"2022-11-28"})
    try:
        with urllib.request.urlopen(request,timeout=15) as response:
            payload=json.loads(response.read(220_000))
        runs=payload.get("workflow_runs",[])
        if not runs:return w["id"],None,None
        run=runs[0]
        return w["id"],{"status":run.get("status"),"conclusion":run.get("conclusion"),
             "created_at":run.get("created_at"),"updated_at":run.get("updated_at"),
             "url":run.get("html_url"),"event":run.get("event"),
             "workflow_run_id":run.get("id")},None
    except Exception as err:
        return w["id"],None,f"{type(err).__name__}: {str(err)[:160]}"

def mode_for(path,writers):
    override=CONF.get("overrides",{}).get(path)
    if override:return override["mode"]
    lower=path.lower()
    if any(k in lower for k in ("2025","2024","geojson","handbook","statistic","source-register","source-inventory","source-catalog")) and not writers:
        return "static_reference"
    if not writers:return "curated_snapshot"
    if any(k in lower for k in ("-assessment","daily-energy-assessment")):return "computed_from_sources"
    if any(k in lower for k in ("-watch","-monitor","-leads","-news","-events","-actor","-leadership","-radar","forbes")):
        return "automated_discovery"
    return "automated_numeric"

def category(path):
    short=path.split("/")[-1]
    for name,prefixes in CONF["categories"].items():
        if any(short.startswith(p) for p in prefixes):return name
    return "Other / Reference"

def read_metadata(path):
    try:
        info=json.loads((ROOT/path).read_text(encoding="utf-8"))
        if not isinstance(info,dict):
            return {},None,"Top-level JSON is not an object"
        metadata={}
        for k in KEYS:
            if k in info and isinstance(info[k],(str,int,float)):
                metadata[k]=info[k]
        stamps=[(k,dateparse(info.get(k))) for k in TIME_PATTERNS if k in info]
        stamps=[(k,v) for k,v in stamps if v is not None and v<=NOW+dt.timedelta(days=3)]
        timestamp=next(iter(stamps),None)
        return metadata,timestamp,None
    except Exception as error:
        return {},None,type(error).__name__+": "+str(error)[:150]

def status_for(mode,stamp,writers):
    if not writers:return ("source_edition_static" if mode=="static_reference" else "curated_not_automated"),None
    if not stamp:return "freshness_unknown",None
    key,value=stamp
    if key not in ("checked_at_utc","generated_at_utc","last_success_utc","generated_at","updated_at","last_refresh_attempt_utc"):
        return "source_date_only",None
    h=max(0,(NOW-value).total_seconds()/3600)
    intervals=[x["expected_interval_hours"] for x in writers if x["expected_interval_hours"]]
    if not intervals:return "schedule_unknown",round(h,2)
    cadence=min(intervals)
    grace=max(8,cadence*3)
    return ("overdue" if h>grace else "recent_check"),round(h,2)

def main():
    workflows=get_workflows()
    automated=[w for w in workflows if w["scheduled"]]
    api_errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        future=[pool.submit(lookup_workflow_run,w) for w in automated]
        for task in concurrent.futures.as_completed(future):
            ident,result,error=task.result()
            entry=next(w for w in workflows if w["id"]==ident)
            entry["last_run"]=result
            if error:api_errors[ident]=error
    dataset_rows=[]
    for file in sorted((ROOT/"data").glob("*.json")):
        path=file.relative_to(ROOT).as_posix()
        if path=="data/sli-automation-health.json":continue
        writers=[w for w in workflows if path in w["datasets_written"] and w["scheduled"]]
        mode=mode_for(path,writers)
        meta,stamp,error=read_metadata(path)
        status,age=status_for(mode,stamp,writers)
        overrides=CONF.get("overrides",{}).get(path,{})
        worst=[w for w in writers if w["last_run"] and w["last_run"].get("conclusion")=="failure"]
        if worst:status="workflow_failure"
        if error:status="invalid_dataset"
        note=overrides.get("note") or ({
            "curated_snapshot":"Dataset persists until a new source edition is verified and edited.",
            "static_reference":"Historical geographic/report reference; source year is not today's observation.",
            "automated_discovery":"Source/news candidate monitor, not a verified project or legal status change.",
            "automated_numeric":"Automatic numeric-source ingestion; check publisher date and source errors.",
            "computed_from_sources":"Derived calculation from current input feeds; not independent validation."
        }).get(mode,"")
        dataset_rows.append({
            "id":path,"group":category(path),"mode":mode,
            "priority":overrides.get("priority","normal"),"status":status,
            "last_record_key":stamp[0] if stamp else None,
            "last_record_utc":stamp[1].isoformat().replace("+00:00","Z") if stamp else None,
            "age_hours_since_record":age,"publisher_metadata":meta,
            "scheduled_writers":[w["id"] for w in writers],
            "cadence_hours":min([w["expected_interval_hours"] for w in writers if w["expected_interval_hours"]],default=None),
            "note":note,"error":error})
    workflow_failures=[w for w in workflows if w["last_run"] and w["last_run"].get("conclusion") in ("failure","cancelled","timed_out")]
    numeric=[x for x in dataset_rows if x["mode"]=="automated_numeric"]
    discovery=[x for x in dataset_rows if x["mode"]=="automated_discovery"]
    static=[x for x in dataset_rows if x["mode"] in ("curated_snapshot","static_reference")]
    overdue=[x for x in dataset_rows if x["status"] in ("overdue","workflow_failure","invalid_dataset")]
    unmanaged=[x for x in dataset_rows if not x["scheduled_writers"]]
    result={
        "schema_version":"1.0","generated_at_utc":now_iso(),
        "audit_state":"complete_with_api_warnings" if api_errors else "complete",
        "scope":"All data/*.json files and all .github/workflows/*.yml files in main at audit time.",
        "source_semantics":"Workflow freshness does not guarantee source completeness or official verification. News candidates do not modify legal status/project operations. Static historical vintages are not current observations.",
        "transport":"Data-backed SLI pages fetch latest public GitHub main JSON with GitHub Pages fallback; if fallback occurs, freshness may lag.",
        "summary":{"datasets":len(dataset_rows),"workflows":len(workflows),
            "scheduled_workflows":len(automated),"auto_numeric_datasets":len(numeric),
            "auto_discovery_datasets":len(discovery),"curated_or_archival_datasets":len(static),
            "other_datasets":len(dataset_rows)-len(numeric)-len(discovery)-len(static),
            "overdue_or_broken_datasets":len(overdue),"unmanaged_datasets":len(unmanaged),
            "workflow_failures_latest":len(workflow_failures),
            "workflow_status_api_errors":len(api_errors)},
        "attention":[{"kind":"dataset","id":x["id"],"status":x["status"],"note":x["note"]}
                      for x in overdue[:30]]+
                     [{"kind":"workflow","id":w["id"],"status":w["last_run"]["conclusion"],
                       "note":"Latest recorded GitHub Actions run not successful."} for w in workflow_failures[:20]],
        "api_errors":api_errors,
        "workflows":workflows,"datasets":dataset_rows,
        "operational_rules":[
            "Automatic source ingestion is limited to explicitly scheduled and source-linked numeric feeds.",
            "Other releases are detected as review leads and cannot overwrite verified project, regulatory, official appointments, legal or PDF extract states.",
            "A workflow success is code-execution evidence only, not a claim every provider value is updated.",
            "Source-specific observation date, unit, geographic coverage and extraction limitations are retained.",
            "An unavailable official source or missing timestamp must be shown, not converted to zero/no change.",
            "GitHub Actions scheduling is best-effort; snapshot generated timestamp is a monitoring run time."]
    }
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(result["summary"],ensure_ascii=False))
    for w in workflow_failures:print("WORKFLOW_ATTENTION:",w["id"],w["last_run"]["conclusion"])
    for row in overdue[:25]:print("DATA_ATTENTION:",row["id"],row["status"])
    if api_errors:print("API_READ_WARNINGS",len(api_errors))
if __name__=="__main__":main()
