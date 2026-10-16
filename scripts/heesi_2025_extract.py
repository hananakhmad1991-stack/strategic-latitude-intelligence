#!/usr/bin/env python3
"""Source-preserving 172-page HEESI 2025 full-text extraction.

Reads the public official ESDM handbook and stores page-scope text and searchable
original fragments. This is a DIGITAL INDEX, not a certified numeric transcription
of every wide/split energy statistical table. The separately sourced dashboard
statistics must be cross-checked against the original PDF tables.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import sys
import time
import urllib.request

SOURCE = "https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf"
ROOT = pathlib.Path(__file__).resolve().parent.parent
EXPECTED_PAGES = 172


def download():
    import fitz
    tries = 3
    last = None
    for attempt in range(tries):
        try:
            request = urllib.request.Request(
                SOURCE,
                headers={
                    "User-Agent": "Mozilla/5.0 (compatible; StrategicLatitudeIntelligence/1.0; research indexing)",
                    "Accept": "application/pdf,*/*",
                },
            )
            with urllib.request.urlopen(request, timeout=80) as response:
                blob = response.read(30 * 1024 * 1024)
            if not blob.startswith(b"%PDF"):
                raise ValueError("Official source is not a PDF; refusing extraction")
            pdf = fitz.open(stream=blob, filetype="pdf")
            if len(pdf) != EXPECTED_PAGES:
                raise ValueError("Unexpected number of source pages %s" % len(pdf))
            return pdf, hashlib.sha256(blob).hexdigest()
        except (OSError, ValueError) as err:
            last = err
            if attempt < tries - 1:
                time.sleep(4 + 4 * attempt)
    raise RuntimeError("Official ESDM 2025 PDF is unavailable: %s" % last)


def chapter(page):
    if page <= 16:
        return "Front matter: profile, executive summary, contents"
    if 17 <= page <= 32:
        return "Chapter 1 · Indicators and macroeconomics"
    if 33 <= page <= 38:
        return "Chapter 2 · National energy balance"
    if 39 <= page <= 50:
        return "Chapter 3 · Energy supply and demand"
    if 51 <= page <= 58:
        return "Chapter 4 · Prices"
    if 59 <= page <= 85:
        return "Chapter 5 · End-use consumption"
    if 86 <= page <= 147:
        return "Chapter 6 · Supply by fuel/resource"
    if 148 <= page <= 151:
        return "Chapter 7 · Energy-sector emissions"
    return "Annex · Methodology, glossary and conversion"


def make_archive(pdf, sha):
    result = []
    for index, page in enumerate(pdf):
        page_n = index + 1
        # Text is fully source-provided. No LLM edits or approximated missing rows.
        content = page.get_text("text", sort=False).strip()
        result.append({
            "pdf_page": page_n,
            "print_page": page_n - 16 if page_n >= 17 else None,
            "chapter": chapter(page_n),
            "text": content,
            "character_count": len(content),
        })
    if len(result) != 172:
        raise AssertionError("Page index incomplete")
    return {
        "source": SOURCE,
        "source_sha256": sha,
        "book_title": "Handbook of Energy & Economic Statistics of Indonesia 2025",
        "issued": "2026-07",
        "source_publication_year": 2025,
        "coverage": "Energy and economics 2015–2025; methodologies and revisions as published",
        "type": "complete machine-extracted text index, not numeric table validation",
        "warning": (
            "PDF split tables and multiple side-by-side table columns need visual PDF "
            "verification before row-level arithmetic. Missing/blank data remain unknown. "
            "ESDM 2025 changes NGL and power-plant boundaries."
        ),
        "pages": result,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", help="Local uploaded source PDF for QA; omit on GitHub Actions to fetch official URL")
    parser.add_argument("--output", default=str(ROOT / "data" / "handbook-2025-pages.json"))
    args = parser.parse_args()
    if args.pdf:
        import fitz
        blob = pathlib.Path(args.pdf).read_bytes()
        pdf = fitz.open(stream=blob, filetype="pdf")
        if len(pdf) != EXPECTED_PAGES:
            raise ValueError("Invalid original PDF pages")
        sha = hashlib.sha256(blob).hexdigest()
    else:
        pdf, sha = download()
    archive = make_archive(pdf, sha)
    from heesi_2025_power_by_province import write as write_power_by_province
    write_power_by_province(pdf, ROOT / "data" / "heesi-2025-power-technologies.json")
    target = pathlib.Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(archive, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("HEESI original source indexed: %s pages, %s bytes, original PDF sha256 %s" %
          (len(archive["pages"]), target.stat().st_size, sha))


if __name__ == "__main__":
    main()
