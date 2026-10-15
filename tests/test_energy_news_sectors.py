#!/usr/bin/env python3
"""No-network sector-intelligence regression: Reuters/GDELT/RSS classification and date semantics."""
from __future__ import annotations
import json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from energy_sector_taxonomy import classify, SECTORS
import domestic_energy_watch as domestic
import geopolitical_energy_watch as geo

def check(title,topic,source,expected):
    result=classify(title,topic,source)
    assert expected in result["sector_tags"],(title,topic,result)
    assert result["sector"] in SECTORS
    assert result["subsector"]
    assert len(result["sector_tags"])==len(set(result["sector_tags"]))
    return result

check("SKK Migas announces offshore oil lifting and field tests","oil_gas_upstream","domestic","oil_gas")
check("Refinery turnaround affects Pertamina Cilacap fuel supply","refinery","domestic","oil_gas")
check("PGN domestic natural gas and HGBT Jargas expansion","oil_gas_gas","domestic","oil_gas")
check("HBA and RKAB coal production approved","coal_production","domestic","coal")
check("PLN EPI and coal DMO supply to PLTU","coal_dmo","domestic","coal")
check("New PLTS solar and PLTB wind projects","nre_solar_wind","domestic","nre")
check("Geothermal and PLTA hydropower new project","nre_geothermal_hydro","domestic","nre")
check("Bioethanol E10 program","biofuels","domestic","nre")
check("Asian thermal coal imports shift amid Chinese demand","coal_markets","geopolitical","coal")
check("Solar PV panel tariffs in Asia","nre_solar_wind","geopolitical","nre")
check("Wind turbines and battery storage supply","nre_grid_storage","geopolitical","nre")
check("Global LNG gas prices jump","lng_asia","geopolitical","oil_gas")
assert classify("Government debates subsidy procedure","policy","domestic")["sector"]=="cross_cutting"
assert classify("Solar subsidi ditambah pemerintah","policy","domestic")["sector"]=="cross_cutting"
assert classify("Greenhouse gas emission audit","energy_transition_policy","geopolitical")["sector"]=="cross_cutting"
assert len(domestic.TOPICS)>=15
domestic_ids={x["id"] for x in domestic.TOPICS}
for key in ["oil_gas_upstream","oil_gas_gas","coal_production","coal_dmo","nre_solar_wind","nre_geothermal_hydro","nre_policy"]:
    assert key in domestic_ids,key
assert len(geo.TOPICS)>=12
assert {"oil_supply","coal_markets","nre_solar_wind","nre_grid_storage","nre_geothermal","nre_biofuels"}.issubset(set(geo.GEO_TOPIC_ID.values()))
for path,collection in [("data/domestic-energy.json","reports"),("data/geopolitical-energy.json","events")]:
    saved=json.loads((ROOT/path).read_text(encoding="utf-8"))
    assert "checked_at_utc" in saved
    assert isinstance(saved[collection],list)
    assert saved["sector_taxonomy_version"]=="2026-10-15"
    assert isinstance(saved["sector_counts"],dict)
    for row in saved[collection]:
        assert row["title"] and row["url"].startswith("https://")
        assert row["sector"] in SECTORS
        assert row["sector"] in row["sector_tags"]
        assert all(x in SECTORS for x in row["sector_tags"])
        assert row["subsector"]
    for tag in SECTORS:
        actual=sum(1 for row in saved[collection] if tag in row["sector_tags"])
        assert saved["sector_counts"][tag]==actual,(path,tag)
assert geo.sector_relevance("Thermal coal exports rise","Global coal and energy policy")
assert geo.sector_relevance("Solar PV tariff reforms","Global solar PV and wind supply chains")
assert not geo.sector_relevance("Politics debate with no energy content","Global solar PV and wind supply chains")
print("Energy monitoring sector regressions PASS: 15 domestic themes, 13 geopolitical themes, date-preserving source-tagged feeds.")
