#!/usr/bin/env python3
"""SLI Food & Agriculture: source-faithful Pusdatin June 2026 importer.
No OCR, AI invention, HS recomputation, revision overwrites or paid API.
Monthly later editions require separate human-confirmed baseline promotion.
"""
import argparse
import datetime as dt
import io
import json
import re
import sys
import urllib.request
from pathlib import Path
import fitz
import pdfplumber

OFFICIAL = "https://satudata.pertanian.go.id/assets/docs/publikasi/d5bf740911a49e295dd8a1176d4f6f5d.pdf"
ROOT = Path(__file__).resolve().parents[1]
MONTHS = ["2025-05", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]
TRADE_MONTHS = ["2025-04","2025-01:04","2026-01","2026-02","2026-03","2026-04","2026-01:04"]
SECTORS = ["Tanaman Pangan","Hortikultura","Perkebunan","Peternakan","Pertanian — total"]

def number(value):
    s=str(value or "").strip().replace("\xa0","").replace(" ","")
    if not s or s in {"-","—","...","#DIV/0!","N/A"}:
        return None
    s=s.replace(".","").replace(",",".")
    try:
        f=float(s)
        return round(f,5) if abs(f)<1e12 else None
    except ValueError:
        return None

def meta(page_text, num, page_index):
    lines=[s.strip() for s in page_text.splitlines() if s.strip()]
    idx=next((i for i,v in enumerate(lines) if re.search(r"^Tabel\s*"+str(num)+r"\s*\.",v,re.I)),None)
    title=" ".join(lines[idx:idx+3]) if idx is not None else "Tabel "+str(num)
    title=re.sub(r"\s+"," ",title).split(" Mei 2025")[0]
    title=title[:220]
    unit=("Rp/Kg" if "(Rp/Kg)" in page_text else "USD 000" if "(000 USD)" in page_text else
          "USD/MT" if "(USD/MT)" in page_text else "index 2018=100" if "(2018=100)" in page_text else
          "index 2022=100" if "(2022=100)" in page_text else None)
    return {"number":num,"title":title,"pdf_page":page_index+1,"unit":unit,
       "source_page":OFFICIAL+"#page="+str(page_index+1),
       "data_period":"through_2026-04" if num<=27 else "through_2026-05"}

def rows_by_y(page):
    groups=[]
    words=sorted(page.get_text("words"),key=lambda w:(w[1],w[0]))
    for w in words:
        y=w[1]
        group=next((r for r in reversed(groups[-4:]) if abs(r[0]-y)<2.35),None)
        if group is None:
            group=[y,[]]
            groups.append(group)
        group[1].append((w[0],w[4]))
    return [(y,sorted(items)) for y,items in groups]

def province_rows(page):
    result=[]
    last=0
    for y,words in rows_by_y(page):
        if not (153<y<762):
            continue
        ids=[(x,t) for x,t in words if x<79 and re.fullmatch(r"\d{1,2}",t)]
        if len(ids)!=1:
            continue
        n=int(ids[0][1])
        if n<1 or n>38 or n<=last:
            continue
        label=" ".join(t for x,t in words if 79<=x<185 and re.search(r"[A-Za-z]",t)).strip()
        # Some publication rows use city name in this column; retain publisher's label.
        vals=[t for x,t in words if x>=185 and (re.search(r"\d",t) or t in {"-","—","#DIV/0!"})]
        if not label or len(vals)<6: continue
        six=[number(z) for z in vals[:6]]
        if len(six)!=6:continue
        result.append({"rank":n,"place":label,"series":dict(zip(MONTHS,six)),
          "mom_pct_published":number(vals[6]) if len(vals)>6 else None,
          "yoy_pct_published":number(vals[7]) if len(vals)>7 else None})
        last=n
    return result

