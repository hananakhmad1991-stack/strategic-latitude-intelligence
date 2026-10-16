#!/usr/bin/env python3
"""Validate whole-SLI automation coverage and honest workflow/source health flags."""
import json
from pathlib import Path
from datetime import datetime
r=Path(__file__).resolve().parents[1]
cfg=json.loads((r/"data/sli-automation-policy.json").read_text(encoding="utf-8"))
d=json.loads((r/"data/sli-automation-health.json").read_text(encoding="utf-8"))
assert cfg["schema_version"]=="1.0"
assert d["schema_version"]=="1.0"
if d["audit_state"]=="awaiting_first_run":
    print("Audit not yet run, seed is not a success report.")
    raise SystemExit(0)
assert d["audit_state"] in ("complete","complete_with_api_warnings")
datetime.fromisoformat(d["generated_at_utc"].replace("Z","+00:00"))
paths={p.relative_to(r).as_posix() for p in (r/"data").glob("*.json")}
paths.discard("data/sli-automation-health.json")
seen={x["id"] for x in d["datasets"]}
assert paths==seen,("Unmapped data files",sorted(paths-seen)[:10],sorted(seen-paths)[:10])
workflows={p.name for p in (r/".github/workflows").glob("*.yml")}
mapped={x["id"] for x in d["workflows"]}
assert workflows==mapped,("Unmapped workflows",workflows-mapped)
modes=set(cfg["model"])
status={"source_edition_static","curated_not_automated","freshness_unknown","source_date_only",
"schedule_unknown","overdue","recent_check","workflow_failure","invalid_dataset"}
assert all(x["mode"] in modes and x["status"] in status for x in d["datasets"])
assert all(set(x["scheduled_writers"]).issubset(mapped) for x in d["datasets"])
assert all(x["last_run"] is None or x["last_run"]["url"].startswith("https://github.com/")
           for x in d["workflows"])
s=d["summary"]
assert s["datasets"]==len(d["datasets"])
assert s["workflows"]==len(d["workflows"])
assert s["scheduled_workflows"]==sum(x["scheduled"] for x in d["workflows"])
assert s["curated_or_archival_datasets"]==sum(x["mode"] in ("curated_snapshot","static_reference") for x in d["datasets"])
assert s["auto_numeric_datasets"]==sum(x["mode"]=="automated_numeric" for x in d["datasets"])
assert s["auto_discovery_datasets"]==sum(x["mode"]=="automated_discovery" for x in d["datasets"])
assert s["overdue_or_broken_datasets"]==sum(x["status"] in ("overdue","workflow_failure","invalid_dataset") for x in d["datasets"])
print("PASS all SLI datasets",len(d["datasets"]),"and workflows",len(d["workflows"]))
