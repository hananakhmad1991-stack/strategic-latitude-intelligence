"""KKP public-source subset and Research AI ingestion invariants (never 1,387-claim)."""
import json, pathlib, sys, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from sli_research_source_adapters import adapted_rows
DATA=json.loads((ROOT/"data/sli-kkp-portal-screened-2024.json").read_text(encoding="utf8"))

class TestKKPResearchBridge(unittest.TestCase):
 def test_top_ten_source_rows_units_and_no_false_full_claim(self):
  d=DATA["seed_district_top_rows"]
  self.assertEqual(d["year"],2024)
  self.assertEqual((d["selected_count"],d["source_rows_displayed"]), (10,1387))
  self.assertEqual([d["unit_volume"],d["unit_value"],d["unit_weighted_price"]],["ribu_ekor","Rp juta","Rp/ribu ekor"])
  self.assertEqual(len(d["rows"]),10)
  self.assertEqual(d["rows"][0]["volume_ribu_ekor"],13980000)
  self.assertEqual(d["rows"][-1]["district"],"Subang")
  self.assertEqual(len({(x["province"],x["district"],x["species"]) for x in d["rows"]}),10)
  self.assertTrue(all(x["volume_ribu_ekor"]>0 and x["value_rp_million"]>0 and x["weighted_price_rp_per_thousand"]>0 for x in d["rows"]))
 def test_adapter_qualified_subset_and_primary_links(self):
  rows=list(adapted_rows("sli-kkp-portal-screened-2024.json",DATA))
  self.assertEqual(len(rows),34) # 2 national + 10 provincial top five + 12 species + 10 district
  self.assertEqual(len([x for path,x in rows if path[0]=="seed_district_top_rows"]),10)
  self.assertEqual(len([x for path,x in rows if path[0]=="seed_species"]),12)
  self.assertTrue(all(x["source_url"].startswith("https://portaldata.kkp.go.id/") for path,x in rows))
  self.assertTrue(all("2024" in x["title"] for path,x in rows))
  self.assertTrue(all("1,387" in x["note"] and "NOT" in x["note"] for path,x in rows if path[0]=="seed_district_top_rows"))

if __name__=="__main__":unittest.main()
