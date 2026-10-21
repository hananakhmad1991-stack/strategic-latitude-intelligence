import unittest
import sys
import copy
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from watch_kkp_dcat import read_json,evaluate,public_source,BASELINE

class KKPWatchTests(unittest.TestCase):
    def setUp(self):
        self.baseline=read_json(BASELINE)
        self.catalog={"dataset":[{"identifier":x["id"],"modified":x["modified"],"distribution":[{"downloadURL":"https://portaldata.kkp.go.id/sttk/api/test"}]} for x in self.baseline["watch"]]}
    def test_unchanged_catalog_has_no_automatic_updates(self):
        review=evaluate(self.baseline,self.catalog)
        self.assertEqual(review["status"],"metadata_unchanged")
        self.assertEqual(review["watched"],10)
        self.assertEqual(len(review["metadata_changes"]),0)
        self.assertFalse(review["numeric_values_rewritten"])
        self.assertFalse(review["model_called"])
    def test_modified_source_is_candidate_not_new_statistic(self):
        catalog=copy.deepcopy(self.catalog)
        catalog["dataset"][0]["modified"]="2026-11-01"
        review=evaluate(self.baseline,catalog)
        self.assertEqual(review["status"],"review_candidates")
        self.assertEqual(review["metadata_changes"][0]["topic"],"seaweed")
        self.assertIn("not_statistical_revision",review["metadata_changes"][0]["reason"])
        self.assertFalse(review["numeric_values_rewritten"])
    def test_absent_dataset_cannot_mean_zero(self):
        catalog=copy.deepcopy(self.catalog)
        catalog["dataset"].pop()
        report=evaluate(self.baseline,catalog)
        self.assertEqual(report["status"],"review_candidates")
        self.assertEqual(len(report["missing_catalog_entries"]),1)
        self.assertNotIn("value",report["missing_catalog_entries"][0])
    def test_external_urls_rejected_and_catalog_schema_fail_closed(self):
        self.assertFalse(public_source("http://portaldata.kkp.go.id/no"))
        self.assertFalse(public_source("https://portaldata.kkp.go.id.evil.test/no"))
        self.assertFalse(public_source("https://evil.test/"))
        self.assertTrue(public_source("https://portaldata.kkp.go.id/api/portal/data_dcat"))
        with self.assertRaises(ValueError):evaluate(self.baseline,{"error":"temporarily unavailable"})
        with self.assertRaises(ValueError):evaluate({"schema":"wrong","catalog":"x"},{"dataset":[]})

if __name__=="__main__":unittest.main()
