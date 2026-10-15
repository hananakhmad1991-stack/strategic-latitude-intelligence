#!/usr/bin/env python3
"""Fail publication if core SLI datasets contradict provenance or structural requirements."""
import json,pathlib,datetime as dt,sys
root=pathlib.Path(__file__).resolve().parents[1]
errors=[]
def read(path):
 try:return json.loads((root/path).read_text(encoding="utf-8"))
 except Exception as e:errors.append(f"{path}: {e}");return {}
trade=read("data/commodity-trade-flows.json")
products=trade.get("bilateral",{}).get("products",[])
ids=[p.get("id") for p in products]
if len(set(ids))!=len(ids):errors.append("Duplicate commodity IDs")
for p in products:
 for side in ("exports","imports"):
  block=p.get(side,{})
  x=block.get("world_musd")
  partners=block.get("partners",[])
  if x is not None and x<0:errors.append(f"Negative trade flow {p.get('id')} {side}")
  if x is not None and sum(item.get("musd",0) for item in partners)>x+0.01:errors.append(f"Partner values exceed declared world totals: {p.get('id')} {side}")
  if any(not item.get("country") or item.get("musd",0)<0 for item in partners):errors.append(f"Invalid partner flow {p.get('id')}")
  if x is not None and not str(block.get("source_url","")).startswith("https://"):errors.append(f"Missing origin {p.get('id')} {side}")
investment=read("data/investment-evidence.json")
if not investment.get("national",{}).get("source"):errors.append("Missing official BKPM national source")
ai_file=root/"data/ai-monitoring.json"
if ai_file.exists():
 ai=read("data/ai-monitoring.json")
 seen=set()
 for lead in ai.get("reports",[]):
  key=(lead.get("title"),lead.get("url"))
  if key in seen:errors.append("Duplicate AI monitoring lead")
  seen.add(key)
  if not str(lead.get("url","")).startswith("https://") or not lead.get("published_at_utc") or not lead.get("publisher"):errors.append("Unattributed AI monitoring lead")
if errors:
 print("SOURCE QA FAILED:\\n"+"\\n".join(errors),file=sys.stderr);sys.exit(1)
print(f"SLI source QA passed: {len(products)} trade commodities, investment provenance and AI feed metadata")
