"""Prevent public RAG ingestion of URL placeholders and schema-only example rows."""
import pathlib
import sys
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
from build_research_unified_index import safeurl,walk,rec_source


class SourceSafetyTests(unittest.TestCase):
    def test_placeholder_host_with_whitespace_is_not_evidence(self):
        self.assertIsNone(safeurl("https:// official source"))
        self.assertIsNone(safeurl("https://not a hostname/report"))
        self.assertIsNone(safeurl("https://localhost/report"))

    def test_official_https_publisher_link_is_allowed(self):
        self.assertEqual(
            safeurl("https://data.bps.go.id/report?year=2025"),
            "https://data.bps.go.id/report?year=2025")
        self.assertEqual(
            safeurl("https://web.pln.co.id/statics/uploads/2026/report.pdf"),
            "https://web.pln.co.id/statics/uploads/2026/report.pdf")

    def test_schema_row_not_indexed_even_with_a_real_looking_link(self):
        sample={
          "schema":{"name":"Example project","status":"Operational",
                    "source_url":"https://www.esdm.go.id/example"},
          "records":[{"name":"Actual dated reference","status":"Announced",
                      "source_url":"https://www.esdm.go.id/real"}]
        }
        paths=[path for path,_ in walk(sample)]
        self.assertEqual(paths,[("records","0")])

    def test_placeholder_source_rejected_at_record_level(self):
        self.assertIsNone(rec_source({"url":"https:// official source"}))


if __name__=="__main__":
    unittest.main()
