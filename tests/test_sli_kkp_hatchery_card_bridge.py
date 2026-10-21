"""Source-qualified KKP hatchery 2024 partial 33-province Research AI evidence."""
import json,pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/"scripts"))
from sli_research_source_adapters import adapted_rows
class TestKKPHatcheryProvinceCards(unittest.TestCase):
 def test_six_truthful_index_cards(self):
  d=json.loads((ROOT/"data/sli-kkp-hatchery-province-cards-2024.json").read_text(encoding="utf8"))
  rows=list(adapted_rows("sli-kkp-hatchery-province-cards-2024.json",d))
  self.assertEqual(len(rows),6)
  self.assertTrue(all(r["source_url"].startswith("https://portaldata.kkp.go.id/") for path,r in rows))
  self.assertTrue(all(r["source_date"]=="2024" for path,r in rows))
  self.assertTrue(any("719750" in r["note"] for path,r in rows))
  self.assertTrue(all(r["unit"]=="ribu ekor" for path,r in rows))
  self.assertFalse(any("2026" in r["title"] for path,r in rows))
if __name__=="__main__":unittest.main()
