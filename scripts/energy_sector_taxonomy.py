"""Conservative cross-feed sector tagging for SLI domestic and geopolitical energy news.
Sector tags classify attributable headline leads, NOT verify underlying incidents.
"""
from __future__ import annotations
import re

SECTORS = ("oil_gas", "coal", "nre", "electricity", "cross_cutting")

DOMESTIC_TOPIC_SECTORS = {
    "oil_gas_upstream": ("oil_gas",), "oil_gas_downstream": ("oil_gas",),
    "oil_gas_gas": ("oil_gas",), "refinery": ("oil_gas",), "fuel": ("oil_gas",),
    "coal_production": ("coal",), "coal_dmo": ("coal", "electricity"),
    "nre_solar_wind": ("nre",), "nre_geothermal_hydro": ("nre",),
    "nre_policy": ("nre",), "biofuels": ("nre", "oil_gas"),
    "power": ("electricity",), "forest_fire": ("cross_cutting",),
    "supply_disaster": ("cross_cutting",),
    "projects": (), "policy": (),
}
GEO_TOPIC_SECTORS = {
    "oil_shipping": ("oil_gas",), "oil_supply": ("oil_gas",),
    "oil_sanctions": ("oil_gas",), "lng_asia": ("oil_gas",),
    "coal_markets": ("coal",), "coal_indonesia_trade": ("coal",),
    "nre_solar_wind": ("nre",), "nre_grid_storage": ("nre",),
    "nre_geothermal": ("nre",), "nre_biofuels": ("nre",),
    "energy_transition_policy": ("cross_cutting",),
}
LEGACY_GEO_TOPIC = {
    "Hormuz and Gulf energy": ("oil_gas",),
    "Red Sea and Bab el-Mandeb": ("oil_gas",),
    "Middle East energy infrastructure": ("oil_gas",),
    "Russia and energy sanctions": (),   # Must identify commodity first.
    "Asian LNG and gas": ("oil_gas",),
    "Global coal and energy policy": ("coal",),
}
PATTERNS = {
    "oil_gas": re.compile(
        r"\b(?:migas|minyak\s+(?:mentah|bumi)|crude|petroleum|refiner(?:y|ies)|kilang|"
        r"bbm|bensin|solar\s+subsidi|pertalite|pertamax|biodiesel|fuel\s+oil|"
        r"lpg|lng|natural\s+gas|gas\s+bumi|gas\s+alam|hgbt|jargas|"
        r"skk\s*migas|kkks|psc|opec|icp|upstream\s+(?:oil|gas)|"
        r"oil\s+(?:price|prices|field|tanker|supply|exports?|imports?|market|production)|"
        r"gas\s+(?:pipeline|fields?|exports?|imports?|prices?|supply|storage))\b", re.I),
    "coal": re.compile(
        r"\b(?:batubara|batu\s+bara|lignit|coal|hba|pkp2b|iupk|"
        r"rkab|pltu|minerba|kpc|kideco|ptba|dmo\s+batubara|"
        r"coal\s+(?:mine|supply|price|prices|exports?|imports?|production))\b", re.I),
    "nre": re.compile(
        r"\b(?:renewable(?:s)?|clean\s+energy|energi\s+terbarukan|"
        r"energi\s+baru\s+terbarukan|ebtke|biofuel|biodiesel|bioetanol|"
        r"bioethanol|b\s?40|b\s?50|e\s?10|e\s?20|solar\s+(?:pv|power|panel|farm|cell)|"
        r"plts|plta|pltp|pltb\b|hydropower|hydroelectric|geothermal|panas\s+bumi|"
        r"wind\s+(?:farm|power|turbine|energy)|pembangkit\s+surya|"
        r"pembangkit\s+(?:air|angin)|green\s+hydrogen|battery\s+storage|"
        r"energy\s+storage|bess|saf\b|sustainable\s+aviation\s+fuel)\b", re.I),
    "electricity": re.compile(
        r"\b(?:pln|electricity|listrik|grid|transmission|power\s+(?:outage|plant|generation)|"
        r"blackout|pemadaman|pembangkit|pltu)\b", re.I),
}

