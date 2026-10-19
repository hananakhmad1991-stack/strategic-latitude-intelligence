#!/usr/bin/env python3
"""Publication-faithful food/agr dashboard regression checks."""
import json
from pathlib import Path
f=Path(__file__).resolve().parents[1]/"data/food-agriculture-june-2026.json"
data=json.loads(f.read_text(encoding="utf-8"))
assert data["schema_version"]=="sli-food-agriculture-v1"
assert data["publication"]["pdf_pages"]==88
assert data["publication"]["tables"]==63
assert data["publication"]["trade_data_through"]=="2026-04"
assert data["publication"]["other_indicators_through"]=="2026-05"
assert len(data["tables"])==63
assert [r["number"] for r in data["tables"]]==list(range(1,63))+[64], "preserve publisher numbering (63 absent)"
assert len(data["trade"])==90
assert data["quality"]["provincial_ntp_rows"]==38
assert all(row["source_page"].startswith(data["publication"]["pdf_url"]) for row in data["tables"])
assert all(t["measure"] in {"export","import","balance"} for t in data["trade"])
assert all(t["unit"] in {"tonnes","thousand_usd"} for t in data["trade"])
assert all(len(t["series"])==7 for t in data["trade"])
assert all(row["place"] and len(row["series"])==6 for row in data["tables"][37]["numeric_rows"])
def one(scope,sector,measure,unit):
    rows=[r for r in data["trade"] if (r["scope"],r["sector"],r["measure"],r["unit"])==(scope,sector,measure,unit)]
    assert len(rows)==1,(scope,sector,measure,unit)
    return rows[0]["series"]
net=one("segar_olahan","Pertanian — total","balance","thousand_usd")
assert net["2026-01:04"]==6271208
# Values are thousand USD; net annualised/multiplied improperly is a critical error.
fresh=one("segar","Pertanian — total","balance","thousand_usd")
processed=one("olahan","Pertanian — total","balance","thousand_usd")
assert abs(fresh["2026-01:04"]+processed["2026-01:04"]-net["2026-01:04"])<=2
assert data["no_imputation"] is True
print("PASS food source provenance:",len(data["tables"]),"published tables,",len(data["trade"]),"trade series, 38 NTP provincial rows; 2026-04/05 vintages kept separate.")