def trade_rows(plumber_page,scope):
    tables=plumber_page.extract_tables()
    if not tables: return []
    t=tables[0]
    if len(t)<4 or len(t[2])<9:return []
    out=[]
    # Six data lines per sector in source, ordered by volume export/import/balance
    # then value export/import/balance, with seven data columns.
    for group,sector in enumerate(SECTORS):
        line=t[2] if group<4 else t[3]
        start=group*6 if group<4 else 0
        col_series=[]
        for col in range(2,9):
            arr=str(line[col] or "").splitlines()
            if len(arr)<start+6:break
            col_series.append([number(x) for x in arr[start:start+6]])
        if len(col_series)!=7:continue
        for m in range(6):
            out.append({"scope":scope,"sector":sector,"measure":["export","import","balance"][m%3],
              "unit":"tonnes" if m<3 else "thousand_usd",
              "series":dict(zip(TRADE_MONTHS,[v[m] for v in col_series]))})
    return out

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--pdf",help="Local PDF; default: public verified official PDF URL")
    ap.add_argument("--out",default="data/food-agriculture-june-2026.json")
    args=ap.parse_args()
    raw=Path(args.pdf).read_bytes() if args.pdf else urllib.request.urlopen(
       urllib.request.Request(OFFICIAL,headers={"User-Agent":"SLI-Research-Source-Archive/1.0"}),timeout=45).read()
    if not raw.startswith(b"%PDF") or len(raw)<100000:raise RuntimeError("invalid/truncated official PDF")
    fit=fitz.open(stream=raw,filetype="pdf")
    if len(fit)!=88:raise RuntimeError("June PDF page count unexpected; human review required")
    plumbers=pdfplumber.open(io.BytesIO(raw))
    tables={}
    for i,page in enumerate(fit):
        text=page.get_text()
        match=re.search(r"Tabel\s+(\d{1,2})\.",text)
        if not match:continue
        num=int(match.group(1))
        if num<1 or num>63 or num in tables:continue
        info=meta(text,num,i)
        info["numeric_rows"]=[]
        if (36<=num<=43 or 49<=num<=59):
            info["numeric_rows"]=province_rows(page)
            info["geography_label"]="Provinsi (as reported)" if num<=43 else "Pasar Tradisional menurut Provinsi/nama lokasi (as reported)"
        tables[num]=info
    if sorted(tables)!=list(range(1,64)):
        raise RuntimeError("Expected exactly 63 numbered source tables; found "+str(sorted(tables)))
    trades=[]
    for no,scope in [(1,"segar_olahan"),(2,"segar"),(3,"olahan")]:
        trades+=trade_rows(plumbers.pages[tables[no]["pdf_page"]-1],scope)
    if len(trades)!=90:raise RuntimeError("Expected 90 documented trade series, found "+str(len(trades)))
    if len(tables[38]["numeric_rows"])!=38:raise RuntimeError("Expected 38 provincial NTP records")
    grand=next(r for r in trades if r["scope"]=="segar_olahan" and r["sector"]==SECTORS[-1] and r["unit"]=="thousand_usd" and r["measure"]=="balance")
    if grand["series"]["2026-01:04"]!=6271208:
        raise RuntimeError("trade USD balance reconciliation failed: expected Pusdatin table 1 original units")
    coverage={str(n):{"rows_extracted":len(tables[n]["numeric_rows"]),"pdf_page":tables[n]["pdf_page"]} for n in range(1,64)}
    snapshot={"schema_version":"sli-food-agriculture-v1",
      "publication":{"title":"Statistik Terkini Ekonomi Pertanian — Juni 2026","publisher":"Pusdatin, Kementerian Pertanian",
        "release_date":"2026-06-30","pdf_url":OFFICIAL,"source_portal":"https://satudata.pertanian.go.id/datasets/publikasi/15",
        "pdf_pages":len(fit),"tables":63,"trade_data_through":"2026-04","other_indicators_through":"2026-05",
        "precision_note":"Publisher uses Indonesian thousands dots and decimal commas. Missing values remain null.",
        "freshness_note":"Source June 2026 is a dated official baseline, not the newest Pusdatin release. Later publications need independent validation."},
      "tables":[tables[n] for n in range(1,64)],
      "trade":trades,"coverage":coverage,
      "quality":{"trade_series":len(trades),"provincial_ntp_rows":len(tables[38]["numeric_rows"]),
        "structured_table_count":sum(bool(t["numeric_rows"]) for t in tables.values())+3,
        "remaining_tables":"Linked in source catalog; not all commodity rows are machine-validated.",
        "source_validation":"automated PDF original numbers + structural checks; not independently certified by BPS"},
      "no_imputation":True}
    target=ROOT/args.out
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(json.dumps(snapshot,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("PASS",len(fit),"pages",len(tables),"tables",len(trades),"trade series;","NTP",len(tables[38]["numeric_rows"]),"rows","output",target,"bytes",target.stat().st_size)

if __name__=="__main__":
    main()