SUBTOPICS = {
    "oil_gas": (
      (re.compile(r"\b(?:skk\s*migas|kkks|psc|lifting|eksplorasi|oilfield|gasfield|upstream|hulu\s+migas)\b", re.I), "upstream"),
      (re.compile(r"\b(?:lng|lpg|hgbt|jargas|gas\s+bumi|gas\s+alam|natural\s+gas|pipeline)\b", re.I), "gas_lng"),
      (re.compile(r"\b(?:kilang|refin|bbm|pertalite|pertamax|bensin|fuel|tanker)\b", re.I), "downstream"),
    ),
    "coal": (
      (re.compile(r"\b(?:dmo|pltu|domestic|pasokan|supply)\b", re.I), "dmo_power"),
      (re.compile(r"\b(?:hba|royalt|harga|price|export|ekspor|coal\s+trade)\b", re.I), "pricing_trade"),
      (re.compile(r"\b(?:rkab|iupk|pkp2b|tambang|mine|production|produksi)\b", re.I), "mining"),
    ),
    "nre": (
      (re.compile(r"\b(?:biodiesel|bioetanol|bioethanol|biofuel|b40|b50|e10|saf)\b", re.I), "bioenergy"),
      (re.compile(r"\b(?:geothermal|panas\s+bumi|pltp|hydro|plta)\b", re.I), "hydro_geothermal"),
      (re.compile(r"\b(?:solar|plts|wind|pltb)\b", re.I), "solar_wind"),
      (re.compile(r"\b(?:storage|bess|battery|grid)\b", re.I), "storage_grid"),
    ),
}

def classify(title: str, topic_id: str = "", scope: str = "domestic"):
    title = str(title or "")
    presets = DOMESTIC_TOPIC_SECTORS if scope == "domestic" else GEO_TOPIC_SECTORS
    tags = list(presets.get(topic_id, LEGACY_GEO_TOPIC.get(topic_id, ())))
    # For explicit energy topics, avoid unrelated matches such as gas-fired plants inside NRE.
    if not tags:
        tags = [key for key in ("oil_gas", "coal", "nre", "electricity") if PATTERNS[key].search(title)]
    elif topic_id == "biofuels":
        # Bioenergy intersects renewable energy and liquid-fuel downstream policy.
        tags = ["nre", "oil_gas"]
    # Preserve cross-cutting classification on natural disasters and general policy unless
    # a real sector name is present in the headline itself.
    if topic_id in ("forest_fire", "supply_disaster", "policy", "projects", "energy_transition_policy"):
        specific = [key for key in ("oil_gas", "coal", "nre", "electricity") if PATTERNS[key].search(title)]
        tags = specific or ["cross_cutting"]
    if not tags:
        tags = ["cross_cutting"]
    primary = next((s for s in ("oil_gas", "coal", "nre", "electricity", "cross_cutting") if s in tags), "cross_cutting")
    patterns = SUBTOPICS.get(primary, ())
    subtopic = next((name for pattern, name in patterns if pattern.search(title)), "general")
    return {"sector": primary, "sector_tags": tags, "subsector": subtopic}

if __name__ == "__main__":
    tests = [
      ("SKK Migas lifting minyak bumi", "oil_gas_upstream", "domestic", "oil_gas"),
      ("Harga Batubara Acuan dan DMO PLTU", "coal_production", "domestic", "coal"),
      ("PLTS surya resmi COD", "nre_solar_wind", "domestic", "nre"),
      ("Solar panel tariffs in Asia", "nre_solar_wind", "geopolitical", "nre"),
      ("Solar subsidi untuk warga", "policy", "domestic", "cross_cutting"),
      ("Greenhouse gas emissions report", "energy_transition_policy", "geopolitical", "cross_cutting"),
    ]
    for title, topic_id, scope, expected in tests:
        actual = classify(title, topic_id, scope)
        assert actual["sector"] == expected, (title, actual, expected)
    print("Sector classification sanity checks passed")
