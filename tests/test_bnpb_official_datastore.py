"""Offline, deterministic BNPB CKAN DataStore provenance QA."""
import pathlib
import sys
import unittest

sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
from check_bnpb_official_datastore import FIELDS,RESOURCE,reconcile_datastore

def fixture():
 items=[]
 stored=[]
 for i in range(38):
  code=11+i
  source={"Provinsi":f"PROVINSI {i+1}","Kode Wilayah Provinsi":code}
  stored_row={"province":f"Provinsi {i+1}","admin_code":code}
  for idx,(name,field) in enumerate(FIELDS.items()):
   v=0 if idx else i+1
   source[field]=v
   stored_row[name]=v
  items.append(source);stored.append(stored_row)
 return {"success":True,"result":{"resource_id":RESOURCE,"total":38,"records":items}},{"year":2025,"records":stored}

class TestBnpbDataStore(unittest.TestCase):
 def test_matches_approved_38_province_snapshot_without_promotion(self):
  d,old=fixture()
  result=reconcile_datastore(d,old)
  self.assertEqual(result["status"],"matches_curated_snapshot")
  self.assertFalse(result["auto_promote"])
  self.assertEqual(result["matched_provinces"],38)
  self.assertEqual(result["observed_fields_per_province"],9)

 def test_changes_are_review_candidates_not_auto_published(self):
  d,old=fixture()
  d["result"]["records"][0]["BANJIR"]=999
  out=reconcile_datastore(d,old)
  self.assertEqual(out["status"],"drift_pending_human_review")
  self.assertEqual(out["differences_total"],1)
  self.assertFalse(out["auto_promote"])

 def test_wrong_resource_or_pagination_rejected(self):
  d,old=fixture()
  d["result"]["resource_id"]="unexpected"
  with self.assertRaisesRegex(ValueError,"resource identity"):reconcile_datastore(d,old)
  d,old=fixture()
  d["result"]["total"]=200
  with self.assertRaisesRegex(ValueError,"pagination"):reconcile_datastore(d,old)

 def test_incomplete_provinces_and_noninteger_hazards_rejected(self):
  d,old=fixture()
  d["result"]["records"].pop()
  with self.assertRaisesRegex(ValueError,"complete BNPB"):reconcile_datastore(d,old)
  d,old=fixture()
  d["result"]["records"][0]["BANJIR"]="missing"
  with self.assertRaisesRegex(ValueError,"Non-count"):reconcile_datastore(d,old)

 def test_no_imputation_and_duplicate_codes(self):
  d,old=fixture()
  d["result"]["records"][0]["GEMPABUMI"]=None
  with self.assertRaisesRegex(ValueError,"Missing"):reconcile_datastore(d,old)
  d,old=fixture()
  d["result"]["records"][1]["Kode Wilayah Provinsi"]=11
  with self.assertRaisesRegex(ValueError,"Duplicate"):reconcile_datastore(d,old)

if __name__=="__main__":unittest.main()
