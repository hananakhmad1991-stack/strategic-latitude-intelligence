#!/usr/bin/env python3
"""Offline, bounded page-text extraction for publicly released *primary* PDFs.

Only a local file explicitly selected by the operator is read. There is no URL
fetch, browser/OCR, customer upload, citation verification, or fact promotion.
PDF pages, especially scans/figures/tables, still need visual human review.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit
from datetime import date

MAX_PDF_BYTES = 12 * 1024 * 1024
MAX_TOTAL_PAGES = 120
MAX_SELECTED_PAGES = 12
MAX_PAGE_TEXT = 6000
ALLOWED_HOSTS = frozenset({
    "esdm.go.id", "www.esdm.go.id", "bps.go.id", "www.bps.go.id",
    "bi.go.id", "www.bi.go.id", "pln.co.id", "www.pln.co.id",
    "web.pln.co.id", "kemenkeu.go.id", "www.kemenkeu.go.id",
    "iea.org", "www.iea.org", "worldbank.org", "www.worldbank.org",
})


def official_url(value):
    u = urlsplit(value)
    if (u.scheme != "https" or u.netloc.lower() not in ALLOWED_HOSTS
            or u.username or u.password or u.port or u.query or u.fragment):
        raise ValueError("source-url must be an exact allowlisted official https PDF URL without query")
    if not u.path.lower().endswith(".pdf"):
        raise ValueError("source-url must end in .pdf")
    return value


def selected_pages(spec, total):
    chosen = set()
    for token in spec.split(","):
        token = token.strip()
        match = re.fullmatch(r"([1-9]\d*)(?:-([1-9]\d*))?", token)
        if not match:
            raise ValueError("pages must be page numbers/ranges, e.g. 1,3-5")
        first, last = int(match.group(1)), int(match.group(2) or match.group(1))
        if first > last or last > total or (last - first + 1) > MAX_SELECTED_PAGES:
            raise ValueError("page out of range or oversized range")
        chosen.update(range(first, last + 1))
        if len(chosen) > MAX_SELECTED_PAGES:
            raise ValueError("at most 12 pages may be extracted per run")
    return sorted(chosen)


def extract(pdf_path, source_url, pages_spec, publisher="", source_date=""):
    """Local-only. Returns source *candidates* with page numbers, never verified."""
    from pypdf import PdfReader

    path = Path(pdf_path).resolve(strict=True)
    if not path.is_file() or path.stat().st_size > MAX_PDF_BYTES:
        raise ValueError("PDF must be a local file at most 12 MiB")
    raw = path.read_bytes()
    if not raw.startswith(b"%PDF-"):
        raise ValueError("not a PDF file")
    official_url(source_url)
    if source_date:
        date.fromisoformat(source_date)
    reader = PdfReader(path, strict=True)
    if reader.is_encrypted:
        raise ValueError("encrypted PDFs are not accepted")
    total = len(reader.pages)
    if total < 1 or total > MAX_TOTAL_PAGES:
        raise ValueError("PDF page count outside 1-120")
    wanted = selected_pages(pages_spec, total)
    entries = []
    for page_num in wanted:
        page = reader.pages[page_num - 1]
        # Extracted text ordering is NOT authoritative for layout/table cells.
        plain = (page.extract_text(extraction_mode="plain") or "")
        plain = re.sub(r"\s+", " ", plain).strip()
        entries.append({
            "page": page_num,
            "text_excerpt": plain[:MAX_PAGE_TEXT],
            "text_sha256": hashlib.sha256(plain.encode("utf-8")).hexdigest(),
            "extracted_characters": len(plain),
            "text_truncated": len(plain) > MAX_PAGE_TEXT,
            "review_status": "unreviewed_pdf_page_extraction",
            "needs_visual_review": True,
            "extraction_quality": "no_searchable_text" if not plain else (
                "truncated_text_requires_review" if len(plain) > MAX_PAGE_TEXT
                else "text_only_not_layout_verified"),
        })
    return {
        "schema": "sli-official-pdf-pages-v1",
        "source_url": source_url,
        "publisher": publisher[:120],
        "source_date": source_date,
        "document_sha256": hashlib.sha256(raw).hexdigest(),
        "page_count": total,
        "selected_page_count": len(entries),
        "pages": entries,
        "review_status": "human_page_and_claim_review_required",
        "source_scope": "operator_supplied_local_primary_pdf_not_live_scraping",
        "limitations": [
            "Original PDF is not redistributed. SHA-256 fingerprints only identify bytes.",
            "Text extracted per numbered PDF page; printed page labels may differ.",
            "No automatic citation verification, claim entailment, or human approval.",
            "Scans, charts, footnotes and tables require manual visual inspection; no OCR.",
        ],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Local officially downloaded primary PDF")
    parser.add_argument("--source-url", required=True, help="Exact original official .pdf URL")
    parser.add_argument("--pages", required=True, help="1-based pages: 2,5-7 (max 12)")
    parser.add_argument("--publisher", default="")
    parser.add_argument("--source-date", default="", help="YYYY-MM-DD or blank when unknown")
    parser.add_argument("--output", required=True, help="Private local JSON path; do not commit unreviewed evidence")
    args = parser.parse_args()
    result = extract(args.input, args.source_url, args.pages, args.publisher, args.source_date)
    output = Path(args.output)
    if output.resolve() == Path(args.input).resolve():
        raise ValueError("output must not overwrite PDF")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "status": "unreviewed_pdf_page_extraction",
        "selected_pages": result["selected_page_count"],
        "document_sha256": result["document_sha256"],
        "output": str(output),
    }))


if __name__ == "__main__":
    main()
