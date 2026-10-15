#!/usr/bin/env python3
"""Domestic energy OSINT RSS discovery; attributed headline leads, no invented incidents."""
import datetime as dt,email.utils,json,re,time,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
TOPICS=[
 {"id":"forest_fire","name":"Forest fires and haze","query":"(karhutla OR kebakaran hutan OR kebakaran lahan) (BNPB OR BPBD OR Indonesia)","channel":"Wildfire / peat / haze","impact":"Potential disruption to energy transport and project sites; verify fire location, burned area, smoke, asset proximity, and BNPB/BPBD status.","verify":"BNPB/BPBD incident status; KLHK hotspots; BMKG wind/rain"},
 {"id":"refinery","name":"Refinery operations & capacity","query":"(kilang OR RDMP OR RFCC OR unit pengolahan OR refinery) (Pertamina OR Balikpapan OR Cilacap OR Dumai OR Balongan OR Plaju OR Kasim) (operasi OR komisioning OR kapasitas OR gangguan OR perawatan OR produksi OR kebakaran OR shut down)","channel":"Refining / fuel resilience","impact":"Possible refinery feedstock, throughput, commissioning or fuel-quality effects. A nameplate design change or headline does not confirm actual production loss or a nationwide BBM supply shortage.","verify":"Primary KPI/KPB/ESDM statement; exact refinery & process train; bpd throughput vs design capacity; outage dates; product volumes and restoration"},
 {"id":"fuel","name":"Fuel and LPG availability","query":"(BBM OR LPG OR Pertamina) (kelangkaan OR antrean OR pasokan OR stok OR distribusi) Indonesia","channel":"Fuel logistics","impact":"Potential pressure on regional fuel availability, retail logistics and industrial costs; verify inventory and district-level distribution.","verify":"BPH Migas / Pertamina supply confirmation; outages by region; distribution restoration"},
 {"id":"power","name":"Electricity outages","query":"(PLN OR listrik) (pemadaman OR gangguan OR padam OR blackout OR pemulihan)","channel":"Grid reliability","impact":"Potential downtime for manufacturing, cold chains and data centers; distinguish planned maintenance from unplanned disruption.","verify":"PLN region, outage timing, number of customers, restoration and cause"},
 {"id":"projects","name":"Energy project commissioning","query":"(PLN OR ESDM OR Pertamina) (peresmian OR beroperasi OR COD OR groundbreaking OR proyek energi OR PLTS OR PLTA OR PLTP)","channel":"Investment implementation","impact":"Check whether an announcement represents commitment, construction, commissioning, energization or commercial operation.","verify":"Official COD or commissioning report; MW capacity; location; sponsor; implementation date"},
 {"id":"policy","name":"Energy regulations and permits","query":"(ESDM OR JDIH ESDM OR peraturan menteri) (peraturan OR kepmen OR regulasi OR kebijakan energi OR batubara OR migas)","channel":"Policy / compliance","impact":"Potential changes to project licensing, fuel and coal pricing, domestic supply requirements and implementation costs.","verify":"Exact enacted regulation on JDIH; effective date; regulated entities; transition clauses"},
 {"id":"supply_disaster","name":"Floods and infrastructure disruption","query":"(BNPB OR banjir OR longsor OR cuaca ekstrem) (listrik OR energi OR jalan OR pelabuhan OR logistik) Indonesia","channel":"Physical infrastructure","impact":"Potential transmission or distribution disruption, road closures, pipeline access and energy-supply delays.","verify":"BNPB/BMKG and asset-operator statements; recovery duration and actual affected routes"}
]
PUBLISHERS={"Reuters","Antara","ANTARA","BNPB","Kementerian ESDM","Kementerian Energi dan Sumber Daya Mineral","PT PLN (Persero)","PLN","Pertamina","Kilang Pertamina Internasional","PT Kilang Pertamina Balikpapan","BPH Migas","BMKG","Kompas.com","CNBC Indonesia","Bisnis.com","Kontan","Tempo","The Jakarta Post","Katadata","Detik","detikNews","detikFinance","CNN Indonesia"}
def read(topic):
 query=topic["query"]+" when:3d"
 url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query,"hl":"id","gl":"ID","ceid":"ID:id"})
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-Domestic-OSINT-Public/1.0","Accept":"application/rss+xml"})
 with urllib.request.urlopen(req,timeout=18) as res:body=res.read(1100000)
 return ET.fromstring(body)
def pick(topic,root,now):
 out=[]
 for item in root.findall(".//channel/item"):
  title=" ".join((item.findtext("title") or "").split())[:190];source=(item.find("source").text or "").strip() if item.find("source") is not None else ""
  url=(item.findtext("link") or "").strip()
  try:published=email.utils.parsedate_to_datetime(item.findtext("pubDate") or "").astimezone(dt.timezone.utc)
  except Exception:continue
  if not title or not source or not url.startswith("https://"):continue
  source_link=(item.find("source").attrib.get("url","") if item.find("source") is not None else "")
  source_host=(urllib.parse.urlparse(source_link).hostname or "").lower()
  official_domains=("esdm.go.id","bnpb.go.id","bmkg.go.id","bphmigas.go.id","pln.co.id","pertamina.com","go.id")
  official=any(source_host==h or source_host.endswith("."+h) for h in official_domains)
  reputable=source in PUBLISHERS or any(source.lower().startswith(prefix) for prefix in ("antara","detik","kompas","bisnis","cnbc indonesia","katadata"))
  if not (official or reputable):continue
  if not dt.timedelta(0)<=now-published<=dt.timedelta(days=4):continue
  out.append({"category":topic["name"],"topic_id":topic["id"],"channel":topic["channel"],"title":title,"publisher":source,"url":url,"published_at_utc":published.isoformat(),
    "claim_status":("Official-source headline — check original release" if official else "Media headline — independently verify event"),"analysis":"Possible pathway: "+topic["impact"],"evidence_to_check":topic["verify"],"impact_status":"Conditional scenario, not observed loss"})
  if len(out)>=3:break
 return out
def main():
 now=dt.datetime.now(dt.timezone.utc);articles=[];errors=[];topic_stats=[]
 for topic in TOPICS:
  try:
   candidates=pick(topic,read(topic),now)
   count=0
   for item in candidates:
    if any(x["url"]==item["url"] for x in articles):continue
    articles.append(item);count+=1
   topic_stats.append({"topic":topic["name"],"found":count})
  except Exception as e:
   errors.append({"topic":topic["name"],"error":str(e)[:160]})
  time.sleep(0.7)
 payload={"checked_at_utc":now.isoformat(),"scope":"Indonesia domestic energy/environment public-source RSS headline discovery","reports":articles,"topic_counts":topic_stats,"errors":errors,
   "methodology":"Source attribution from Google News RSS, publishers restricted to named public authorities and reputable news outlets; no article-body verification. Published date is headline publication time, not necessarily incident time. Do not interpret reports as confirmed asset outages or fuel shortages.",
   "note":"Review each original publication and verify operative facts before publishing incident-level assessments."}
 Path("data").mkdir(exist_ok=True)
 Path("data/domestic-energy-health.json").write_text(json.dumps({"checked_at_utc":payload["checked_at_utc"],"found":len(articles),"errors":errors,"topic_counts":topic_stats},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 if articles:Path("data/domestic-energy.json").write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 else:print("No qualifying headlines; previous feed retained if present; health file updated.")
 print(json.dumps({"checked_at_utc":payload["checked_at_utc"],"found":len(articles),"errors":errors,"topic_counts":topic_stats},ensure_ascii=False))
if __name__=="__main__":main()
