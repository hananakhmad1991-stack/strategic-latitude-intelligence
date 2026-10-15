#!/usr/bin/env python3
"""Domestic energy OSINT RSS discovery; attributed headline leads, no invented incidents."""
import datetime as dt,email.utils,json,re,time,urllib.parse,urllib.request,xml.etree.ElementTree as ET
from pathlib import Path
from energy_sector_taxonomy import classify, SECTORS
TOPICS=[
 {"id":"oil_gas_upstream","name":"Oil & Gas · upstream / SKK Migas","query":"(SKK Migas OR KKKS OR lifting migas OR eksplorasi minyak OR hulu migas) (produksi OR investasi OR pengeboran OR temuan OR kontrak) Indonesia","window_days":7,"channel":"Upstream oil / gas production","impact":"Potential implications for crude production and lifting, PSC work plans, field development and import exposure. Verify whether claims are plans or operating results.","verify":"Ditjen Migas/SKK Migas and KKKS statement; block and operator; oil bpd / gas MMSCFD; contract or production dates"},
 {"id":"oil_gas_gas","name":"Oil & Gas · LNG, HGBT & Jargas","query":"(gas bumi OR PGN OR LNG OR HGBT OR jargas) (pasokan OR harga OR produksi OR proyek OR ekspor OR impor OR pipa) Indonesia","window_days":7,"channel":"Natural gas / LNG / industrial gas","impact":"Potential gas supply, domestic industrial pricing, LNG availability or household pipeline-network changes; distinguish connection announcements from actual gas flow.","verify":"Ditjen Migas, BPH Migas, PGN, SKK Migas and end-user releases; gas volume, HGBT eligibility and completed connections"},
 {"id":"coal_production","name":"Coal · production, RKAB & HBA","query":"(batubara OR batu bara OR minerba OR HBA OR RKAB) (produksi OR RKAB OR ekspor OR harga OR izin OR royalti OR tambang) Indonesia","window_days":7,"channel":"Coal licensing / output / prices","impact":"Potential implications for coal production, export and fiscal receipts; reference prices, approved plans and actual shipments are different measures.","verify":"ESDM Ditjen Minerba JDIH, company mining disclosures; IUP/IUPK, production tonnes, price vintage and realized sales"},
 {"id":"coal_dmo","name":"Coal · DMO, PLN & PLTU supply","query":"(DMO batubara OR pasokan batubara PLN OR stok batubara PLTU OR PLN EPI) Indonesia","window_days":7,"channel":"Coal domestic obligation / PLTU","impact":"Potential domestic thermal power coal delivery bottlenecks or revisions to DMO; do not infer nationwide PLTU shortages without stock and delivery data.","verify":"ESDM Minerba, PLN EPI and affected power generator; allocation, tonnage delivered, coal quality and days of stock"},
 {"id":"nre_solar_wind","name":"NRE · solar and wind","query":"(PLTS OR pembangkit listrik tenaga surya OR PLTB OR energi angin OR energi surya) (investasi OR proyek OR beroperasi OR COD OR kapasitas OR regulasi) Indonesia","window_days":7,"channel":"Solar PV / wind","impact":"Potential NRE capacity addition or project financing, not automatically actual power generated; verify grid energization and commissioned MW.","verify":"ESDM EBTKE, PLN/RUPTL and project owner; PPA, COD, nameplate MW, capacity factor and location"},
 {"id":"nre_geothermal_hydro","name":"NRE · geothermal and hydropower","query":"(panas bumi OR geothermal OR PLTP OR PLTA OR tenaga air) (investasi OR pengeboran OR beroperasi OR kapasitas OR proyek OR COD) Indonesia","window_days":7,"channel":"Geothermal / hydropower","impact":"Potential new firm renewable generation and system flexibility, pending verified drilling, financing and COD.","verify":"ESDM EBTKE, geothermal developers, PLN/RUPTL; MW, reservoir status, dams, PPA, commercial operations"},
 {"id":"nre_policy","name":"NRE · regulation, financing and grid","query":"(energi terbarukan OR EBT OR transisi energi OR RUPTL) (insentif OR peraturan OR investasi OR penyimpanan energi OR jaringan) Indonesia","window_days":7,"channel":"NRE policy / grid integration","impact":"Could affect renewable investment conditions and grid integration; an announced rule is not necessarily enacted or financed.","verify":"JDIH ESDM and PLN; enacted document, tariff/PPA terms, grid plan and tender dates"},
 {"id":"forest_fire","name":"Forest fires and haze","query":"(karhutla OR kebakaran hutan OR kebakaran lahan) (BNPB OR BPBD OR Indonesia)","channel":"Wildfire / peat / haze","impact":"Potential disruption to energy transport and project sites; verify fire location, burned area, smoke, asset proximity, and BNPB/BPBD status.","verify":"BNPB/BPBD incident status; KLHK hotspots; BMKG wind/rain"},
 {"id":"refinery","name":"Refinery operations & capacity","query":"(kilang OR RDMP OR RFCC OR refinery) (Pertamina OR Balikpapan OR Cilacap OR Dumai OR Balongan OR Plaju OR Kasim)","window_days":30,"channel":"Refining / fuel resilience","impact":"Possible refinery feedstock, throughput, commissioning or fuel-quality effects. A nameplate design change or headline does not confirm actual production loss or a nationwide BBM supply shortage.","verify":"Primary KPI/KPB/ESDM statement; exact refinery & process train; bpd throughput vs design capacity; outage dates; product volumes and restoration"},
 {"id":"biofuels","name":"Biofuels · B50 & E10","query":"(biodiesel OR bioetanol OR biofuel OR B50 OR E10 OR E20) (produksi OR kapasitas OR pasokan OR penyaluran OR mandatori OR CPO) Indonesia","window_days":7,"channel":"Biodiesel / bioethanol / feedstock","impact":"Potential effects from FAME capacity, palm oil supply, fuel blending, bioethanol rollout and BPDP financing; identify verified impact and date.","verify":"Kepmen/JDIH legal status; EBTKE official monthly distribution and HIP; producer/site records; BPDP funding and palm feedstock data"},
 {"id":"fuel","name":"Fuel and LPG availability","query":"(BBM OR LPG OR Pertamina) (kelangkaan OR antrean OR pasokan OR stok OR distribusi) Indonesia","channel":"Fuel logistics","impact":"Potential pressure on regional fuel availability, retail logistics and industrial costs; verify inventory and district-level distribution.","verify":"BPH Migas / Pertamina supply confirmation; outages by region; distribution restoration"},
 {"id":"power","name":"Electricity outages","query":"(PLN OR listrik) (pemadaman OR gangguan OR padam OR blackout OR pemulihan)","channel":"Grid reliability","impact":"Potential downtime for manufacturing, cold chains and data centers; distinguish planned maintenance from unplanned disruption.","verify":"PLN region, outage timing, number of customers, restoration and cause"},
 {"id":"projects","name":"Energy project commissioning","query":"(PLN OR ESDM OR Pertamina) (peresmian OR beroperasi OR COD OR groundbreaking OR proyek energi OR PLTS OR PLTA OR PLTP)","channel":"Investment implementation","impact":"Check whether an announcement represents commitment, construction, commissioning, energization or commercial operation.","verify":"Official COD or commissioning report; MW capacity; location; sponsor; implementation date"},
 {"id":"policy","name":"Energy regulations and permits","query":"(ESDM OR JDIH ESDM OR peraturan menteri) (peraturan OR kepmen OR regulasi OR kebijakan energi OR batubara OR migas)","channel":"Policy / compliance","impact":"Potential changes to project licensing, fuel and coal pricing, domestic supply requirements and implementation costs.","verify":"Exact enacted regulation on JDIH; effective date; regulated entities; transition clauses"},
 {"id":"supply_disaster","name":"Floods and infrastructure disruption","query":"(BNPB OR banjir OR longsor OR cuaca ekstrem) (listrik OR energi OR jalan OR pelabuhan OR logistik) Indonesia","channel":"Physical infrastructure","impact":"Potential transmission or distribution disruption, road closures, pipeline access and energy-supply delays.","verify":"BNPB/BMKG and asset-operator statements; recovery duration and actual affected routes"}
]
PUBLISHERS={"Reuters","Antara","ANTARA","BNPB","Kementerian ESDM","Kementerian Energi dan Sumber Daya Mineral","PT PLN (Persero)","PLN","Pertamina","Kilang Pertamina Internasional","PT Kilang Pertamina Balikpapan","BPH Migas","BMKG","Kompas.com","CNBC Indonesia","Bisnis.com","Kontan","Tempo","The Jakarta Post","Katadata","Detik","detikNews","detikFinance","CNN Indonesia"}
def read(topic):
 query=topic["query"]+" when:"+str(topic.get("window_days",3))+"d"
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
  # Require topic evidence in the headline itself; RSS query matches can be noisy.
  relevance={
   "oil_gas_upstream":r"\\b(SKK\\s*Migas|KKKS|lifting|eksplorasi|sumur\\s+(?:minyak|gas)|hulu\\s+migas|produksi\\s+(?:minyak|gas))\\b",
   "oil_gas_gas":r"\\b(gas\\s+bumi|gas\\s+alam|PGN|LNG|HGBT|Jargas|pipa\\s+gas|produksi\\s+gas)\\b",
   "coal_production":r"\\b(batubara|batu\\s+bara|minerba|HBA|RKAB|IUPK|PKP2B)\\b",
   "coal_dmo":r"\\b(batubara|batu\\s+bara|DMO|PLTU|PLN\\s+EPI)\\b",
   "nre_solar_wind":r"\\b(PLTS|PLTB|surya|energi\\s+angin|pembangkit\\s+angin|solar\\s+PV)\\b",
   "nre_geothermal_hydro":r"\\b(panas\\s+bumi|geothermal|PLTP|PLTA|hidro|tenaga\\s+air)\\b",
   "nre_policy":r"\\b(energi\\s+terbarukan|EBT|transisi\\s+energi|RUPTL|renewable|penyimpanan\\s+energi)\\b",
   "biofuels":r"\b(biodiesel|bioetanol|bioethanol|biofuel|biosolar|B50|B40|E10|E20|CPO.*biodiesel|bahan bakar nabati)\b",
   "refinery":r"\b(kilang|RDMP|RFCC|refinery)\b",
   "projects":r"\b(peresmian|beroperasi|COD|groundbreaking|proyek|investasi|pembangunan|commissioning|PLTS|PLTA|PLTP)\b",
   "policy":r"\b(peraturan|kepmen|permen|regulasi|kebijakan|ditetapkan|diterbitkan|undang-undang|aturan|izin|kuota|DMO)\b",
   "supply_disaster":r"\b(banjir|longsor|cuaca ekstrem|bencana)\b"
  }
  pattern=relevance.get(topic["id"])
  if pattern and not re.search(pattern,title,re.I):continue
  if topic["id"]=="refinery" and not re.search(r"produksi|kapasitas|operasi|proyek|kebakaran|kobaran|gangguan|pasokan|pemeliharaan|turnaround|BBM|peresmian|uji|commissioning|investasi|insiden|ledakan",title,re.I):continue
  if topic["id"]=="supply_disaster" and not re.search(r"listrik|pembangkit|BBM|kilang|PLN|transmisi|energi|terminal|pelabuhan|jalan|logistik|jaringan",title,re.I):continue
  if topic["id"]=="supply_disaster" and re.search(r"Timur Tengah|Amerika|China|Eropa|Pakistan",title,re.I):continue

  source_link=(item.find("source").attrib.get("url","") if item.find("source") is not None else "")
  source_host=(urllib.parse.urlparse(source_link).hostname or "").lower()
  official_domains=("esdm.go.id","bnpb.go.id","bmkg.go.id","bphmigas.go.id","pln.co.id","pertamina.com","go.id")
  official=any(source_host==h or source_host.endswith("."+h) for h in official_domains)
  reputable=source in PUBLISHERS or any(source.lower().startswith(prefix) for prefix in ("antara","detik","kompas","bisnis","cnbc indonesia","katadata"))
  if not (official or reputable):continue
  if not dt.timedelta(0)<=now-published<=dt.timedelta(days=topic.get("window_days",3)+1):continue
  out.append({"category":topic["name"],"topic_id":topic["id"],"channel":topic["channel"],**classify(title,topic["id"],"domestic"),"title":title,"publisher":source,"url":url,"published_at_utc":published.isoformat(),
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
 sector_counts={sector:sum(1 for item in articles if sector in item["sector_tags"]) for sector in SECTORS}
 payload={"checked_at_utc":now.isoformat(),"scope":"Indonesia domestic energy/environment public-source RSS headline discovery","reports":articles,"topic_counts":topic_stats,"sector_counts":sector_counts,"sector_taxonomy_version":"2026-10-15","errors":errors,
   "methodology":"Source attribution from Google News RSS, publishers restricted to named public authorities and reputable news outlets; no article-body verification. Published date is headline publication time, not necessarily incident time. Do not interpret reports as confirmed asset outages or fuel shortages.",
   "note":"Review each original publication and verify operative facts before publishing incident-level assessments."}
 Path("data").mkdir(exist_ok=True)
 Path("data/domestic-energy-health.json").write_text(json.dumps({"checked_at_utc":payload["checked_at_utc"],"found":len(articles),"errors":errors,"topic_counts":topic_stats,"sector_counts":sector_counts},indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 if articles:Path("data/domestic-energy.json").write_text(json.dumps(payload,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 else:print("No qualifying headlines; previous feed retained if present; health file updated.")
 print(json.dumps({"checked_at_utc":payload["checked_at_utc"],"found":len(articles),"errors":errors,"topic_counts":topic_stats},ensure_ascii=False))
if __name__=="__main__":main()
