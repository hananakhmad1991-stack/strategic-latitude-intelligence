#!/usr/bin/env python3
"""Deterministic BPS HS-partner importer test: every rejection is fail closed."""
import csv
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import import_bps_hs_partner as bps

HEADERS=["direction","period","hs_code","partner_country","value_usd","net_weight_kg","source_url","source_locator"]
VALID={
 "direction":"exports", "period":"2025", "hs_code":"0901",
 "partner_country":"Japan", "value_usd":"12000.50", "net_weight_kg":"42.1",
 "source_url":"https://www.bps.go.id/id/exim",
 "source_locator":"2025 exports, HS0901, Japan, official BPS query row 7"
}
class PrimarySourceTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  self.p=Path(self.tmp.name)
  self.csv=self.p/"raw.csv"
  self.out=self.p/"out.json"
 def make(self,items=None):
  with self.csv.open("w",newline="",encoding="utf-8") as f:
   w=csv.DictWriter(f,fieldnames=HEADERS)
   w.writeheader();w.writerows(items if items is not None else [VALID])
 def test_pending_no_public_observations(self):
  self.make()
  res=bps.run(self.csv,self.out)
  self.assertEqual(res["status"],"pending_manual_primary_review")
  self.assertEqual(res["verified_cells"],0)
  self.assertEqual(len(res["candidate_observations"]),1)
  self.assertEqual(res["observations"],[])
  self.assertEqual(res["candidate_observations"][0]["value_basis"],"FOB")
  self.assertEqual(res["candidate_observations"][0]["hs_code"],"0901")
 def test_manual_full_cell_approval(self):
  self.make([VALID,{**VALID,"direction":"imports","partner_country":"Brazil","value_usd":"23000","net_weight_kg":""}])
  review={"reviewed_by":"Independent reviewer", "source_csv_sha256":hashlib.sha256(self.csv.read_bytes()).hexdigest(),
  "approved_cell_count":2,"independent_cell_checks":2,
  "review_note":"Independently matched each row to the exact original BPS HS by country query."}
  approval=self.p/"approve.json";approval.write_text(json.dumps(review))
  res=bps.run(self.csv,self.out,approval)
  self.assertEqual(res["status"],"verified")
  self.assertEqual(res["verified_cells"],2)
  self.assertEqual(res["candidate_observations"],[])
  self.assertEqual(sorted(x["value_basis"] for x in res["observations"]),["CIF","FOB"])
  self.assertIsNone(next(x for x in res["observations"] if x["direction"]=="imports")["net_weight_kg"])
  review["independent_cell_checks"]=1;approval.write_text(json.dumps(review))
  with self.assertRaisesRegex(ValueError,"Every cell"):
   bps.run(self.csv,self.out,approval)
 def test_reject_ambiguous_unverified_rows(self):
  rejects=[
   ({"hs_code":"901"},"HS2"),
   ({"partner_country":"ASEAN"},"named individual partner"),
   ({"partner_country":"Other"},"named individual partner"),
   ({"source_url":"https://bps.go.id.evil.example/data"},"official BPS"),
   ({"source_url":"http://www.bps.go.id/data"},"official BPS"),
   ({"value_usd":"1,234.5"},"dot-decimal"),
   ({"value_usd":"-5"},"dot-decimal"),
   ({"value_usd":"0"},"ambiguous zero"),
   ({"period":"2025/2026"},"YYYY"),
   ({"source_locator":"unknown"},"locator")
  ]
  for override,message in rejects:
   with self.subTest(override=override):
    self.make([{**VALID,**override}])
    with self.assertRaisesRegex(ValueError,message):
     bps.run(self.csv,self.out)
 def test_duplicate_and_sha_deny(self):
  self.make([VALID,VALID])
  with self.assertRaisesRegex(ValueError,"duplicate"):
   bps.run(self.csv,self.out)
  self.make()
  approval=self.p/"approve.json";approval.write_text(json.dumps({
    "reviewed_by":"Reviewer","source_csv_sha256":"0"*64,"approved_cell_count":1,
    "independent_cell_checks":1,"review_note":"Reviewed full published table with a source cross-reference."
  }))
  with self.assertRaisesRegex(ValueError,"SHA256"):
   bps.run(self.csv,self.out,approval)
 def test_pending_metadata_not_data(self):
  repo=Path(__file__).resolve().parents[1]
  d=json.loads((repo/"data/bps-hs-partner-matrix.json").read_text(encoding="utf-8"))
  self.assertEqual(d["schema"],bps.SCHEMA)
  self.assertEqual(d["status"],"awaiting_primary_extract")
  self.assertEqual(d["observations"],[])
  self.assertEqual(d["verified_cells"],0)
if __name__=="__main__":unittest.main()
