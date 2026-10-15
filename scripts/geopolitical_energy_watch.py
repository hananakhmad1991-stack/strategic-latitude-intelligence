#!/usr/bin/env python3
"""Global energy-security news discovery. Article leads, NOT verified event claims."""
import datetime as dt,json,re,urllib.parse,urllib.request,xml.etree.ElementTree as ET,email.utils
from pathlib import Path
from energy_sector_taxonomy import classify, PATTERNS, SECTORS
import time
TOPICS=[
 ("Hormuz and Gulf energy","(Hormuz OR Persian Gulf) (tanker OR oil OR shipping OR gas)","Maritime chokepoint","Potential shipping disruption -> freight/insurance -> Indonesian fuel import costs"),
 ("Red Sea and Bab el-Mandeb","(Houthi OR Yemen OR Bab-el-Mandeb OR Red Sea) (shipping OR tanker OR attack)","Maritime chokepoint","Routing changes -> transit time and shipping insurance -> delivered commodity cost"),
 ("Middle East energy infrastructure","(Saudi OR Aramco OR Iran OR Iraq) (refinery OR oilfield OR pipeline OR terminal)","Infrastructure","Verified production/export outage -> supply balances -> global crude and ICP exposure"),
 ("Russia and energy sanctions","(Russia OR Ukraine OR Black Sea) (oil OR LNG OR gas OR refinery)","Geoeconomic","Export restrictions/physical damage -> trade flow rerouting -> Asia energy prices"),
 ("Asian LNG and gas","(LNG OR natural gas) (Asia OR Qatar OR Australia) (supply OR disruption OR shipping)","Gas supply","Gas supply changes -> Asian LNG pricing -> power and industrial costs"),
 ("Global coal and energy policy","(coal OR thermal coal) (export OR restriction OR strike OR shortage)","Coal markets","Export logistics/policy -> regional coal benchmark -> Indonesia export and power sector"),
 ("Global crude oil & OPEC supply","(OPEC OR oil prices OR crude oil) (supply OR output OR production OR sanctions OR quotas)","Oil markets","International crude supply -> ICP and Indonesian refinery import/BBM cost exposure"),
 ("Coal exports and Asian import demand","(thermal coal OR coal exports) (China OR India OR Australia OR Indonesia) (demand OR prices OR tariffs OR shipping)","Coal trade","Asian coal import shifts -> Indonesian exporter revenues, DMO opportunity cost and benchmark prices"),
 ("Indonesian coal in global trade","(Indonesian coal OR Indonesia coal exports) (China OR India OR regulation OR prices)","Indonesia coal trade","Foreign buyer, sanctions and energy-security policy -> Indonesia coal exports and coal state-revenue exposure"),
 ("Global solar PV and wind supply chains","(solar panels OR solar PV OR wind turbines OR renewable energy) (tariffs OR sanctions OR trade OR investment OR supply chain)","Renewable equipment","International PV/wind equipment prices, trade barriers and FDI -> Indonesian project economics"),
 ("Battery storage and clean-energy grids","(battery storage OR grid scale storage OR renewable grid) (China OR Europe OR US OR Asia)","Renewable grid","Battery and grid procurement policy -> Indonesia renewable integration and investment costs"),
 ("Geothermal and renewable financing","(geothermal OR hydropower OR renewable electricity) (investment OR financing OR policy OR project)","NRE investment","International NRE project finance and transfer of engineering capability -> Indonesia clean power pipeline"),
 ("Biofuels and international mandates","(biofuels OR biodiesel OR bioethanol OR sustainable aviation fuel) (mandate OR trade OR tariff OR feedstock)","Bioenergy trade","International biofuel demand and standards -> Indonesian palm oil, FAME and bioethanol prices")
]
GEO_TOPIC_ID={
 "Hormuz and Gulf energy":"oil_shipping",
 "Red Sea and Bab el-Mandeb":"oil_shipping",
 "Middle East energy infrastructure":"oil_supply",
 "Russia and energy sanctions":"oil_sanctions",
 "Asian LNG and gas":"lng_asia",
 "Global coal and energy policy":"coal_markets",
 "Global crude oil & OPEC supply":"oil_supply",
 "Coal exports and Asian import demand":"coal_markets",
 "Indonesian coal in global trade":"coal_indonesia_trade",
 "Global solar PV and wind supply chains":"nre_solar_wind",
 "Battery storage and clean-energy grids":"nre_grid_storage",
 "Geothermal and renewable financing":"nre_geothermal",
 "Biofuels and international mandates":"nre_biofuels",
}
def sector_relevance(title,topic):
 key=GEO_TOPIC_ID.get(topic,"")
 tags=classify(title,key,"geopolitical")["sector_tags"]
 if "oil_gas" in tags:
  return bool(PATTERNS["oil_gas"].search(title) or re.search(r"\b(tanker|hormuz|crude|oilfield|gasfield)\b",title,re.I))
 if "coal" in tags:return bool(PATTERNS["coal"].search(title))
 if "nre" in tags:return bool(PATTERNS["nre"].search(title))
 return bool(any(PATTERNS[k].search(title) for k in ("oil_gas","coal","nre","electricity")))

