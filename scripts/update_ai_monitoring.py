#!/usr/bin/env python3
"""SLI AI & technology monitoring: attributed RSS leads, not verified project facts."""
import datetime as dt, json, pathlib, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"ai-monitoring.json"
TOPICS={
 "AI governance":"(Indonesia AI regulation OR Indonesia artificial intelligence Komdigi)",
 "Data centers":"(Indonesia data center OR data centre Batam Jakarta)",
 "AI compute & cloud":"(Indonesia cloud computing OR AI GPU investment)",
 "Cybersecurity":"(Indonesia cybersecurity BSSN OR data protection)",
 "Semiconductors":"(Indonesia semiconductor OR chip packaging investment)"
}
def fetch(topic,q):
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":q+" when:14d","hl":"en","gl":"ID","ceid":"ID:en"})
 req=urllib.request.Request(url,headers={"User-Agent":"StrategicLatitudeIntelligence/1.0 public research"})
 with urllib.request.urlopen(req,timeout=20) as f: raw=f.read(1500000)
 root=ET.fromstring(raw)
 results=[]
 for item in root.findall("./channel/item")[:12]:
  title=(item.findtext("title") or "").strip()
  link=(item.findtext("link") or "").strip()
  published=(item.findtext("pubDate") or "").strip()
  source=item.find("source")
  publisher=(source.text or "").strip() if source is not None and source.text else "Google News RSS attributed publisher"
  if not title or not link.startswith("https://") or not published:continue
  try:
   import email.utils
   date=email.utils.parsedate_to_datetime(published).astimezone(dt.timezone.utc).isoformat()
  except Exception:continue
  results.append({"title":title,"url":link,"publisher":publisher,"published_at_utc":date,"topic":topic,"verification":"Publisher-attributed monitoring lead; not independent project confirmation"})
 return results
def main():
 now=dt.datetime.now(dt.timezone.utc)
 old={}
 if OUT.exists():
  try:old=json.loads(OUT.read_text())
  except Exception:pass
 reports=[];errors=[]
 for topic,q in TOPICS.items():
  try:reports.extend(fetch(topic,q))
  except Exception as e:errors.append(topic+": "+str(e)[:150])
 uniq={}
 for r in reports:
  key=re.sub(r"\\s+"," ",r["title"].lower())
  if key not in uniq or r["published_at_utc"]>uniq[key]["published_at_utc"]:uniq[key]=r
 valid=sorted(uniq.values(),key=lambda x:x["published_at_utc"],reverse=True)[:55]
 if not valid:
  if old.get("reports"):
   old["last_attempt_at_utc"]=now.isoformat()
   old["errors"]=errors or ["Empty upstream feeds; preserving last verified dated snapshot"]
   OUT.write_text(json.dumps(old,indent=2,ensure_ascii=False)+"\\n")
   return
  raise RuntimeError("No feed entries received; refusing to publish empty dataset")
 payload={"scope":"Indonesia AI, data centers, cybersecurity and digital industry; RSS headline discovery only",
 "checked_at_utc":now.isoformat(),"status":"Publisher-attributed discovery, not fact-checked implementation or capital verification",
 "reports":valid,"errors":errors}
 OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\\n")
 print("Saved",len(valid),"leads; feed errors:",len(errors))
if __name__=="__main__":main()
