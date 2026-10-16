#!/usr/bin/env python3
"""Ensure all SLI entry pages have live source-JSON delivery, and audit coverage exists."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
pages=sorted(root.glob("*.html"))
assert len(pages)>=20
for page in pages:
    text=page.read_text(encoding="utf-8")
    assert "js/sli-live-data.js" in text,(page.name,"missing fresh-source transport")
    assert "</head>" in text,(page.name,"missing head")
    assert text.count("js/sli-live-data.js")==1,(page.name,"duplicate live data loader")
live=(root/"js/sli-live-data.js").read_text(encoding="utf-8")
assert "raw.githubusercontent.com/hananakhmad1991-stack/strategic-latitude-intelligence/main/data/" in live
assert "cache:'no-store'" in live
assert "pages_fallback" in live
assert "window.fetch=function" in live
assert "method!=='GET'" in live
assert "url.origin!==location.origin" in live
index=(root/"index.html").read_text(encoding="utf-8")
assert "sliAutomationHealthRoot" in index and "initSLIAutomationHealth" in index
assert (root/"sli-data-automation-center.html").exists()
healthjs=(root/"js/sli-automation-health-dashboard.js").read_text(encoding="utf-8")
assert "sliAutomationCenterRoot" in healthjs and "sliAutomationHealthRoot" in healthjs
assert "curated_snapshot" in healthjs and "automated_numeric" in healthjs
health=json.loads((root/"data/sli-automation-health.json").read_text(encoding="utf-8"))
assert health["schema_version"]=="1.0"
print("PASS:",len(pages),"HTML dashboards with source-JSON live transport and full health control")
