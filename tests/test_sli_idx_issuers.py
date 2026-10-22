import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("idx_sync", ROOT / "scripts" / "sync_sli_idx_issuers.py")
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)

class IssuerUniverseTest(unittest.TestCase):
    def setUp(self):
        self.old = json.loads((ROOT / "data" / "sli-idx-issuer-universe.json").read_text(encoding="utf-8"))

    def test_seed_is_explicitly_pending_and_sector_diverse(self):
        self.assertGreaterEqual(module.validate(self.old), 250)
        self.assertEqual(self.old["source_status"], "curated_seed_pending_official_bulk_reconciliation")
        self.assertGreaterEqual(len({r["sector"] for r in self.old["records"]}), 12)
        self.assertTrue(all(r["verification"] in {"idx_seed_awaiting_official_refresh", "official_ksei_security_listing"} for r in self.old["records"]))
        checked = {r["ticker"] for r in self.old["records"] if r["verification"] == "official_ksei_security_listing"}
        self.assertEqual(checked, {"BRMS", "ADMR", "BIPI", "RATU", "HUMI", "GGRP", "DGWG", "PANI"})
        for row in self.old["records"]:
            if row["verification"] == "official_ksei_security_listing":
                self.assertEqual(row["listing_source_url"],
                    "https://web.ksei.co.id/services/registered-securities/shares/lc/" + row["ticker"])
                self.assertIsNone(row["market_cap"])
        self.assertTrue(all(r.get("market_cap") is None for r in self.old["records"]))

    def test_genuine_response_requires_500_valid_issuers(self):
        seed = self.old["records"]
        generated = []
        # Generate synthetic names only inside test fixtures; never published.
        chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        for a in chars:
            for b in chars:
                ticker = "QZ" + a + b
                generated.append({"KodeEmiten": ticker, "NamaEmiten": "Test Company " + ticker})
                if len(generated) >= 600:
                    break
            if len(generated) >= 600:
                break
        response = {"data": generated, "recordsTotal": 600}
        result = module.build_snapshot(response, self.old, "2026-10-20")
        self.assertEqual(result["source_status"], "official_exchange_bulk_snapshot")
        self.assertEqual(len(result["records"]), 600)
        self.assertTrue(all(r["market_cap"] is None for r in result["records"]))
        self.assertTrue(all(r["verification"] == "official_exchange_snapshot" for r in result["records"]))
        with self.assertRaises(ValueError):
            module.build_snapshot({"data": generated[:50], "recordsTotal": 600}, self.old, "2026-10-20")
        with self.assertRaises(ValueError):
            module.build_snapshot({"data": generated + [generated[0]], "recordsTotal": 601}, self.old, "2026-10-20")

    def test_no_fake_market_caps_or_duplicate_tickers(self):
        bad = dict(self.old)
        bad["records"] = [dict(r) for r in self.old["records"]]
        bad["records"][0]["market_cap"] = 99999999
        with self.assertRaisesRegex(ValueError, "market capitalization"):
            module.validate(bad)
        bad["records"][0]["market_cap"] = None
        bad["records"].append(dict(bad["records"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate"):
            module.validate(bad)

if __name__ == "__main__":
    unittest.main()
