#!/usr/bin/env python3
"""Read-only official SACA&D/BMKG station rainfall archive, strict provenance gate."""
import csv
import io
import json
import re
import urllib.request
import zipfile
from datetime import datetime,timezone
from pathlib import Path

URL="https://sacad.bmkg.go.id/ID/download/SACA_blend_rr.zip"
STATIONS="https://sacad.bmkg.go.id/ID/download/data/stations_rr.txt"
OUT=Path("artifacts/sli-bmkg-saca-darmaga-rain-review.json")
STAID=132
def fetch(url,cap):
    req=urllib.request.Request(url,headers={"User-Agent":"SLI-official-BMKG-source-audit/1.0","Accept":"*/*"})
    with urllib.request.urlopen(req,timeout=100) as resp:
        if resp.geturl().split("/")[2].lower()!="sacad.bmkg.go.id":
            raise ValueError("Not an official SACA source")
        data=resp.read(cap+1)
    if len(data)>cap:raise ValueError("Source exceeds byte cap")
    return data

def run():
    result={"schema":"sli-bmkg-saca-station-daily-rain-source-review-v1",
      "checked_at":datetime.now(timezone.utc).isoformat(),
      "publisher":"SACA&D operated by BMKG",
      "source_archive_url":URL,"station_metadata_url":STATIONS,
      "station_id":STAID,"station_name":"DARMAGA-BOGOR",
      "data_class":"historical_station_daily_precipitation",
      "status":"candidate_source_not_published",
      "data_value_unit_original":"0.1 mm","missing_sentinel":-9999,
      "publication_rule":"Only verified station-date observations, no current alert or province-wide inference. 0 is dry when explicitly recorded; -9999 stays null.",
      "limits":"Historical archive may end many years before 2026 and source observations may have quality flags."}
    station_text=fetch(STATIONS,600000).decode("utf-8-sig",errors="replace")
    meta=[ln for ln in station_text.splitlines() if re.match(r"^\s*132\s*,",ln)]
    if len(meta)!=1 or "DARMAGA" not in meta[0].upper():
        raise ValueError("Station ID / location not confirmed in the official inventory")
    result["official_station_metadata_line"]=meta[0].strip()
    content=fetch(URL,90000000)
    if not content.startswith(b"PK"):raise ValueError("BMKG archive is not ZIP")
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        members=[v for v in z.infolist() if not v.is_dir()]
        if len(members)>50000:raise ValueError("Archive has suspiciously many files")
        result["archive_entries"]=len(members)
        result["archive_preview"]=[m.filename[:95] for m in members[:8]]
        files=[m for m in members if re.search(r"RR_STAID0*132\.(?:txt|csv)$",m.filename,re.I)]
        if len(files)!=1:raise ValueError("SACA station rainfall file not uniquely located: "+str(result["archive_preview"]))
        member=files[0]
        if member.file_size>3500000:raise ValueError("Single station file too large")
        text=z.read(member).decode("utf-8-sig",errors="replace")
    result["station_filename"]=member.filename
    lines=[ln for ln in text.splitlines() if ln.strip() and not ln.lstrip().startswith("#")]
    header_index=next((i for i,ln in enumerate(lines) if "STAID" in ln.upper() and "DATE" in ln.upper() and "RR" in ln.upper()),None)
    if header_index is None:raise ValueError("SACA precipitation fields missing")
    reader=csv.DictReader(lines[header_index:])
    if not reader.fieldnames:raise ValueError("Unparseable header")
    keys={k.strip().upper():k for k in reader.fieldnames}
    if not {"STAID","DATE","RR"}<=set(keys):raise ValueError("Incompatible rainfall CSV header "+str(keys))
    days=[];qflags={};missing=0;seen=set()
    for row in reader:
        if int(row[keys["STAID"]])!=STAID:raise ValueError("Unexpected station record")
        day=str(row[keys["DATE"]]).strip()
        if not re.fullmatch(r"\d{8}",day):raise ValueError("Invalid date")
        if day in seen:raise ValueError("Duplicate daily observation")
        seen.add(day)
        value=int(row[keys["RR"]])
        quality=next((row[k] for name,k in keys.items() if name.startswith("Q_") and "RR" in name),None)
        if quality is not None:qflags[str(quality).strip()]=qflags.get(str(quality).strip(),0)+1
        if value==-9999:missing+=1
        elif value<0 or value>20000:raise ValueError("Invalid 0.1mm source precipitation")
        days.append({"date":f"{day[:4]}-{day[4:6]}-{day[6:]}","rain_mm":None if value==-9999 else value/10,
                     "source_value_tenth_mm":None if value==-9999 else value,"quality_flag":quality})
    if len(days)<100:raise ValueError("Too few official station days")
    days.sort(key=lambda x:x["date"])
    result.update(status="review_data_extracted_not_approved_for_live_alert",date_start=days[0]["date"],
                  date_end=days[-1]["date"],observation_days=len(days),missing_days=missing,
                  days_with_explicit_zero=sum(v["rain_mm"]==0 for v in days),
                  quality_flag_counts=qflags,observations=days)
    OUT.parent.mkdir(exist_ok=True,parents=True)
    OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("BMKG_STATION_RAINFALL_SOURCE_OK station="+str(STAID)+
          " rows="+str(len(days))+" first="+days[0]["date"]+" last="+days[-1]["date"]+
          " missing="+str(missing)+" source="+member.filename)
if __name__=="__main__":run()
