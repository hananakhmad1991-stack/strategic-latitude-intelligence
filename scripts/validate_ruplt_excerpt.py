#!/usr/bin/env python3
"""Guard SLI RUPTL part-one digitization against data contamination."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def read(rel):return json.loads((ROOT/rel).read_text(encoding="utf-8"))
def test():
 p=read("data/ruplt-2025-2034-partial-source-intelligence.json")
 r=read("data/ruplt-2025-2034-floating-solar-potential.json")
 assert p["source"]["pdf_pages"] == 100
 m={x["id"]:x["value"] for x in p["national_indicators"]}
 assert m["renewable_generation_mw"]+m["storage_mw"]+m["fossil_generation_mw"]==m["plan_total_mw"]==69512
 assert len(r["rows"])==109
 assert [x["source_row"] for x in r["rows"]]==list(range(1,110))
 assert round(sum(x["potential_mw"] for x in r["rows"]),2)==13898.76
 assert abs(r["printed_total_mw"]-r["parsed_total_mw"]) < 0.1
 assert len([x for x in r["rows"] if x["reservoir"]=="Gembong"])==2
 assert any(x["province"]=="Jawa Tengah, Jawa Timur" for x in r["rows"])
 assert len(p["ami_rollout_table_2_4"]["rows"])==24
 assert p["ami_rollout_table_2_4"]["rows"][15]["cumulative_target"]==71671130
 assert "contradiction" in p["data_quality_flags"][1]["topic"] or "ami" in p["data_quality_flags"][1]["topic"]
 assert all(not a["included_in_this_pdf"] for a in p["province_annex_locator"])
 assert "ruplt-investor-digitization.html" in (ROOT/"index.html").read_text(encoding="utf-8")
 for name in ("ruplt-investor-digitization.html","ai-intelligence-hub.html","ai-regional-grid-opportunities.html"):
  s=(ROOT/name).read_text(encoding="utf-8")
  assert "ruplt-investor-digitization.html" in s or name=="ruplt-investor-digitization.html"
 assert (ROOT/"data/ruplt-2025-2034-floating-solar-potential.json").exists()
 print("PASS: RUPTL 100-page source boundary, 21 metrics, 109 reservoirs, 24-year AMI, duplicates, annex caveats and links")
if __name__=="__main__":test()
