"""Tests only public parsing logic with synthetic rows; no copyrighted PDF needed."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC = ROOT / "scripts/audit_bps_welfare_2026.py"
spec = importlib.util.spec_from_file_location("sli_bps_rse_parser", SRC)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class BPSAppendixParserTests(unittest.TestCase):
    def test_all_regions_and_five_tuple_structure(self):
        rows = []
        for p in module.PROVINCES:
            rows.extend([p, "12,34", "0,24", "1,94", "11,87", "12,81"])
        out = module.scan("\n".join(rows))
        self.assertEqual(len(out), 39)
        self.assertEqual(out[-1][0], "Indonesia")
        self.assertEqual(out[0][1][0], "12,34")

    def test_two_categories_and_missing_tokens_are_not_zero(self):
        rows=[]
        for p in module.PROVINCES:
            rows.extend([p, "NA", "–", "71,08²", "–", "–", "0,23", "0,10", "43,47¹", "-0,08", "0,83"])
        out = module.scan("\n".join(rows))
        self.assertEqual(len(out[0][1]), 10)
        self.assertIsNone(module.token_value("NA"))
        self.assertIsNone(module.token_value("–"))
        self.assertEqual(module.token_value("~0"), "~0")
        self.assertEqual(module.token_value("71,08²"), 71.08)
        self.assertEqual(module.token_value("-0,08"), -0.08)

    def test_truncated_row_blocks_cannot_pass(self):
        rows=[]
        for index,p in enumerate(module.PROVINCES):
            rows.extend([p]+(["1,00","0,10","10,00","0,80","1,20"] if index!=6 else ["1,00","0,10","10,00"]))
        with self.assertRaisesRegex(ValueError, "Incomplete five-field"):
            module.scan("\n".join(rows))

    def test_caution_and_non_reported_rse_flags(self):
        self.assertEqual(module.classify(25.0), "standard")
        self.assertEqual(module.classify(25.01), "caution")
        self.assertEqual(module.classify(50.0), "caution")
        self.assertEqual(module.classify(50.01), "unreliable")
        self.assertEqual(module.classify(None), "not_reported")


if __name__ == "__main__":
    unittest.main()
