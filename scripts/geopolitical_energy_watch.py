#!/usr/bin/env python3
"""Global energy-security news discovery. Article leads, NOT verified event claims."""
import datetime as dt,json,re,urllib.parse,urllib.request
from pathlib import Path
TOPICS=[
 ("Hormuz and Gulf energy","(Hormuz OR Persian Gulf) (tanker OR oil OR shipping OR gas)","Maritime chokepoint","Potential shipping disruption -> freight/insurance -> Indonesian fuel import costs"),
 ("Red Sea and Bab el-Mandeb","(Houthi OR Yemen OR Bab-el-Mandeb OR Red Sea) (shipping OR tanker OR attack)","Maritime chokepoint","Routing changes -> transit time and shipping insurance -> delivered commodity cost"),
 ("Middle East energy infrastructure","(Saudi OR Aramco OR Iran OR Iraq) (refinery OR oilfield OR pipeline OR terminal)","Infrastructure","Verified production/export outage -> supply balances -> global crude and ICP exposure"),
 ("Russia and energy sanctions","(Russia OR Ukraine OR Black Sea) (oil OR LNG OR gas OR refinery)","Geoeconomic","Export restrictions/physical damage -> trade flow rerouting -> Asia energy prices"),
 ("Asian LNG and gas","(LNG OR natural gas) (Asia OR Qatar OR Australia) (supply OR disruption OR shipping)","Gas supply","Gas supply changes -> Asian LNG pricing -> power and industrial costs"),
 ("Global coal and energy policy","(coal OR thermal coal) (export OR restriction OR strike OR shortage)","Coal markets","Export logistics/policy -> regional coal benchmark -> Indonesia export and power sector")
]
TRUSTED={"reuters.com","apnews.com","bloomberg.com","ft.com","iea.org","eia.gov","worldbank.org","argusmedia.com","spglobal.com","tradewindsnews.com","lloydslist.com","oilprice.com"}
def fetch(query):
 params=urllib.parse.urlencode({"query":query,"mode":"artlist","format":"json","timespan":"2d","maxrecords":"25","sort":"datedesc"})
 url="https://api.gdeltproject.org/api/v2/doc/doc?"+params
 req=urllib.request.Request(url,headers={"User-Agent":"SLI-OSINT-Research/1.0","Accept":"application/json"})
 with urllib.request.urlopen(req,timeout=22) as res:return json.load(res).get("articles",[])
def main():
 now=dt.datetime.now(dt.timezone.utc);items=[];errors=[]
 for topic,query,typ,pathway in TOPICS:
  try:records=fetch(query)
  except Exception as exc:
   errors.append({"topic":topic,"error":str(exc)[:160]});continue
  count=0
  for art in records:
   url=art.get("url","");host=urllib.parse.urlparse(url).hostname or ""
   if not any(host==d or host.endswith("."+d) for d in TRUSTED):continue
   title=re.sub(r"\s+"," ",str(art.get("title",""))).strip()[:190]
   date=str(art.get("seendate",""))
   if not title or not url.startswith("https://") or not re.fullmatch(r"\d{14}",date):continue
   try:observed=dt.datetime.strptime(date,"%Y%m%d%H%M%S").replace(tzinfo=dt.timezone.utc)
   except ValueError:continue
   if not dt.timedelta(0)<=now-observed<=dt.timedelta(days=3):continue
   if any(x["url"]==url for x in items):continue
   items.append({"topic":topic,"type":typ,"title":title,"publisher":host,"url":url,"indexed_at_utc":observed.isoformat(),"impact_pathway":pathway,
     "assessment":"Potential transmission pathway only. Verify the original report, event date, operational impact and Indonesia exposure before treating as confirmed.",
     "status":"Unverified news lead"})
   count+=1
   if count>=3:break
 output={"checked_at_utc":now.isoformat(),"coverage":"GDELT article discovery; curated publisher domains; titles are attributed, unverified; not a live incident database","events":items[:20],"errors":errors,"disclaimer":"News indexing timestamp is not incident time. Headlines are not independent evidence of attacks or outages. All analytical pathways are conditional, not forecasts."}
 p=Path("data/geopolitical-energy.json");p.parent.mkdir(exist_ok=True)
 # Preserve last good feed during API outage, but never misrepresent its freshness.
 if items:p.write_text(json.dumps(output,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
 else:print("No vetted publisher headlines fetched; existing last-good snapshot preserved.")
 Path("data/geopolitical-energy-status.json").write_text(json.dumps({"checked_at_utc":now.isoformat(),"leads_found":len(items),"errors":errors,"status":"published" if items else "no_verified_leads_or_source_unavailable","note":"A successful workflow does not mean news leads were available. Review source errors."},indent=2)+"\n",encoding="utf-8")
 print(json.dumps({"found":len(items),"errors":errors,"checked_at_utc":output["checked_at_utc"]},indent=2))
if __name__=="__main__":main()
