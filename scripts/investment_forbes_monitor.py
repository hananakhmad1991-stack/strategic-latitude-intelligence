#!/usr/bin/env python3
"""Monitor new Forbes Indonesia richest annual editions.
Fail closed. Only replaces rankings when an official source has an unambiguous
20-row table. An unparsed new edition triggers a review alert, never guesses.
"""
import datetime as dt
import html
import json
import pathlib
import re
import urllib.request
from html.parser import HTMLParser

ROOT=pathlib.Path(__file__).resolve().parents[1]
PATH=ROOT/"data"/"investment-forbes-top20.json"
NOW=dt.datetime.now(dt.timezone.utc)

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (compatible; SLI dated-source research)"})
    with urllib.request.urlopen(req,timeout=30) as response:
        return response.read(2500000).decode("utf-8",errors="replace")

def discover(page,year):
    source="https://www.forbeschina.com/lists"
    # Only links on the publisher's own domain and matching the explicit annual edition.
    for match in re.finditer(r'<a\\b[^>]*href=["\\']([^"\\']+)["\\'][^>]*>(.*?)</a>',page,re.I|re.S):
        target,body=match.groups()
        visible=html.unescape(re.sub(r"<[^>]*>"," ",body))
        context=html.unescape(re.sub(r"<[^>]*>"," ",page[max(match.start()-200,0):match.end()+200]))
        if ("印尼富豪榜" not in visible and "印尼富豪榜" not in context) or str(year) not in context:
            continue
        uri=target if target.startswith("https://www.forbeschina.com/lists/") else ("https://www.forbeschina.com"+target if target.startswith("/lists/") else "")
        if re.fullmatch(r"https://www\\.forbeschina\\.com/lists/\\d+",uri):
            return uri
    return None

def parse_table(page):
    # Conservative row parser: requires rank 1..20, English names and USD-bn
    # figure under publisher's table columns. Anything ambiguous is rejected.
    output=[]
    for row in re.findall(r"<tr\\b[^>]*>(.*?)</tr>",page,re.I|re.S):
        cells=[html.unescape(re.sub(r"<[^>]*>"," ",part)).strip()
               for part in re.findall(r"<t[dh]\\b[^>]*>(.*?)</t[dh]>",row,re.I|re.S)]
        if len(cells)<4:continue
        if not re.fullmatch(r"(?:[1-9]|1\\d|20)",cells[0]):continue
        name=cells[1].strip()
        if not re.search(r"[A-Za-z]{3}",name):continue
        amount=None
        for cell in cells[2:5]:
            raw=re.search(r"^\\$?\\s*(\\d+(?:\\.\\d+)?)\\s*$",cell)
            if raw:amount=float(raw.group(1));break
        if amount is None:continue
        rank=int(cells[0])
        if rank!=len(output)+1 or not(0.1<amount<1000):return None
        output.append({"rank":rank,"name":name,"net_worth_usd_billion":amount,"forbes_industry":cells[-1][:80]})
        if len(output)>=20:break
    return output if len(output)==20 and len({x["name"] for x in output})==20 else None

def main():
    old=json.loads(PATH.read_text(encoding="utf-8"))
    review_year=int(old["edition"][:4])
    changed=False
    try:
        landing=fetch("https://www.forbeschina.com/lists")
        for year in [review_year+1,review_year+2]:
            newurl=discover(landing,year)
            if not newurl:continue
            page=fetch(newurl)
            parsed=parse_table(page)
            if parsed:
                old.update(edition=f"{year} Indonesia's 50 Richest",published=f"{year}-12",source_url=newurl,rankings=parsed,status=f"Publisher {year} annual list (source validated for 20 visible rows)",review_alert=None)
                changed=True
            else:
                old["review_alert"]=f"Official Forbes {year} list may be available at {newurl}; full 20-item table could not be verified automatically. Older validated edition retained."
                changed=True
            break
    except (OSError,ValueError,TypeError,IndexError) as exc:
        print("Forbes publisher scan unavailable: "+type(exc).__name__)
    old["last_auto_checked_at"]=NOW.isoformat()
    PATH.write_text(json.dumps(old,ensure_ascii=False,indent=2)+"\\n",encoding="utf-8")
    print("Forbes monitored: "+("new edition checked" if changed else "no eligible new verified edition; older ranking retained"))

if __name__=="__main__":
    main()
