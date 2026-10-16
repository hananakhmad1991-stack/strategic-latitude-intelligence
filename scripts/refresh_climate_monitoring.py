#!/usr/bin/env python3
"""Refresh attributed environmental news leads. Google News RSS is discovery, never confirmation."""
import datetime as dt
import json
import pathlib
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data/sli-climate-monitoring.json"
queries={
 "Floods & extreme weather":"Indonesia banjir hujan ekstrem BMKG BNPB when:7d",
 "Wildfire & haze":"Indonesia karhutla kabut asap hotspot when:7d",
 "Environmental policy":"Indonesia lingkungan PROPER AMDAL limbah KLH when:14d",
 "Climate investment":"Indonesia climate risk industry smelter data center renewable water when:14d"
}
events=[]; errors=[]; now=dt.datetime.now(dt.timezone.utc)
for topic,q in queries.items():
    url="https://news.google.com/rss/search?q="+urllib.parse.quote(q)+"&hl=id&gl=ID&ceid=ID:id"
    try:
        request=urllib.request.Request(url,headers={"User-Agent":"StrategicLatitudeIntelligence/1.0 research monitoring"})
        with urllib.request.urlopen(request,timeout=15) as res:
            feed=ET.fromstring(res.read(1_500_000))
        for item in feed.findall("./channel/item")[:8]:
            title=(item.findtext("title") or "").strip()
            link=(item.findtext("link") or "").strip()
            pub=(item.findtext("pubDate") or "").strip()
            source=item.find("source")
            publisher=source.text.strip() if source is not None and source.text else "Google News RSS attribution"
            if title and link.startswith("https://"):
                events.append({"topic":topic,"title":title,"url":link,"publisher":publisher,"published":pub,"verification":"unverified media lead"})
    except Exception as exc:
        errors.append({"topic":topic,"error":type(exc).__name__})
dedup={e["title"].lower():e for e in events}
if dedup:
    payload={"checked_at":now.isoformat(),"source":"Google News RSS, attributed media leads","verification":"Monitoring discovery; verify incident and asset exposure through official sources","events":list(dedup.values()),"errors":errors}
elif OUT.exists():
    payload=json.loads(OUT.read_text(encoding="utf-8"))
    payload["last_attempt"]=now.isoformat()
    payload["errors"]=errors
    payload["warning"]="No new feed results; retained last successful snapshot without relabeling its observation timestamp."
else:
    payload={"checked_at":now.isoformat(),"events":[],"errors":errors}
OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(f"Climate monitoring: {len(payload['events'])} leads, {len(errors)} topic errors.")
