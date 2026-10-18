#!/usr/bin/env python3
"""Regression checks: a Reuters/CGTN headline is eligible as attributed secondary data,
not magically promoted to a verified fact or a delivered-energy statistic.
"""
import datetime as dt
import json
import tempfile
from pathlib import Path
from scripts.build_secondary_news_index import build, normalize_row, flatten

NOW = dt.datetime(2026, 10, 18, 13, 0, tzinfo=dt.timezone.utc)
def news(name,title,url="https://news.google.com/rss/articles/valid"):
    return {"title": title, "publisher": name, "url": url,
            "published_at_utc": "2026-10-18T12:10:00Z"}
reuters = news("Reuters", "Reuters reports Strait of Hormuz closure amid shipping incident")
cgtn = news("CGTN", "CGTN reports new AI data center expansion in Asia")
assert normalize_row(reuters,"investment-news",NOW)["evidence_level"]=="publisher_attributed_news_report"
assert normalize_row(cgtn,"ai-monitoring",NOW)["publisher"]=="CGTN"
assert normalize_row(reuters,"investment-news",NOW)["article_body_checked"] is False
assert normalize_row(news("Reuters","Reuters reports Hormuz incident","http://evil.example"),"investment-news",NOW) is None
assert normalize_row(news("Reuters","Reuters reports Hormuz incident","https://127.0.0.1/private"),"investment-news",NOW) is None
radar={"groups":{"ai":{"geopolitical":[{**cgtn,"sector":"ai","scope":"geopolitical"}]}}}
assert list(flatten("research-signal-radar",radar))[0]["sector"]=="ai"
with tempfile.TemporaryDirectory() as td:
    root=Path(td)
    (root/"data").mkdir()
    (root/"data/investment-news.json").write_text(json.dumps({"reports":[reuters]}),encoding="utf-8")
    (root/"data/ai-monitoring.json").write_text(json.dumps({"reports":[cgtn]}),encoding="utf-8")
    archive=build(NOW,root)
    assert archive["count"]==2,archive["count"]
    assert {x["publisher"] for x in archive["articles"]}=={"Reuters","CGTN"}
    assert all(x["evidence_level"]=="publisher_attributed_news_report" for x in archive["articles"])
    assert all(not x["article_body_checked"] for x in archive["articles"])
    (root/"data/sli-secondary-news-index.json").write_text(json.dumps(archive),encoding="utf-8")
    (root/"data/investment-news.json").unlink()
    (root/"data/ai-monitoring.json").unlink()
    retained=build(NOW,root)
    assert retained["count"]==2, "Stored reports must persist after an upstream feed resets"
    assert retained["updated_at_utc"]==archive["updated_at_utc"],"Unchanged archive should not churn updates"
print("PASS: Reuters, CGTN, cross-channel ingestion, security, provenance and archive persistence")
