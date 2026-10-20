#!/usr/bin/env python3
"""Archive ALL attributable items from SLI monitoring snapshots as secondary evidence.
No article text is scraped/copied. RSS attribution is NOT independent event verification.
All publishers, including Reuters/CGTN/ANTARA, are eligible if required metadata is valid.
"""
from __future__ import annotations
import datetime as dt
import email.utils
import hashlib
import json
import re
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data/sli-secondary-news-index.json"
UTC = dt.timezone.utc
RETENTION_DAYS = 365
MAX_ITEMS = 4000
SOURCES = {
    "research-signal-radar": "data/research-signal-radar.json",
    "investment-news": "data/investment-news.json",
    "ai-monitoring": "data/ai-monitoring.json",
    "climate-monitoring": "data/sli-climate-monitoring.json",
    "energy-policy-leads": "data/energy-policy-leads.json",
    "energy-infrastructure-watch": "data/energy-infrastructure-watch.json",
    "energy-biofuels-watch": "data/energy-biofuels-watch.json",
    "energy-ev-watch": "data/energy-ev-watch.json",
    "daily-energy-assessment": "data/daily-energy-assessment.json",
    "domestic-energy": "data/domestic-energy.json",
    "geopolitical-energy": "data/geopolitical-energy.json",
    "climate-official-alerts": "data/sli-climate-official-alerts.json",
    "regulatory-monitor": "data/regulatory-monitor.json",
    "publication-watch": "data/sli-publication-watch.json",
}
ALLOWED_CATEGORIES = {"minerals", "ai", "energy", "regional", "food", "trade", "geopolitics", "macro"}
def safe_link(value):
    try:
        u = urllib.parse.urlsplit(str(value))
        h = (u.hostname or "").lower()
        return u.scheme == "https" and u.username is None and u.password is None and (u.port in (None, 443)) and bool(h) and not (
            h == "localhost" or h.endswith(".localhost") or h.endswith(".local") or
            h.startswith("127.") or h.startswith("10.") or h.startswith("192.168.") or
            h.startswith("169.254.") or h.startswith("172.16.") or h.startswith("172.17.") or
            h.startswith("172.18.") or h.startswith("172.19.") or h.startswith("172.2") or
            h.startswith("172.30.") or h.startswith("172.31.")
        )
    except ValueError:
        return False
def parse_date(value):
    if not value or not isinstance(value, str): return None
    try:
        d = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if d.tzinfo: return d.astimezone(UTC)
        if re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value): return d.replace(tzinfo=UTC)
    except ValueError: pass
    try:
        d = email.utils.parsedate_to_datetime(value)
        if d.tzinfo: return d.astimezone(UTC)
    except (TypeError, ValueError, OverflowError): pass
    return None

def infer_sector(row, source):
    sector = str(row.get("sector") or "").lower().strip()
    if sector in ALLOWED_CATEGORIES: return sector
    if source in ("research-signal-radar",) and sector == "ai": return "ai"
    if source == "ai-monitoring": return "ai"
    if source == "investment-news": return "regional"
    if source == "climate-monitoring": return "energy"
    if source in ("energy-policy-leads", "energy-infrastructure-watch", "energy-biofuels-watch", "energy-ev-watch", "daily-energy-assessment", "domestic-energy", "geopolitical-energy", "climate-official-alerts"): return "energy"
    if source in ("regulatory-monitor", "publication-watch"):
        sectors = [str(v).lower() for v in row.get("sectors", []) if isinstance(v, str)]
        if "energy" in sectors: return "energy"
        if "minerals" in sectors: return "minerals"
        if "ai" in sectors: return "ai"
        if "food" in sectors: return "food"
        return "regional"
    return "regional"
def flatten(source, doc):
    if source == "research-signal-radar":
        for sec, groups in doc.get("groups", {}).items():
            if not isinstance(groups, dict): continue
            for scope, rows in groups.items():
                if isinstance(rows, list):
                    for row in rows:
                        if isinstance(row, dict): yield {**row, "_scope": scope, "sector": sec}
    elif source == "daily-energy-assessment":
        for point in doc.get("points", []):
            if not isinstance(point, dict): continue
            for row in point.get("recent_news_leads", []):
                if isinstance(row, dict): yield {**row, "_scope": point.get("id", "")}
    else:
        key = {"investment-news": "reports", "ai-monitoring": "reports", "climate-monitoring": "events",
               "domestic-energy": "reports", "geopolitical-energy": "events", "climate-official-alerts": "alerts",
               "energy-policy-leads": "items", "energy-infrastructure-watch": "leads",
               "energy-biofuels-watch": "items", "energy-ev-watch": "items",
               "regulatory-monitor": "events", "publication-watch": "events"}.get(source)
        for row in (doc.get(key, []) if key else []):
            if isinstance(row, dict): yield row

