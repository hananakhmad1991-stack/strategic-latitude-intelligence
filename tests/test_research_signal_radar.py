#!/usr/bin/env python3
"""Offline checks: RSS safety, scope segregation, dates and published structure."""
import datetime as dt
import email.utils
import importlib.util
import io
import json
from pathlib import Path
from unittest.mock import patch

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sli_research_radar", root / "scripts" / "research_signal_radar.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
assert len(module.TOPICS) == 16
assert {(t[0], t[1]) for t in module.TOPICS} == set(module.GROUPS)
assert all(t[2] and t[3] and t[4] and t[5] for t in module.TOPICS)
assert module.source_ok("Reuters", "https://www.reuters.com/")
assert module.source_ok("Kementerian ESDM", "https://esdm.go.id/")
assert not module.source_ok("Unknown Personal Blog", "https://example.com")
assert module.FOCUS["minerals"].search("Indonesian copper smelter expansion")
assert module.FOCUS["ai"].search("Indonesia GPU data center expansion")

now = dt.datetime.now(dt.timezone.utc)
published = email.utils.format_datetime(now-dt.timedelta(hours=4), usegmt=True)
stale = email.utils.format_datetime(now-dt.timedelta(days=42), usegmt=True)
def item(title, date, source="Reuters"):
    return f"<item><title>{title}</title><link>https://news.google.com/rss/articles/test123?oc=5</link><pubDate>{date}</pubDate><source url='https://www.reuters.com/'>{source}</source></item>"
xml = ("<rss><channel>"+
       item("Indonesia nickel smelter expansion in Morowali", published)+
       item("Indonesia nickel smelter old news", stale)+
       item("Sports results football score", published)+
       item("Indonesian copper prices update", published, "Unverified Telegram News")+
       "</channel></rss>").encode()
class Response:
    def __enter__(self):return self
    def __exit__(self,*args):return None
    def read(self,_limit):return xml
with patch.object(module.urllib.request, "urlopen", return_value=Response()):
    records=module.scan(module.TOPICS[0],now)
assert len(records)==1,(len(records),records)
record=records[0]
assert record["sector"]=="minerals"
assert record["scope"]=="geopolitical"
assert record["evidence"].startswith("Publisher-attributed RSS headline")
assert record["impact_status"].startswith("Potential impact")
assert not any(k in record for k in ("actual_investment","confirmed_incident","probability"))
data=json.loads((root/"data"/"research-signal-radar.json").read_text())
assert data["schema_version"]==1
assert set(data["groups"])=={"minerals","ai"}
assert all(set(data["groups"][s])=={"domestic","geopolitical"} for s in ("minerals","ai"))
assert data.get("status") in ("ok","partial","awaiting_first_scan","upstream_unavailable_last_good_preserved")
print("PASS: strict-source RSS metadata, 16 topics, timestamps, category isolation and four-channel dataset")
