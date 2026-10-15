#!/usr/bin/env python3
"""Public RSS headline discovery for Indonesian investment; not verification of claims."""
import datetime as dt
import email.utils
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "investment-news.json"
QUERIES = {
    "FDI & capital": '"investasi asing" Indonesia OR "foreign direct investment" Indonesia',
    "Project implementation": '"proyek investasi" groundbreaking OR konstruksi Indonesia',
    "Downstreaming & energy": '"investasi hilirisasi" OR "investasi smelter" Indonesia',
    "Policy & incentives": 'BKPM investasi OR Danantara investasi OR insentif investasi',
    "Risks & disputes": '"kendala investasi" OR "sengketa investasi" Indonesia',
}
USER_AGENT = "StrategicLatitudeIntelligence/1.0 (public RSS monitoring)"
NOW = dt.datetime.now(dt.timezone.utc)

def iso_pub(raw):
    try:
        parsed = email.utils.parsedate_to_datetime(raw)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc).isoformat()
    except (TypeError, ValueError, IndexError):
        return None

def scan(topic, query):
    params = urllib.parse.urlencode({"q": query, "hl": "id", "gl": "ID", "ceid": "ID:id"})
    url = "https://news.google.com/rss/search?" + params
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=25) as response:
        xml = response.read(1500000)
    root = ET.fromstring(xml)
    reports = []
    for item in root.findall("./channel/item")[:25]:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        publisher = (item.findtext("source") or "Publisher unknown").strip()
        if not title or not link.startswith("https://"):
            continue
        reports.append({
            "title": title, "url": link, "publisher": publisher,
            "topic": topic, "published_at_utc": iso_pub(item.findtext("pubDate")),
            "evidence_status": "Unverified headline lead",
        })
    return reports

def main():
    previous = {}
    if OUT.exists():
        try:
            previous = json.loads(OUT.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            pass
    seen = set()
    reports, errors = [], []
    for topic, query in QUERIES.items():
        try:
            found = scan(topic, query)
            if not found:
                errors.append({"topic": topic, "reason": "RSS returned no headlines"})
            for item in found:
                if item["url"] in seen:
                    continue
                seen.add(item["url"])
                reports.append(item)
        except (OSError, ValueError, ET.ParseError) as exc:
            errors.append({"topic": topic, "reason": type(exc).__name__})
            # Preserve prior-topic headlines during temporary source failures.
            for item in previous.get("reports", []):
                if item.get("topic") == topic and item.get("url") not in seen:
                    seen.add(item["url"])
                    reports.append(item)
    reports.sort(key=lambda x: x.get("published_at_utc") or "", reverse=True)
    output = {
        "checked_at_utc": NOW.isoformat(),
        "scope": "Public RSS discovery only; no independent verification of investment amounts, permits, milestones or capital disbursement",
        "source": "Google News RSS search indexing attributed publishers",
        "reports": reports[:100],
        "errors": errors,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Investment news: {len(reports[:100])} headlines, {len(errors)} topic failures")

if __name__ == "__main__":
    main()
