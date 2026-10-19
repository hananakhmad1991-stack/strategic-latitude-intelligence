#!/usr/bin/env python3
"""Static quality gate for public source-linked dashboard evidence."""
import json,pathlib,urllib.parse
root=pathlib.Path(__file__).resolve().parents[1]
obj=json.loads((root/"data/sli-research-unified-index.json").read_text(encoding="utf-8"))
audit=json.loads((root/"artifacts/sli-research-stage-review.json").read_text(encoding="utf-8"))
assert obj["schema"]=="sli-unified-research-index-v1"
assert obj["coverage"]["rows"]==len(obj["records"])
assert obj["coverage"]["datasets_scanned"]>=50
assert obj["coverage"]["datasets_indexed"]>=10
assert len(obj["records"])>=35
seen=set()
for d in obj["records"]:
 assert d["id"] not in seen
 seen.add(d["id"])
 assert d["id"].startswith("dashboard_")
 assert d["verification_status"] in ("source_link_record_not_independently_checked","project_stage_change_pending_review")
 u=urllib.parse.urlsplit(d["source_url"])
 assert u.scheme=="https" and u.netloc and not u.username and not u.password
 assert d["title"] and d["text"] and d["dataset"] and d["publisher"]
 assert "DASHBOARD SNAPSHOT" in d["text"]
 assert d["source_type"]=="public_dashboard_source_record_not_claim_verified"
 if d["verification_status"]=="project_stage_change_pending_review":
  assert "PROJECT_STATUS_CHANGE_PENDING_PRIMARY_REVIEW" in d["text"]
  assert any(x["project_id"].split("|")[0]==d["dataset"] for x in audit["changes"])
assert all(c["auto_promote"] is False for c in audit["changes"])
print("Research AI evidence index QA:",len(seen),"source records",obj["coverage"]["datasets_indexed"],"source-bearing datasets",len(audit["changes"]),"pending stage changes")
