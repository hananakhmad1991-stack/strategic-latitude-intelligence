#!/usr/bin/env python3
"""Public-source research radar for Indonesia's critical minerals and AI infrastructure.

Headlines are discovery leads, NOT independently verified events or measured impacts.
No investment/production/operating metric is modified by news headlines.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "research-signal-radar.json"
UA = "StrategicLatitudeIntelligence-RSS/1.0 (+public, attributed OSINT)"
WINDOW_DAYS = 14
LIMIT_PER_GROUP = 32
UTC = dt.timezone.utc

TOPICS = [
    # Global shocks, market access, technology dependency and supply-chain exposure
    ("minerals", "geopolitical", "nickel_market", "(Indonesia nickel OR Indonesian nickel OR global nickel) (China OR LME OR oversupply OR tariffs OR supply chain)", "Nickel prices, demand and downstream margins", "Nickel-related market or export developments may affect Indonesian smelter utilisation, investment margins or trading relationships."),
    ("minerals", "geopolitical", "export_policy", "(critical minerals OR nickel OR cobalt OR copper OR rare earths) (US China EU export controls OR tariffs OR sanctions OR trade restrictions)", "Market access and trade-policy exposure", "Trade measures elsewhere may change market access, investment decisions or technology supply for Indonesian mineral chains."),
    ("minerals", "geopolitical", "batteries", "(nickel OR cobalt OR lithium OR battery materials) (China Korea Japan Europe EV demand OR supply chains OR investment)", "Battery-material demand and capital flows", "Demand and production shifts may influence Indonesia's battery-material projects and foreign partnerships."),
    ("minerals", "geopolitical", "copper_supply", "(copper smelter OR copper concentrate OR aluminium OR alumina) (global shortage OR prices OR supply disruption OR China)", "Copper, alumina and aluminium exposure", "Global disruptions may affect concentrate inputs, export realisations and metal-sector trade."),

    # Named onshore projects, regulations, execution, environment
    ("minerals", "domestic", "smelter_projects", "(Indonesia smelter OR hilirisasi mineral OR pabrik pengolahan nikel OR HPAL OR RKEF) (operasi OR produksi OR konstruksi OR investasi OR commissioning OR proyek)", "Smelter construction and operation", "A project headline may signal a shift in commissioning, cash deployment, feedstock or actual output; verify named assets and milestones."),
    ("minerals", "domestic", "mineral_policy", "(minerba OR nikel OR bauksit OR tembaga OR timah OR mineral kritis) (RKAB OR izin OR royalti OR ekspor OR kuota OR regulasi) Indonesia", "Regulation, licensing and export controls", "Changes may affect compliance, permitted volumes or domestic processing requirements; verify enacted instrument and effective date."),
    ("minerals", "domestic", "environment", "(tambang nikel OR smelter nikel OR tailing OR limbah tambang OR Morowali OR Weda Bay) (lingkungan OR pencemaran OR AMDAL OR banjir OR keselamatan OR kebakaran)", "Environment, safety and physical infrastructure", "Environmental and site-level reports may indicate permitting or continuity exposure; allegations are not established violations."),
    ("minerals", "domestic", "mineral_investment", "(Freeport Gresik OR INALUM Mempawah OR ANTAM Pomalaa OR Vale Sorowako OR Indonesia battery factory) (investasi OR beroperasi OR produksi OR smelter)", "Investment execution and ownership", "Corporate project disclosures may change financing, ownership or commissioning assumptions; confirm actual spending separately."),

    # External chips, trade controls, cross-border networks, cyber geopolitical spillovers
    ("ai", "geopolitical", "chip_controls", "(AI chip OR GPU OR H100 OR H200 OR Blackwell OR semiconductor) (US China export restrictions OR export controls OR licensing OR tariffs) Southeast Asia", "GPU/semiconductor export controls", "Controls on accelerated computing or chips may change procurement access, costs and Indonesian AI infrastructure timelines."),
    ("ai", "geopolitical", "compute_competition", "(AI data centers OR AI datacenters OR hyperscale OR AI infrastructure) (Singapore Malaysia Indonesia Southeast Asia investment OR geopolitics)", "Regional data-center investment competition", "Regional power, connectivity and investment competition may affect relative project attractiveness and capital allocation."),
    ("ai", "geopolitical", "data_governance", "(cross-border data OR data sovereignty OR cloud sovereignty OR cyber sanctions) (ASEAN OR US OR China OR Singapore OR EU) regulation", "Cross-border data and sovereignty", "Cross-border data policy or cyber controls may affect compliance and cloud operating models in Indonesia."),
    ("ai", "geopolitical", "subsea", "(submarine cables OR undersea internet cables OR cloud connectivity) (South China Sea OR Singapore OR cyberattack OR disruption OR Asia)", "Subsea cable and connectivity resilience", "External network incidents may affect resilience or redundancy planning, not necessarily verified Indonesia outages."),

    # Onshore deployment, land/water/power, Komdigi governance and cloud operations
    ("ai", "domestic", "campus_projects", "(data center OR data centre OR pusat data OR pusat komputasi AI) (Jakarta OR Batam OR Cikarang OR Karawang OR Indonesia) (investasi OR construction OR beroperasi OR pembangunan OR commissioning)", "Data-center campuses and implementation", "Track announced megawatts separately from grid energisation, commissioning, leased capacity and AI GPU deployments."),
    ("ai", "domestic", "power_water", "(data center OR pusat data OR pusat komputasi) (PLN OR listrik OR air OR cooling OR pendinginan OR energi OR kapasitas) Indonesia", "Grid, water and cooling", "Power contracts, cooling and water availability can affect delivery; contracted MVA is not operating IT MW."),
    ("ai", "domestic", "ai_policy", "(Komdigi OR BSSN OR Indonesia AI roadmap OR peta jalan AI OR UU PDP OR perlindungan data pribadi) (regulasi OR peraturan OR kebijakan OR keamanan siber OR harmonisasi)", "AI, PDP and cybersecurity governance", "Legal or regulatory developments may affect data-center governance; distinguish proposal, consultation and enacted law."),
    ("ai", "domestic", "cloud_operations", "(AWS OR Microsoft Azure OR Google Cloud OR DCI Indonesia OR Digital Edge OR PDG OR Equinix) (cloud region OR data center OR data centre OR Indonesia) (launch OR beroperasi OR investasi OR expansion)", "Commercial cloud and compute operations", "Services or commercial launch announcements do not independently prove physical GPU fleet size or realised capital expenditure."),
]
GROUPS = (("minerals", "geopolitical"), ("minerals", "domestic"),
          ("ai", "geopolitical"), ("ai", "domestic"))

# Only publisher-attributed titles from known news organisations or governmental/corporate sources.
PUBLISHER_PATTERNS = (
    "reuters", "associated press", "ap news", "bloomberg", "nikkei", "financial times",
    "cnbc", "bbc", "the jakarta post", "jakarta globe", "antaranews", "antara",
    "kompas", "bisnis", "katadata", "kontan", "tempo", "detik", "cnn indonesia",
    "south china morning post", "scmp", "thinkchina", "tech in asia", "datacenterdynamics",
    "data center dynamics", "rest of world", "channel news asia", "cna",
    "the register", "semianalysis", "mining.com", "mining weekly", "mining technology",
    "s&p global", "sp global", "argus", "fastmarkets", "the edge", "bernama",
    "komdigi", "kementerian", "esdm", "bkpm", "bappenas", "brin", "bssn",
    "pt pln", "pln", "pertamina", "mind id", "inalum", "antam", "vale",
    "freeport", "indonesia investment authority", "danantara",
)
NEWS_DOMAINS = ("go.id", "reuters.com", "apnews.com", "bloomberg.com", "cnbc.com",
                "antaranews.com", "kompas.com", "bisnis.com", "katadata.co.id",
                "kontan.co.id", "tempo.co", "detik.com", "nikkei.com", "ft.com",
                "thejakartapost.com", "channelnewsasia.com", "mining.com",
                "datacenterdynamics.com", "techinasia.com", "scmp.com")
FOCUS = {
    "minerals": re.compile(r"\b(nickel|nikel|smelter|mineral|copper|tembaga|cobalt|kobalt|rare earth|bauksit|bauxite|alumina|aluminium|timah|baterai|tin\b|hpal|rkef|battery material|bahan baterai|ore|tailing|hilirisasi)\b", re.I),
    "ai": re.compile(r"\b(AI|artificial intelligence|kecerdasan buatan|GPU|semiconductor|semikonduktor|chip|data cent(?:er|re)|data\s*center|pusat data|komputasi|cloud|hyperscale|cyber|siber|submarine cable|undersea cable|pdp)\b", re.I),
}
EXCLUDE_AI = re.compile(r"\b(football|soccer|celebrity|gaming laptop|smartphone reviews)\b", re.I)
# A Google News query can match article text even when the headline concerns a
# different topic. Require a topic-specific signal in the displayed headline.
TITLE_RULES = {
    "nickel_market": r"\\b(nickel|nikel|lme|npi|ferronickel)\\b",
    "export_policy": r"\\b(nickel|nikel|copper|tembaga|cobalt|kobalt|rare earth|critical mineral|minerals|lithium|mineral kritis)\\b",
    "batteries": r"\\b(nickel|nikel|battery|batteries|baterai|lithium|cobalt|kobalt)\\b",
    "copper_supply": r"\\b(copper|tembaga|alumina|aluminium|bauksit|bauxite)\\b",
    "smelter_projects": r"\\b(smelter|hilirisasi|pabrik nikel|nikel|nickel|hpal|rkef|pengolahan mineral|processing mineral)\\b",
    "mineral_policy": r"\\b(minerba|nikel|nickel|bauksit|tembaga|copper|timah|mineral|rkab|iupk)\\b",
    "environment": r"\\b(nikel|nickel|smelter|tambang|tailing|morowali|weda|mineral)\\b",
    "mineral_investment": r"\\b(freeport|inalum|antam|vale|mempawah|gresik|pomalaa|sorowako|baterai|battery)\\b",
    "chip_controls": r"\\b(gpu|semiconductor|semikonduktor|nvidia|chip|h100|h200|blackwell|ai accelerator)\\b",
    "compute_competition": r"\\b(data\\s*cent(?:er|re)|hyperscale|data center|data centre|ai infrastructure|infrastruktur ai)\\b",
    "data_governance": r"\\b(sovereignty|data governance|cross.border data|cloud policy|data privacy|data protection|cyber|siber|pdpa|gdpr)\\b",
    "subsea": r"\\b(submarine cable|subsea|undersea|cable|kabel bawah laut|connectivity)\\b",
    "campus_projects": r"\\b(data\\s*cent(?:er|re)|hyperscale|pusat data|cloud region|kampus data)\\b",
    "power_water": r"\\b(data\\s*cent(?:er|re)|pusat data|hyperscale|data centre)\\b",
    "ai_policy": r"\\b(komdigi|bssn|ai roadmap|peta jalan ai|uu pdp|regulasi ai|tata kelola ai|perlindungan data|cybersecurity|keamanan siber)\\b",
    "cloud_operations": r"\\b(aws|azure|microsoft|google cloud|dci indonesia|digital edge|princeton digital|equinix|cloud region|data\\s*cent(?:er|re))\\b",
}
TITLE_RULES = {key: re.compile(expr.replace("\\\\b", r"\b").replace("\\\\s", r"\s"), re.I) for key, expr in TITLE_RULES.items()}



def source_ok(source: str, source_url: str) -> bool:
    name = source.strip().lower()
    host = (urllib.parse.urlparse(source_url).hostname or "").lower()
    if any(x in name for x in ("kompasiana", "medium.com", "blogspot", "wordpress", "reddit")):
        return False
    if any(part in name for part in PUBLISHER_PATTERNS):
        return True
    # A source URL alone can be publisher-spoofed; never accept arbitrary
    # publisher names just because an RSS source tag links to a well-known site.
    return host.endswith(".go.id") and any(
        key in name for key in ("pemerintah", "kementerian", "badan", "dinas", "otorita", "sekretariat")
    )


def scan(topic: tuple, now: dt.datetime) -> list[dict]:
    domain, scope, key, query, channel, pathway = topic
    term = query + " when:" + str(WINDOW_DAYS) + "d"
    lang = "id" if scope == "domestic" else "en"
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": term, "hl": lang, "gl": "ID", "ceid": "ID:" + lang}
    )
    request = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept": "application/rss+xml,application/xml",
    })
    with urllib.request.urlopen(request, timeout=18) as response:
        data = response.read(1_500_000)
    root = ET.fromstring(data)
    rows = []
    for item in root.findall("./channel/item"):
        title = " ".join((item.findtext("title") or "").split())[:220]
        link = (item.findtext("link") or "").strip()
        source_node = item.find("source")
        source = (source_node.text or "").strip() if source_node is not None else ""
        source_url = source_node.get("url", "") if source_node is not None else ""
        date = item.findtext("pubDate") or ""
        if not title or not source or not link.startswith("https://") or not source_ok(source, source_url):
            continue
        if not FOCUS[domain].search(title) or not TITLE_RULES[key].search(title) or domain == "ai" and EXCLUDE_AI.search(title):
            continue
        try:
            published = email.utils.parsedate_to_datetime(date).astimezone(UTC)
        except (ValueError, TypeError, OverflowError):
            continue
        age = now - published
        if not dt.timedelta(0) <= age <= dt.timedelta(days=WINDOW_DAYS + 1):
            continue
        rows.append({
            "id": re.sub(r"[^a-z0-9]+", "-", (key + "-" + title.lower()))[:150].strip("-"),
            "title": title, "url": link, "publisher": source,
            "publisher_url": source_url if source_url.startswith("https://") else None,
            "published_at_utc": published.isoformat(), "sector": domain,
            "scope": scope, "topic_id": key, "channel": channel,
            "impact_pathway": pathway,
            "evidence": "Publisher-attributed RSS headline (not independently verified)",
            "impact_status": "Potential impact pathway; no measured Indonesia exposure",
        })
        if len(rows) >= 6:
            break
    return rows


def main() -> int:
    now = dt.datetime.now(UTC)
    try:
        old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    except (ValueError, OSError):
        old = {}
    gathered = {(d, s): [] for d, s in GROUPS}
    errors, status = [], []
    successful = {(d, s): 0 for d, s in GROUPS}
    for topic in TOPICS:
        domain, scope, key = topic[:3]
        try:
            found = scan(topic, now)
            gathered[(domain, scope)].extend(found)
            successful[(domain, scope)] += 1
            status.append({"id": key, "scope": domain + "/" + scope, "state": "scanned", "found": len(found)})
        except Exception as exc:
            errors.append({"id": key, "scope": domain + "/" + scope, "error": str(exc)[:180]})
            status.append({"id": key, "scope": domain + "/" + scope, "state": "unavailable", "found": 0})
        time.sleep(0.15)
    groups = {}
    reused = []
    total_new = 0
    for domain, scope in GROUPS:
        unique = {}
        for item in gathered[(domain, scope)]:
            key = re.sub(r"\W+", " ", item["title"].lower()).strip()
            if key not in unique or item["published_at_utc"] > unique[key]["published_at_utc"]:
                unique[key] = item
        selected = sorted(unique.values(), key=lambda r: r["published_at_utc"], reverse=True)[:LIMIT_PER_GROUP]
        if successful[(domain, scope)] == 0:
            previous = old.get("groups", {}).get(domain, {}).get(scope, [])
            selected = previous if isinstance(previous, list) else []
            reused.append(domain + "/" + scope)
        else:
            total_new += len(selected)
        groups.setdefault(domain, {})[scope] = selected
    previous_good = old.get("generated_at_utc")
    if total_new == 0 and len(reused) == len(GROUPS):
        generated = previous_good
        state = "upstream_unavailable_last_good_preserved"
    else:
        generated = now.isoformat()
        state = "partial" if errors or reused else "ok"
    payload = {
        "schema_version": 1, "status": state, "generated_at_utc": generated,
        "last_attempt_at_utc": now.isoformat(), "groups": groups,
        "counts": {d: {s: len(groups[d][s]) for s in ("geopolitical", "domestic")} for d in ("minerals", "ai")},
        "topic_status": status, "errors": errors, "reused_last_good_groups": reused,
        "methodology": ("Automated, hourly scheduled Google News RSS discovery across 16 themed "
                        "searches; published dates belong to news articles. Source names are publisher "
                        "attributions, not a verification of facts. A successful scrape is not evidence "
                        "that any specific event occurred. No quantitative probability or actual loss is inferred."),
        "refresh_policy": "GitHub scheduled hourly; browser checks published snapshot every 5 minutes while chapter is open.",
        "windows": {"headline_max_age_days": WINDOW_DAYS, "max_items_per_group": LIMIT_PER_GROUP},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": state, "counts": payload["counts"], "failed_topics": len(errors),
                      "reused_last_good_groups": reused, "checked_at_utc": now.isoformat()}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
