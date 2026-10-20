#!/usr/bin/env python3
"""Audit newly retrieved official WDI observations against published SLI figures.
Candidate report only: never edits site JSON or claims API changes are verified.
"""
import json
import os
from pathlib import Path

PUBLISHED=Path("data/sli-environment-worldbank-wdi-indonesia.json")
CANDIDATE=Path("artifacts/sli-indonesia-environment-wdi-review.json")
OUT=Path("artifacts/sli-wdi-official-delta-review.json")

def run():
    baseline=json.loads(PUBLISHED.read_text(encoding="utf-8"))
    fresh=json.loads(CANDIDATE.read_text(encoding="utf-8"))
    original={(r["indicator_code"],r["year"]):r["value"] for r in baseline["observations"]}
    new={(r["indicator_code"],r["year"]):r["value"] for r in fresh["observations"]}
    additions=[{"indicator_code":k[0],"year":k[1],"value":v} for k,v in sorted(new.items()) if k not in original]
    revisions=[{"indicator_code":k[0],"year":k[1],"published":original[k],"candidate":v}
         for k,v in sorted(new.items()) if k in original and abs(v-original[k])>1e-9]
    gaps=sorted(set(m["indicator_code"] for m in baseline["indicators"])-set(m["indicator_code"] for m in fresh["indicators"]))
    report={"schema":"sli-national-wdi-delta-review-v1",
            "collected_at":fresh.get("collected_at"),"status":"review_only_never_auto_published",
            "country":"IDN","previous_observation_count":len(original),
            "candidate_observation_count":len(new),
            "added_observations":additions,"publisher_revisions":revisions,
            "missing_official_indicators":gaps,
            "unavailable_indicators":fresh.get("unavailable_indicators",[]),
            "review_requirements":"Source metadata, definition, year and unit must be validated before modifying production datasets. Changes do not replace site data automatically."}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    summary=Path(os.environ.get("GITHUB_STEP_SUMMARY","/dev/null"))
    with summary.open("a",encoding="utf-8") as f:
        f.write("### Indonesia WDI official source delta watch\\n\\n")
        f.write(f"New observations: **{len(additions)}**; publisher revisions: **{len(revisions)}**; unavailable codes: **{len(gaps)}**.\\n\\n")
        f.write("Status: review-only. No public dashboard values were changed.\\n")
    if additions or revisions or gaps:
        print("::warning::World Bank WDI changed or lacks indicators. Review audit artifact before promoting data.")
    else: print("WDI_SOURCE_NO_CHANGES")
if __name__=="__main__": run()
