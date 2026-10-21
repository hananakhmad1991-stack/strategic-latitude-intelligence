import pathlib
import sys
import unittest
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/"scripts"))
from watch_pusdatin_new_editions import (listing_detail_urls,parse_edition,source_candidate,
    audit_discovery,official_url,extract_pdf)
L='<section><a href="/details/publikasi/990">Statistik Terkini Ekonomi Pertanian Oktober 2026</a><a href="/details/publikasi/989">Statistik Terkini Ekonomi Pertanian September 2026</a></section>'
NEW='<h1>Statistik Terkini Ekonomi Pertanian Oktober 2026</h1><p>Tanggal Publikasi 2026-10-30</p><a href="/assets/docs/publikasi/next-issue.pdf">Unduh PDF</a>'
OLD='<h1>Statistik Terkini Ekonomi Pertanian September 2026</h1><a href="/assets/docs/publikasi/current.pdf">Unduh PDF</a>'
class WatchTest(unittest.TestCase):
 def test_detail_source_links_are_official_only(self):
  self.assertEqual(len(listing_detail_urls(L)),2)
  self.assertIsNone(official_url('https://evil.example/phishing.pdf'))
  self.assertIsNone(official_url('https://satudata.pertanian.go.id.evil.com/x.pdf'))
  self.assertIsNone(official_url('javascript:alert(1)'))
  self.assertEqual(extract_pdf(NEW),'https://satudata.pertanian.go.id/assets/docs/publikasi/next-issue.pdf')
 def test_published_edition_comes_from_named_title(self):
  self.assertEqual(parse_edition(NEW)['edition'],'2026-10')
  self.assertEqual(parse_edition(OLD)['edition'],'2026-09')
  self.assertIsNone(parse_edition('<h1>Newsletter Pusdatin Oktober 2026</h1>'))
 def test_find_new_candidate_without_automatic_promotion(self):
  mapping={'https://satudata.pertanian.go.id/datasets/publikasi':L,
    'https://satudata.pertanian.go.id/details/publikasi/990':NEW,
    'https://satudata.pertanian.go.id/details/publikasi/989':OLD}
  result=audit_discovery(lambda url:mapping[url],lambda:{'edition':'2026-09'})
  self.assertEqual(result['status'],'new_candidate_review_required')
  self.assertEqual(result['latest_new_candidate']['edition'],'2026-10')
  self.assertEqual(result['latest_new_candidate']['published_on'],'2026-10-30')
  self.assertFalse(result['auto_publish'])
 def test_no_new_issue_is_not_falsely_claimed_current(self):
  mapping={'https://satudata.pertanian.go.id/datasets/publikasi':'<a href="/details/publikasi/989">Existing</a>',
    'https://satudata.pertanian.go.id/details/publikasi/989':OLD}
  result=audit_discovery(lambda url:mapping[url],lambda:{'edition':'2026-09'})
  self.assertEqual(result['status'],'no_new_edition_observed')
  self.assertIsNone(result['latest_new_candidate'])
if __name__=="__main__":unittest.main()