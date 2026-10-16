"""Deterministic schema tests for public SLI AI intelligence."""
import json,pathlib,unittest
R=pathlib.Path(__file__).resolve().parents[1]
class TestInvestor(unittest.TestCase):
 def setUp(self):
  self.d=json.loads((R/'data/ai-intelligence.json').read_text())
  self.h=json.loads((R/'data/ai-investment-events.json').read_text())
  self.r=json.loads((R/'data/ai-risk-evidence.json').read_text())
 def test_unique_project_ids(self):
  ids=[x['id'] for x in self.d['projects']]
  self.assertEqual(len(ids),len(set(ids)))
 def test_no_fake_geopins(self):
  for p in self.d['projects']:
   self.assertEqual(p['lat'] is None,p['lon'] is None)
 def test_events_refer_to_projects(self):
  ids={x['id'] for x in self.d['projects']}
  self.assertTrue(all(x['project_id'] in ids for x in self.h['events']))
 def test_weights(self):
  self.assertEqual(sum(self.r['weights'].values()),100)
 def test_no_arithmetic_of_incompatible_financials(self):
  self.assertTrue(all('investment_kind' in p and 'mw_kind' in p for p in self.d['projects']))
 def test_html_data_deps(self):
  html=(R/'ai-investor-layer.html').read_text()
  self.assertIn('data/ai-risk-evidence.json',html)
  self.assertIn('data/ai-investment-events.json',html)
  self.assertIn('renderWeightedRisk()',html)
if __name__=='__main__':unittest.main()
