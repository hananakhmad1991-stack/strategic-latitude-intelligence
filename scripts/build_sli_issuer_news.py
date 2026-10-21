#!/usr/bin/env python3
"""Build a publisher-attributed IDX issuer headline feed for SLI.

Source: public Google News RSS search per ticker. The RSS metadata is a lead,
NOT a verified corporate disclosure or full-article analysis. Never infer
financial prices, materiality, sentiment or an event's truth from headlines.
Only emit a ticker match when the title explicitly names its code or company.
"""
from __future__ import annotations

import concurrent.futures
import datetime as dt
import email.utils
import hashlib
import json
import os
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/sli-idx-issuer-universe.json"
OUTPUT = ROOT / "data/sli-issuer-news.json"
UTC = dt.timezone.utc
MAX_ITEMS = 500
RETENTION_DAYS = 8
MAX_PER_TICKER = 12
USER_AGENT = "SLI-Issuer-Headlines/1.0 (+public RSS metadata; educational research)"
PRIORITIES = {
    "energy": ("MEDC", "PGAS", "PGEO", "BREN"),
    "minerals": ("ANTM", "INCO", "AMMN", "MDKA"),
    "coal": ("PTBA", "ADRO", "ITMG", "AADI"),
    "food": ("INDF", "ICBP", "CPIN", "JPFA"),
    "technology": ("TLKM", "ISAT", "GOTO", "DCII"),
    "infrastructure": ("JSMR", "WIKA", "PTPP", "ADHI"),
    "transport": ("SMDR", "TMAS", "ASSA", "GIAA"),
    "manufacturing": ("UNTR", "SMGR", "INTP", "INKP"),
}
# Generic English word-like tickers need exact company-name corroboration.
AMBIGUOUS = {"AUTO", "SHIP", "BIRD", "ESSA", "WINS", "GEMS"}
SECTORS = set(PRIORITIES)


def utcnow():
    return dt.datetime.now(UTC)


def iso(value):
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def parse_pubdate(value):
    try:
        date = email.utils.parsedate_to_datetime(value)
        return date.astimezone(UTC) if date.tzinfo else None
    except (ValueError, TypeError, OverflowError):
        return None


def safe_source(url):
    try:
        parsed = urllib.parse.urlsplit(url)
        return parsed.scheme == "https" and parsed.hostname == "news.google.com" and not parsed.username and not parsed.password
    except (ValueError, TypeError):
        return False


def normalize(text):
    return re.sub(r"\s+", " ", str(text or "")).strip()


def match_title(title, issuer):
    title = normalize(title)
    ticker = issuer["ticker"]
    exact_ticker = bool(re.search(r"(?<![A-Z0-9])" + re.escape(ticker) + r"(?![A-Z0-9])", title, re.IGNORECASE))
    exact_name = len(issuer["name"]) >= 8 and issuer["name"].casefold() in title.casefold()
    return exact_name or (exact_ticker and ticker not in AMBIGUOUS)


def rss_url(issuer):
    # Bounded issuer-specific query: no crawling company articles or paywalled text.
    query = '"' + issuer["ticker"] + '" saham'
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query, "hl": "id", "gl": "ID", "ceid": "ID:id"
    })


def parse_rss(blob, issuer, now=None):
    now = now or utcnow()
    root = ET.fromstring(blob)
    entries = []
    for item in root.findall("./channel/item"):
        title = normalize(item.findtext("title"))
        url = normalize(item.findtext("link"))
        date = parse_pubdate(item.findtext("pubDate"))
        publisher = normalize(item.findtext("source"))
        if not title or len(title) < 12 or not publisher or not url or not safe_source(url):
            continue
        if date is None or not (now - dt.timedelta(days=RETENTION_DAYS) <= date <= now + dt.timedelta(minutes=10)):
            continue
        if not match_title(title, issuer):
            continue
        key = hashlib.sha256((publisher.casefold()+"|"+title.casefold()).encode("utf-8")).hexdigest()[:22]
        entries.append({
            "id": "sli_issuer_" + key,
            "title": title[:240],
            "url": url,
            "publisher": publisher[:100],
            "published_at_utc": iso(date),
            "date_type": "rss_pubdate",
            "tickers": [issuer["ticker"]],
            "sector": issuer["sector"],
            "source": "public_google_news_rss",
            "evidence_level": "publisher_attributed_headline_unverified",
            "article_body_checked": False,
            "company_disclosure_verified": False,
        })
        if len(entries) >= MAX_PER_TICKER:
            break
    return entries


def catalog_rows():
    raw = json.loads(CATALOG.read_text(encoding="utf-8"))
    if raw.get("schema") != "sli-idx-issuer-universe-v1":
        raise ValueError("Issuer source schema mismatch")
    rows = {r["ticker"]: r for r in raw["records"] if r.get("exchange") == "IDX" and
            re.fullmatch(r"[A-Z0-9]{4}", str(r.get("ticker", ""))) and r.get("name") and r.get("sector") in SECTORS}
    return [rows[t] for sector in PRIORITIES.values() for t in sector if t in rows]


def fetch_issuer(issuer):
    req = urllib.request.Request(rss_url(issuer), headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=12) as res:
        raw = res.read(800_000)
    return parse_rss(raw, issuer)


def merge_rows(previous, fetched, now):
    records = {}
    for row in (previous or []) + fetched:
        if not isinstance(row, dict) or not row.get("title") or not safe_source(str(row.get("url", ""))):
            continue
        try:
            at = dt.datetime.fromisoformat(row["published_at_utc"].replace("Z", "+00:00"))
        except (ValueError, KeyError, TypeError):
            continue
        if at.tzinfo is None or not now-dt.timedelta(days=RETENTION_DAYS) <= at <= now+dt.timedelta(minutes=10):
            continue
        key = (normalize(row["publisher"]).casefold(), normalize(row["title"]).casefold())
        old = records.get(key)
        if old is None:
            records[key] = {**row, "tickers": sorted(set(row.get("tickers") or []))}
        else:
            old["tickers"] = sorted(set(old.get("tickers", [])) | set(row.get("tickers", [])))
    return sorted(records.values(), key=lambda x:x["published_at_utc"], reverse=True)[:MAX_ITEMS]


def build():
    now = utcnow()
    issuers = catalog_rows()
    old = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {}
    fetched = []
    errors = []
    successful_feeds = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        tasks = {pool.submit(fetch_issuer, issuer):issuer["ticker"] for issuer in issuers}
        for future in concurrent.futures.as_completed(tasks):
            try:
                fetched.extend(future.result())
                successful_feeds += 1
            except (OSError, ET.ParseError, ValueError) as error:
                errors.append(tasks[future] + ": " + type(error).__name__)
    if not successful_feeds:
        print("Issuer RSS sources unavailable; preserve existing dated archive without false refresh")
        return False
    doc = {
        "schema": "sli-issuer-news-v1",
        "updated_at_utc": iso(now),
        "status": "partial" if errors else "ok",
        "covered_tickers": [i["ticker"] for i in issuers],
        "scanned_feeds": successful_feeds,
        "requested_feeds": len(issuers),
        "refresh_policy": "GitHub Actions attempts every 30 minutes; scheduler and RSS availability may delay updates.",
        "methodology": "Google News RSS title/pubDate/source links; publisher-attributed unverified headline, not issuer disclosure, real-time market data, or a verified claim.",
        "articles": merge_rows(old.get("articles"), fetched, now),
    }
    OUTPUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Ticker feeds:",successful_feeds,"/",len(issuers),"headlines:",len(doc["articles"]),"failed:",len(errors))
    return True


if __name__ == "__main__":
    build()
