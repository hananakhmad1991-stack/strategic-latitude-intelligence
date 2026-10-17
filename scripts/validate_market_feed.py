"""Fail-closed market data publication validator for SLI.
Only publish permitted sourced historical/delayed observations; do not scrape IDX.
Usage: python scripts/validate_market_feed.py data/sli-market-observations.json
"""
import json,sys,re,datetime
from pathlib import Path
def validate(doc):
    if doc.get("permission_to_redistribute") is not True:
        if doc.get("observations"):raise ValueError("Market rows require documented redistribution rights")
        return 0
    if not doc.get("licence_id") or not doc.get("publisher"):raise ValueError("Source licence and provider required")
    allow={"USDIDR":"IDR/USD","IHSG":"index points","FOREIGN_NET_FLOW":"IDR billion","INDOGB10Y":"%","COAL":"USD/tonne","NICKEL":"USD/tonne","CPO":"USD/tonne"}
    seen=set()
    for r in doc["observations"]:
        key=r.get("symbol")
        if key not in allow and not re.fullmatch(r"[A-Z]{4}",key or ""):raise ValueError("Invalid symbol")
        if not isinstance(r.get("value"),(int,float)) or isinstance(r["value"],bool):raise ValueError("Missing numeric market observation")
        if not r.get("observation_date") or not re.fullmatch(r"20\d{2}-\d{2}-\d{2}",r["observation_date"]):raise ValueError("Missing ISO observation date")
        if r.get("unit")!=allow.get(key,"IDR/share"):raise ValueError("Unexpected unit")
        for field in ("source_url","provider","published_at","delay_class","rights_basis"):
            if not r.get(field):raise ValueError("Missing provenance "+field)
        if not r["source_url"].startswith("https://"):raise ValueError("Unsafe source")
        if r["delay_class"] not in ("end_of_day","delayed","historical"):raise ValueError("Unsupported time class")
        item=(key,r["observation_date"])
        if item in seen:raise ValueError("Duplicate observation")
        seen.add(item)
    return len(doc["observations"])
if __name__=="__main__":
    p=Path(sys.argv[1] if len(sys.argv)>1 else "data/sli-market-observations.json")
    doc=json.loads(p.read_text(encoding="utf-8"));print("Validated published observations:",validate(doc))