def normalize_row(row, source, now):
    title = " ".join(str(row.get("title") or "").split())[:260]
    publisher = " ".join(str(row.get("publisher") or row.get("issuer") or "").split())[:100]
    url = str(row.get("url") or row.get("source_url") or "").strip()
    candidate = source in ("regulatory-monitor", "publication-watch")
    if not publisher and source == "regulatory-monitor": publisher = "Official regulatory listing (issuer not confirmed)"
    if not title or len(title) < 12 or not publisher or len(publisher) < 3 or not safe_link(url):
        return None
    date_type = "first_seen_in_monitor" if candidate or source == "geopolitical-energy" else "publisher_publication_date"
    pub = parse_date(row.get("published_at_utc") or row.get("published") or
        (row.get("first_seen_utc") if candidate else None) or
        (row.get("indexed_at_utc") if source == "geopolitical-energy" else None))
    if not pub or pub > now + dt.timedelta(minutes=10) or pub < now - dt.timedelta(days=RETENTION_DAYS):
        return None
    article_url = url
    link_kind = "aggregator" if urllib.parse.urlsplit(url).hostname == "news.google.com" else "publisher_or_official_link"
    norm = re.sub(r"\W+", " ", title.casefold()).strip()
    key = hashlib.sha256((publisher.casefold()+"|"+norm).encode("utf-8")).hexdigest()[:25]
    return {
        "id": "sli_feed_" + key,
        "title": title, "publisher": publisher, "url": article_url,
        "published_at_utc": pub.isoformat().replace("+00:00", "Z"),
        "date_type": date_type, "sector": infer_sector(row, source),
        "scope": str(row.get("_scope") or row.get("scope") or "")[:30] if source=="research-signal-radar" else "",
        "topic": str(row.get("topic") or row.get("topic_id") or row.get("category") or row.get("channel") or row.get("group") or row.get("kind") or "")[:110],
        "geo": str(row.get("geo") or "Indonesia and global context")[:90],
        "monitor_source": source, "link_kind": link_kind,
        "evidence_level": "official_metadata_change_candidate" if candidate else "publisher_attributed_news_report",
        "article_body_checked": False, "claim_corroborated": False
    }
def build(now=None, root=ROOT):
    now = now or dt.datetime.now(UTC)
    oldpath = root / "data/sli-secondary-news-index.json"
    try:
        old = json.loads(oldpath.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        old = {}
    records = {}
    for row in old.get("articles", []):
        if not isinstance(row, dict): continue
        p = parse_date(row.get("published_at_utc"))
        if row.get("id") and p and now - dt.timedelta(days=RETENTION_DAYS) <= p <= now:
            records[row["id"]] = row
    count_by_source = {}
    for source, rel in SOURCES.items():
        try:
            doc = json.loads((root / rel).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            count_by_source[source] = "unavailable"
            continue
        n = 0
        for raw in flatten(source, doc):
            item = normalize_row(raw, source, now)
            if not item: continue
            n += 1
            existing = records.get(item["id"])
            if existing:
                # Preserve a publisher-direct link if previously obtained; never downgrade to RSS.
                if existing.get("link_kind") == "publisher_or_official_link" and item["link_kind"] == "aggregator":
                    item["url"] = existing["url"]
                    item["link_kind"] = existing["link_kind"]
                if existing.get("article_body_checked"):
                    item["article_body_checked"] = True
                if existing.get("claim_corroborated"):
                    item["claim_corroborated"] = True
            records[item["id"]] = item
        count_by_source[source] = n
    ordered = sorted(records.values(), key=lambda r: r["published_at_utc"], reverse=True)[:MAX_ITEMS]
    core = {
        "schema_version": "sli-secondary-news-index-v1",
        "policy": "All valid publisher-attributed monitoring news is secondary evidence OF THE REPORT; not independent confirmation. Do not conflate RSS headlines with inspected full article text. Legal/document updates remain candidates. AI should compare reports with SLI official data and other OSINT.",
        "retention_days": RETENTION_DAYS,
        "source_snapshots": list(SOURCES),
        "count": len(ordered),
        "articles": ordered,
    }
    previous = {k:old.get(k) for k in core}
    if previous == core:
        return {**core, "updated_at_utc":old.get("updated_at_utc") or now.isoformat()}
    return {**core, "updated_at_utc":now.isoformat().replace("+00:00", "Z")}

if __name__ == "__main__":
    document = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(document, ensure_ascii=False, indent=2) + "\n"
    if not OUT.exists() or OUT.read_text(encoding="utf-8") != content:
        OUT.write_text(content, encoding="utf-8")
    print(f"SLI secondary index: {document['count']} items across {len(SOURCES)} monitoring snapshots")
