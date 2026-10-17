#!/usr/bin/env python3
"""Download BNPB official 2025 province XLSX, parse safely, and publish only validated counts.\nFail closed: keep last good province snapshot if the provider schema changes.\n"""
import datetime as dt
import io
import json
import pathlib
import re
import urllib.request
import zipfile
import xml.etree.ElementTree as ET
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "data/sli-bnpb-provincial-2025.json"
URL = "https://data.bnpb.go.id/dataset/58878b43-41b5-4ffb-b851-c6d8c8c4d438/resource/df39e8c3-117e-40fa-b518-ff1037743955/download/jumlah-kejadian-bencana-menurut-provinsi-2025.xlsx"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
FIELDS = {"flood": ("banjir",), "extreme_weather": ("cuaca ekstrem","cuaca ekstrim"), "wildfire": ("kebakaran hutan", "karhutla"), "drought": ("kekeringan",), "landslide": ("tanah longsor",), "coastal": ("gelombang pasang","abrasi")}
def normalize(v):
    return re.sub(r"\s+"," ",str(v or "").lower().strip())
def colindex(ref):
    letters=re.match(r"[A-Z]+",ref).group()
    n=0
    for c in letters:n=n*26+ord(c)-64
    return n-1
def parse_xlsx(raw):
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        strings=[]
        if "xl/sharedStrings.xml" in z.namelist():
            root=ET.fromstring(z.read("xl/sharedStrings.xml"))
            strings=["".join(t.text or "" for t in x.findall(".//m:t",NS)) for x in root.findall("m:si",NS)]
        sheets=[x for x in z.namelist() if re.fullmatch(r"xl/worksheets/sheet\d+\.xml",x)]
        if not sheets:raise ValueError("XLSX has no worksheet")
        for name in sheets:
            root=ET.fromstring(z.read(name)); rows=[]
            for row in root.findall(".//m:sheetData/m:row",NS):
                cells={}
                for c in row.findall("m:c",NS):
                    at=c.get("r");v=c.find("m:v",NS)
                    inline=c.find("m:is",NS)
                    text=v.text if v is not None else ("".join(t.text or "" for t in inline.findall(".//m:t",NS)) if inline is not None else "")
                    if c.get("t")=="s" and text:text=strings[int(text)]
                    if at:cells[colindex(at)]=text
                if cells:rows.append([cells.get(i,"") for i in range(max(cells)+1)])
            yield name,rows
def find_table(rows):
    for idx,row in enumerate(rows[:25]):
        labels=[normalize(x) for x in row]
        province_col=next((i for i,v in enumerate(labels) if "provinsi" in v),None)
        if province_col is None:continue
        mapping={}
        for key,terms in FIELDS.items():
            c=next((i for i,v in enumerate(labels) if any(t in v for t in terms)),None)
            if c is not None:mapping[key]=c
        if len(mapping)<3:continue
        if "flood" not in mapping or "extreme_weather" not in mapping:continue
        data=[]
        for row in rows[idx+1:]:
            province=str(row[province_col]).strip() if len(row)>province_col else ""
            if not province or any(word in normalize(province) for word in ("total","jumlah","indonesia","sumber","catatan")):continue
            if not re.search(r"[A-Za-z]",province):continue
            events={}
            for key,c in mapping.items():
                v=str(row[c]).strip() if len(row)>c else ""
                if v in ("","-","n/a"):events[key]=None;continue
                if not re.fullmatch(r"\d+(?:[.,]\d{3})*",v):raise ValueError(f"Unexpected value {v!r} for {province} / {key}")
                events[key]=int(v.replace(".","").replace(",",""))
            data.append({"province":province,"year":2025,"events":events})
        if 35<=len(data)<=40 and len(set(normalize(x["province"]) for x in data))==len(data) and sum((r["events"].get("flood") or 0) for r in data)>0:
            return data,mapping
    raise ValueError("Official workbook did not contain a validated province/hazard table")
def main():
    request=urllib.request.Request(URL,headers={"User-Agent":"StrategicLatitudeIntelligence/1.0 public research"})
    with urllib.request.urlopen(request,timeout=35) as response:raw=response.read(8_000_000)
    if not raw.startswith(b"PK"):raise ValueError("Official response is not XLSX")
    if len(raw)>=8_000_000:raise ValueError("XLSX exceeds safe download limit")
    errors=[]
    for sheet,rows in parse_xlsx(raw):
        try: records,mapping=find_table(rows);break
        except ValueError as e:errors.append(str(e))
    else:raise ValueError("; ".join(errors))
    payload={"schema":"sli-bnpb-provincial-disasters-v1","year":2025,"status":"verified_official_workbook_extraction","source_url":URL,"retrieved_at_utc":dt.datetime.now(dt.timezone.utc).isoformat(),"sheet":sheet,"columns_used":mapping,"spatial_basis":"province-level annual incident counts, not asset coordinate or hazard class","records":records,"warning":"Historical frequencies not a site-level Low/Moderate/High climate-risk estimate."}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("BNPB records accepted",len(records))
if __name__=="__main__":main()
