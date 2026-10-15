#!/usr/bin/env python3
"""Best-effort, fail-closed BI and delayed IHSG snapshot refresh.
Public endpoints can fail or change without notice. Old quotes retain old
observation dates; no 'live' promise is ever made.
"""
import datetime as dt
import html
import json
import pathlib
import re
import urllib.request
from zoneinfo import ZoneInfo

ROOT=pathlib.Path(__file__).resolve().parents[1]
PATH=ROOT/"data"/"investment-market.json"
NOW=dt.datetime.now(dt.timezone.utc)
TZ=ZoneInfo("Asia/Jakarta")

def load():
    return json.loads(PATH.read_text(encoding="utf-8"))

def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0 (SLI evidence snapshot monitoring; public source)"})
    with urllib.request.urlopen(req,timeout=22) as res:
        return res.read(1800000).decode("utf-8",errors="replace")

def money(text):
    return float(text.replace(".","").replace(",",".")) if "," in text else float(text.replace(",",""))

def update_bi(d):
    raw=fetch("https://www.bi.go.id/id/statistik/informasi-kurs/transaksi-bi/Default.aspx")
    rows=re.findall(r"<tr\b[^>]*>(.*?)</tr>",raw,flags=re.I|re.S)
    for row in rows:
        clean=html.unescape(re.sub(r"<[^>]*>"," ",row))
        if not re.search(r"\bUSD\b",clean,re.I):continue
        nums=re.findall(r"\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?",clean)
        if len(nums)<2:continue
        ask,bid=money(nums[-2]),money(nums[-1])
        if not(9000<bid<ask<30000):continue
        plain=" ".join(re.sub(r"<[^>]*>"," ",raw).split())
        month_labels={"januari":1,"februari":2,"maret":3,"april":4,"mei":5,"juni":6,
                      "juli":7,"agustus":8,"september":9,"oktober":10,"november":11,"desember":12,
                      "january":1,"february":2,"march":3,"may":5,"june":6,"july":7,
                      "august":8,"october":10,"december":12}
        date_match=re.search(r"Update Terakhir\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})",plain,re.I)
        if not date_match or date_match.group(2).lower() not in month_labels:
            raise ValueError("BI last-update date not verifiable from source")
        day_number,word,year=date_match.groups()
        observed=f"{int(year):04d}-{month_labels[word.lower()]:02d}-{int(day_number):02d}"
        day=dt.date.fromisoformat(observed)
        if day>NOW.astimezone(TZ).date() or (NOW.astimezone(TZ).date()-day).days>3:
            raise ValueError("BI quote date out of acceptable range")
        d["fx"].update(value=round((ask+bid)/2,2),ask=ask,bid=bid,observed_date=observed,last_checked_utc=NOW.isoformat(),quote_status="BI transaction buy/sell midpoint, daily—not streaming spot")
        return True
    raise ValueError("BI USD row with defensible numbers not found")

def update_jci(d):
    raw=fetch("https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?range=5d&interval=1d")
    info=json.loads(raw)["chart"]["result"][0]
    meta=info["meta"]
    value=float(meta["regularMarketPrice"])
    t=int(meta["regularMarketTime"])
    when=dt.datetime.fromtimestamp(t,dt.timezone.utc)
    if not(2000<value<30000) or when>NOW+dt.timedelta(minutes=5) or NOW-when>dt.timedelta(days=4):
        raise ValueError("Yahoo quote anomalous or outdated")
    d["ihsg"].update(value=round(value,2),observed_date=when.astimezone(TZ).date().isoformat(),last_checked_utc=NOW.isoformat(),
        quote_status="Yahoo Finance delayed quote; not guaranteed official close",source="https://finance.yahoo.com/quote/%5EJKSE/")
    prev=meta.get("previousClose")
    if prev and float(prev)>0:
        d["ihsg"]["change_pct"]=round((value/float(prev)-1)*100,2)
    return True

def main():
    d=load();done=0
    for title,fn in (("Bank Indonesia USD/IDR",update_bi),("Delayed Yahoo IHSG",update_jci)):
        try:
            if fn(d):done+=1;print(f"Updated: {title}")
        except (OSError,ValueError,KeyError,TypeError,IndexError,OverflowError) as exc:
            print(f"Skipped {title}: {type(exc).__name__} — retained earlier dated observation")
    if done:
        d["last_refresh_attempt_utc"]=NOW.isoformat()
        PATH.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Market sources refreshed: {done}/2; no fabricated intraday data")

if __name__=="__main__":
    main()
