#!/usr/bin/env python3
"""Conservative official IDX issuer-directory snapshot sync.

No unofficial trading feed, scraped private profile, estimated share quote, or
market capitalization. Official public issuer names/tickers only. Refuse
unexpected shrinking/unparseable snapshots; never destroy a previous dataset.
Commercial redistribution rights and use restrictions require owner review.
"""
import argparse
import datetime as dt
import json
import pathlib
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET = ROOT / "data" / "sli-idx-issuer-universe.json"
ENDPOINT = "https://www.idx.co.id/primary/ListedCompany/GetCompanyProfiles"
SOURCE = "https://www.idx.co.id/id/perusahaan-tercatat/profil-perusahaan-tercatat"
VALID_SECTORS = {
    "energy", "minerals", "coal", "technology", "food", "finance",
    "infrastructure", "transport", "property", "healthcare",
    "manufacturing", "retail", "other"
}
TICKER = re.compile(r"^[A-Z0-9]{4}$")


def validate(payload):
    if payload.get("schema") != "sli-idx-issuer-universe-v1":
        raise ValueError("Unexpected issuer catalogue schema")
    rows = payload.get("records")
    if not isinstance(rows, list) or len(rows) < 20:
        raise ValueError("Issuer catalogue missing or too small")
    tickers = set()
    for row in rows:
        t = row.get("ticker")
        if not isinstance(t, str) or not TICKER.fullmatch(t) or t in tickers:
            raise ValueError("Invalid or duplicate IDX ticker: " + str(t))
        tickers.add(t)
        if not isinstance(row.get("name"), str) or not row["name"].strip():
            raise ValueError("Missing issuer display name " + t)
        if row.get("sector") not in VALID_SECTORS:
            raise ValueError("Unknown category " + t)
        if row.get("exchange") != "IDX":
            raise ValueError("Unexpected exchange " + t)
        if row.get("source_url") != SOURCE + "/" + t:
            raise ValueError("Unattributed IDX issuer " + t)
        if row.get("market_cap") is not None:
            raise ValueError("Issuer directory must not invent market capitalization")
        if row.get("verification") == "official_ksei_security_listing":
            expected_ksei = "https://web.ksei.co.id/services/registered-securities/shares/lc/" + t
            if row.get("listing_source_url") != expected_ksei:
                raise ValueError("KSEI verification requires exact public evidence link for " + t)
    if payload.get("source_status") == "official_exchange_bulk_snapshot" and len(rows) < 500:
        raise ValueError("Official snapshot unexpectedly too small")
    return len(rows)


def build_snapshot(official, previous, as_of):
    if not isinstance(official, dict) or not isinstance(official.get("data"), list):
        raise ValueError("Not an official IDX company-profiles data response")
    records = official["data"]
    if len(records) < 500 or len(records) > 2000:
        raise ValueError("Official response outside plausible company universe")
    expected = official.get("recordsTotal")
    if isinstance(expected, int) and expected > 0 and len(records) < expected * 0.96:
        raise ValueError("Incomplete API pagination")
    prior = {r["ticker"]: r for r in previous["records"]}
    out = {}
    for company in records:
        ticker = company.get("KodeEmiten")
        name = company.get("NamaEmiten")
        if not isinstance(ticker, str) or not TICKER.fullmatch(ticker.strip().upper()):
            continue
        ticker = ticker.strip().upper()
        if not isinstance(name, str) or not name.strip():
            continue
        if ticker in out:
            raise ValueError("Duplicate ticker in official API: " + ticker)
        old = prior.get(ticker, {})
        # Preserve separately reviewed public fundamentals on official-directory refresh.
        # The directory endpoint contains names, NOT finance; do not erase approved
        # figures or infer new ones from it. Period + evidence URL are mandatory.
        has_financial_evidence = (
            isinstance(old.get("financial_source_url"), str)
            and old["financial_source_url"].startswith("https://")
            and bool(old.get("financial_period"))
            and bool(old.get("financial_currency"))
        )
        def retained(field):
            return old.get(field) if has_financial_evidence else None
        out[ticker] = {
            "ticker": ticker,
            "name": name.strip(),
            "sector": old.get("sector", "other"),
            "exchange": "IDX",
            "entity_type": "listed_issuer",
            "verification": "official_exchange_snapshot",
            "source_url": SOURCE + "/" + ticker,
            "financial_source_url": retained("financial_source_url"),
            "market_cap": None,
            "market_cap_as_of": None,
            "financial_period": retained("financial_period"),
            "financial_currency": retained("financial_currency"),
            "financial_basis": retained("financial_basis"),
            "revenue": retained("revenue"),
            "net_income": retained("net_income"),
            "total_assets": retained("total_assets"),
            # Preserve independently checked public-security and IR source locators;
            # direct security-registration proof is NOT an ultimate-owner disclosure.
            "listing_source_url": old.get("listing_source_url"),
            "listing_source_kind": old.get("listing_source_kind"),
            "investor_relations_url": old.get("investor_relations_url"),
            "sector_basis": old.get("sector_basis"),
        }
    if len(out) < 500:
        raise ValueError("Insufficient valid names after official API filtering")
    old_len = len(previous["records"])
    if previous.get("source_status") == "official_exchange_bulk_snapshot" and len(out) < old_len * 0.9:
        raise ValueError("Official index changed by >10%: requires manual review")
    result = {
        "schema": "sli-idx-issuer-universe-v1",
        "as_of": as_of,
        "source_status": "official_exchange_bulk_snapshot",
        "official_source_url": SOURCE,
        "official_financial_url": "https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan",
        "methodology": "Source: IDX public GetCompanyProfiles issuer list. Current snapshot of ticker and display name, not trading status guarantee. Industry tags from previous curated seed are retained; other issuers use 'other' until classified. Financials, prices, capitalization and ownership are intentionally not populated.",
        "records": [out[t] for t in sorted(out)],
    }
    validate(result)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--fixture", help="Local mock official IDX JSON, for QA only")
    args = parser.parse_args()
    old = json.loads(TARGET.read_text(encoding="utf-8"))
    print("Existing catalogue:", validate(old), "status:", old["source_status"])
    if args.validate_only:
        return
    if args.fixture:
        official = json.loads(pathlib.Path(args.fixture).read_text(encoding="utf-8"))
    else:
        url = ENDPOINT + "?" + urllib.parse.urlencode({"start": 0, "length": 9999})
        req = urllib.request.Request(url, headers={
            "Accept": "application/json",
            "Referer": SOURCE,
            "User-Agent": "StrategicLatitudeIntelligence/1.0 (public research; contact via project repository)",
        })
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                if response.status != 200:
                    raise RuntimeError("IDX HTTP " + str(response.status))
                official = json.load(response)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
            print("IDX official access unavailable; retained last valid catalogue:", exc, file=sys.stderr)
            raise SystemExit(2) from exc
    result = build_snapshot(official, old, dt.datetime.now(dt.timezone.utc).date().isoformat())
    if result["source_status"] == old["source_status"] and [
        (x["ticker"], x["name"], x["sector"]) for x in result["records"]
    ] == [(x["ticker"], x["name"], x["sector"]) for x in old["records"]]:
        print("No meaningful issuer metadata changes. Keeping original file.")
        return
    temp = TARGET.with_suffix(".json.tmp")
    temp.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(TARGET)
    print("Stored valid official ticker/name snapshot:", len(result["records"]))


if __name__ == "__main__":
    main()