RSS_TRUSTED={"Reuters","Associated Press","AP News","BBC","Financial Times","Bloomberg","CNBC","S&P Global","Nikkei Asia","Argus Media","The Guardian","Energy Intelligence","The Jakarta Post","ANTARA","IEA","EIA"}
TRUSTED={"reuters.com","apnews.com","bloomberg.com","ft.com","iea.org","eia.gov","worldbank.org","argusmedia.com","spglobal.com","tradewindsnews.com","lloydslist.com","oilprice.com"}
def fetch(query):
 params=urllib.parse.urlencode({"query":query,"mode":"artlist","format":"json","timespan":"2d","maxrecords":"25","sort":"datedesc"})
 url="https://api.gdeltproject.org/api/v2/doc/doc?"+params
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-OSINT-Research/1.0","Accept":"application/json"})
 with urllib.request.urlopen(req,timeout=22) as res:return json.load(res).get("articles",[])
def rss_fallback(now, missing_topics=None):
 """Retrieve attributed RSS news leads across several global energy themes."""
 leads=[];errors=[]
 for topic,query,typ,pathway in TOPICS:
  if missing_topics is not None and topic not in missing_topics:continue
  url="https://news.google.com/rss/search?"+urllib.parse.urlencode({"q":query+" when:2d","hl":"en-US","gl":"US","ceid":"US:en"})
  req=urllib.request.Request(url,headers={"User-Agent":"SLI-Public-News-Watcher/1.0","Accept":"application/rss+xml"})
  try:
   with urllib.request.urlopen(req,timeout=20) as res: xml=res.read(1000000)
   root=ET.fromstring(xml)
  except Exception as exc:
   errors.append({"topic":topic+" RSS","error":str(exc)[:160]})
   continue
  count=0
  for item in root.findall(".//channel/item"):
   title=" ".join((item.findtext("title") or "").split()).strip()
   src=((item.find("source").text or "").strip() if item.find("source") is not None else "")
   link=(item.findtext("link") or "").strip()
   stamp=item.findtext("pubDate") or ""
   try: published=email.utils.parsedate_to_datetime(stamp).astimezone(dt.timezone.utc)
   except Exception:continue
   if not dt.timedelta(0)<=now-published<=dt.timedelta(days=3):continue
   if not title or not link.startswith("https://") or not src:continue
   if not any(src.lower()==t.lower() or src.lower().startswith(t.lower()+" ") for t in RSS_TRUSTED):continue
   if not sector_relevance(title,topic):continue
   def tokens(t):
    return set(re.findall(r"[a-z]{4,}",t.lower().rsplit(" - ",1)[0]))-{"energy","global","reports","update","breaking","today"}
   words=tokens(title)
   if any(len(words&tokens(old["title"]))/max(1,len(words|tokens(old["title"])))>0.66 for old in leads):continue
   if any(old["url"]==link for old in leads):continue
   leads.append({"topic":topic,"topic_id":GEO_TOPIC_ID.get(topic,""),"type":typ,**classify(title,GEO_TOPIC_ID.get(topic,""),"geopolitical"),"title":title[:190],"publisher":src,"url":link,"indexed_at_utc":published.isoformat(),
    "impact_pathway":pathway,
    "assessment":"Headline discovered via RSS. Incident, duration, physical impact and relevance to Indonesia require independent verification.",
    "status":"Unverified aggregated news lead"})
   count+=1
   if count>=2:break
  time.sleep(0.8)
 return leads,errors
