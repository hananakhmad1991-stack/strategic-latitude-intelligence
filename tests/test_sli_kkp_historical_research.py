"""KKP 2019–2024 evidence adapter: exactly 36 bounded source-linked historic records."""
import json,pathlib,sys,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from sli_research_source_adapters import adapted_rows
D=json.loads((ROOT/"data/sli-kkp-regional-historical-2019-2024.json").read_text(encoding="utf8"))
class TestKKPHistoricalResearch(unittest.TestCase):
 def test_36_qualified_records(self):
  rows=list(adapted_rows("sli-kkp-regional-historical-2019-2024.json",D))
  self.assertEqual(len(rows),36)
  self.assertEqual(len([1 for p,r in rows if "national" in p]),12)
  self.assertEqual(len([1 for p,r in rows if "top2" in p]),24)
  self.assertTrue(all(r["source_url"].startswith("https://portaldata.kkp.go.id/") for p,r in rows))
  self.assertTrue(all(r["source_date"] in [str(y) for y in range(2019,2025)] for p,r in rows))
  self.assertFalse(any("2025" in r["title"] for p,r in rows))
  self.assertTrue(any("Papua" in r["note"] for p,r in rows))
if __name__=="__main__":unittest.main()
