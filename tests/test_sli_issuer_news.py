#!/usr/bin/env python3
"""Offline checks for issuer headline parsing; no network calls."""
from pathlib import Path
import datetime as dt
import email.utils
import sys
import unittest

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
import build_sli_issuer_news as feed


class FeedTests(unittest.TestCase):
    def setUp(self):
        self.issuer={"ticker":"ANTM","name":"Aneka Tambang","sector":"minerals"}
        self.now=dt.datetime(2026,10,21,6,0,tzinfo=dt.timezone.utc)

    def rss(self,title,source="ANTARA",url="https://news.google.com/rss/articles/ABC?oc=5"):
        pub=email.utils.format_datetime(self.now)
        return ('<rss><channel><item><title>'+title+'</title><link>'+url+'</link>'
                '<pubDate>'+pub+'</pubDate><source>'+source+'</source></item></channel></rss>').encode()

    def test_only_exact_ticker_or_name(self):
        hit=feed.parse_rss(self.rss("Saham ANTM menguat"),self.issuer,self.now)
        self.assertEqual(len(hit),1)
        self.assertEqual(hit[0]["tickers"],["ANTM"])
        self.assertFalse(hit[0]["company_disclosure_verified"])
        self.assertEqual(feed.parse_rss(self.rss("ANTMIN company news"),self.issuer,self.now),[])
        self.assertEqual(len(feed.parse_rss(self.rss("Aneka Tambang laporan"),self.issuer,self.now)),1)

    def test_no_untrusted_publisher_or_non_google_rss(self):
        self.assertEqual(feed.parse_rss(self.rss("ANTM",source=""),self.issuer,self.now),[])
        self.assertEqual(feed.parse_rss(self.rss("ANTM results",url="https://example.org/news"),self.issuer,self.now),[])
        self.assertFalse(feed.safe_source("http://news.google.com/rss/articles/abc"))
        self.assertFalse(feed.safe_source("https://news.google.com.evil.net/article"))

    def test_ambiguous_ticker_needs_company_name(self):
        row={"ticker":"SHIP","name":"Sillo Maritime Perdana","sector":"transport"}
        self.assertFalse(feed.match_title("new SHIP arrives",row))
        self.assertTrue(feed.match_title("Sillo Maritime Perdana earning report",row))

    def test_merge_deduplicates_and_does_not_invent_market_data(self):
        a=feed.parse_rss(self.rss("Saham ANTM menguat"),self.issuer,self.now)[0]
        b={**a,"tickers":["INCO"]}
        merged=feed.merge_rows([a],[b],self.now)
        self.assertEqual(len(merged),1)
        self.assertEqual(merged[0]["tickers"],["ANTM","INCO"])
        self.assertNotIn("quote",merged[0])
        self.assertEqual(len(feed.catalog_rows()),32)

if __name__=="__main__":
    unittest.main()