def main():
 now=dt.datetime.now(dt.timezone.utc);items=[];errors=[]
 for topic,query,typ,pathway in TOPICS:
  try:records=fetch(query)
  except Exception as exc:
   errors.append({"topic":topic,"error":str(exc)[:160]})
   if "429" in str(exc):break
   continue
  count=0
  for art in records:
   url=art.get("url","");host=urllib.parse.urlparse(url).hostname or ""
   if not any(host==d or host.endswith("."+d) for d in TRUSTED):continue
   title=re.sub(r"\s+"," ",str(art.get("title",""))).strip()[:190]
   date=str(art.get("seendate",""))
   if not title or not url.startswith("https://") or not re.fullmatch(r"\d{14}",date):continue
   if not sector_relevance(title,topic):continue
   try:observed=dt.datetime.strptime(date,"%Y%m%d%H%M%S").replace(tzinfo=dt.timezone.utc)
   except ValueError:continue
   if not dt.timedelta(0)<=now-observed<=dt.timedelta(days=3):continue
   if any(x["url"]==url for x in items):continue
   items.append({"topic":topic,"topic_id":GEO_TOPIC_ID.get(topic,""),"type":typ,**classify(title,GEO_TOPIC_ID.get(topic,""),"geopolitical"),"title":title,"publisher":host,"url":url,"indexed_at_utc":observed.isoformat(),"impact_pathway":pathway,
     "assessment":"Potential transmission pathway only. Verify the original report, event date, operational impact and Indonesia exposure before treating as confirmed.",
     "status":"Unverified news lead"})
   count+=1
   if count>=2:break
 missing={topic for topic,_,_,_ in TOPICS if not any(x.get("topic")==topic for x in items)}
 if missing:
  try:
   fallback,rss_errors=rss_fallback(now,missing)
   urls={x["url"] for x in items}
   for item in fallback:
    if item["url"] in urls:continue
    items.append(item);urls.add(item["url"])
   errors.extend(rss_errors)
  except Exception as e:errors.append({"topic":"Public RSS fallback","error":str(e)[:160]})
 published=items[:32]
 counts={sector:sum(1 for x in published if sector in x["sector_tags"]) for sector in SECTORS}
 output={"checked_at_utc":now.isoformat(),"coverage":"GDELT discovery with per-topic public RSS fallback; headlines are attributed and unverified, not a live incident database","events":published,"sector_counts":counts,"sector_taxonomy_version":"2026-10-15","errors":errors,"disclaimer":"News indexing timestamp is not incident time. Headlines are not independent evidence of attacks or outages. All analytical pathways are conditional, not forecasts."}
 p=Path("data/geopolitical-energy.json");p.parent.mkdir(exist_ok=True)
 # Preserve last good feed during API outage, but never misrepresent its freshness.
 if items:p.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 else:print("No vetted publisher headlines fetched; existing last-good snapshot preserved.")
 Path("data/geopolitical-energy-status.json").write_text(json.dumps({"checked_at_utc":now.isoformat(),"leads_found":len(items),"sector_counts":counts,"errors":errors,"status":"published" if items else "no_verified_leads_or_source_unavailable","note":"A successful workflow does not mean news leads were available. Review source errors."},indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"found":len(items),"errors":errors,"checked_at_utc":output["checked_at_utc"]},indent=2))
if __name__=="__main__":main()
