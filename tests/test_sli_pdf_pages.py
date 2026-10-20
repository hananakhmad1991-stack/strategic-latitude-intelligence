"""Reproducible synthetic official-style PDF fixture; no network and no real figures."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from reportlab.pdfgen import canvas
from scripts.sli_extract_official_pdf_pages import extract, official_url, selected_pages


class PdfPrimaryExtractTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "synthetic.pdf"
        pdf = canvas.Canvas(str(self.path))
        pdf.drawString(50, 740, "A hypothetical energy facility is planned for 2027.")
        pdf.showPage()
        pdf.drawString(50, 740, "The hypothetical facility has a planned 120 MW capacity.")
        pdf.drawString(50, 720, "No commercial-operation milestone has been confirmed.")
        pdf.save()
        self.url = "https://www.esdm.go.id/assets/publication.pdf"

    def test_extract_uses_pdf_page_numbers_and_fingerprint(self):
        r = extract(self.path, self.url, "2", "Official synthetic testing", "2026-10-20")
        self.assertEqual(r["schema"], "sli-official-pdf-pages-v1")
        self.assertEqual(r["page_count"], 2)
        self.assertEqual(r["selected_page_count"], 1)
        page = r["pages"][0]
        self.assertEqual(page["page"], 2)
        self.assertIn("120 MW", page["text_excerpt"])
        self.assertEqual(page["review_status"], "unreviewed_pdf_page_extraction")
        self.assertTrue(page["needs_visual_review"])
        self.assertEqual(r["document_sha256"], hashlib.sha256(self.path.read_bytes()).hexdigest())
        self.assertEqual(len(page["text_sha256"]), 64)

    def test_unsafe_origins_and_oversized_page_ranges_fail(self):
        for u in ("https://www.esdm.go.id.attacker.example/s.pdf",
                  "http://www.esdm.go.id/s.pdf",
                  "https://www.esdm.go.id/report.pdf?secret=1"):
            with self.assertRaises(ValueError):
                official_url(u)
        with self.assertRaises(ValueError):
            selected_pages("1-13", 20)
        with self.assertRaises(ValueError):
            selected_pages("3", 2)

    def test_bad_bytes_never_accepted_as_pdf(self):
        path = Path(self.temp.name) / "fake.pdf"
        path.write_bytes(b"<html>Not a PDF</html>")
        with self.assertRaises(ValueError):
            extract(path, self.url, "1")


if __name__ == "__main__":
    unittest.main()
