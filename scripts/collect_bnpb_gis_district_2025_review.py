#!/usr/bin/env python3
"""Read-only 2025 district disaster source review from BNPB ArcGIS MapServer.
Official GIS layer is evidence, not a complete national census of incidents.
Never turn absent jurisdiction or null metric values into numeric zero.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE="https://gis.bnpb.go.id/server/rest/services/Jumlah_Bencana_kabkot_2025/MapServer/13"
FIELDS=["OBJECTID","Kode_Kab","Kabupaten_Kota","Prov","BANJIR","CUACA_EKSTREM","TANAH_LONGSOR","Jml_hdro"]
# This GIS service's exact field labels come from its ArcGIS REST schema.
def request(path,args):
    url=BASE+path+"?"+urlencode(args)
    req=Request(url,headers={"User-Agent":"SLI-BNPB-official-2025-GIS-review/1.0","Accept":"application/json"})
    with urlopen(req,timeout=50) as response:
        if response.geturl().split("/")[2].lower()!="gis.bnpb.go.id":raise ValueError("Source redirected outside official BNPB GIS")
        data=response.read(3500000)
    if len(data)>=3500000:raise ValueError("GIS JSON response exceeded safe review size")
    out=json.loads(data.decode("utf-8"))
    if "error" in out:raise ValueError("BNPB API error "+str(out["error"])[:250])
    return out

def numeric(x):
    if x is None:return None
    if type(x) is bool:raise ValueError("Boolean disaster event count")
    if type(x) in (float,int) and float(x).is_integer() and 0<=int(x)<=100000:return int(x)
    raise ValueError("Non-integer disaster count: "+repr(x)[:90])

def main():
    metadata=request("",{"f":"json"})
    existing={f["name"] for f in metadata.get("fields",[])}
    if not set(FIELDS)<=existing:raise ValueError("Required source fields missing: "+repr(set(FIELDS)-existing))
    if metadata.get("type")!="Feature Layer" or metadata.get("geometryType")!="esriGeometryPolygon":raise ValueError("Unexpected GIS layer geometry/type")
    count_result=request("/query",{"f":"json","where":"1=1","returnCountOnly":"true"})
    expected=count_result.get("count")
    if type(expected) is not int or expected<300 or expected>1200:raise ValueError("Unexpected GIS 2025 features: "+repr(expected))
    raw=[]
    for offset in range(0,expected,400):
        v=request("/query",{"f":"json","where":"1=1","outFields":",".join(FIELDS),
           "returnGeometry":"false","resultOffset":offset,"resultRecordCount":400,"orderByFields":"OBJECTID ASC"})
        if not isinstance(v.get("features"),list):raise ValueError("ArcGIS features omitted")
        raw.extend(x["attributes"] for x in v["features"])
        if not v["features"]:break
    if len(raw)!=expected:raise ValueError("ArcGIS record coverage mismatches count "+str(len(raw))+"/"+str(expected))
    names={"BANJIR":"flood_events","CUACA_EKSTREM":"extreme_weather_events","TANAH_LONGSOR":"landslide_events","Jml_hdro":"source_reported_hydrometeorological_total"}
    normalized=[];seen_codes=set();seen_oids=set()
    for x in raw:
        code=x.get("Kode_Kab");oid=x.get("OBJECTID");name=str(x.get("Kabupaten_Kota") or "").strip()
        if type(code) is not int or code<=0 or not name or type(oid) is not int:raise ValueError("Invalid district identity")
        if oid in seen_oids:raise ValueError("Repeated GIS OBJECTID")
        seen_oids.add(oid)
        if code in seen_codes:raise ValueError("Repeated district code "+str(code))
        seen_codes.add(code)
        normalized.append({"admin_code":str(code),"district":name,"province":str(x.get("Prov") or "").strip(),
            "source_objectid":oid,**{dest:numeric(x.get(key)) for key,dest in names.items()}})
    totals={v:sum(x[v] for x in normalized if x[v] is not None) for v in names.values()}
    missing={v:sum(x[v] is None for x in normalized) for v in names.values()}
    historical=Path("data/sli-bnpb-district-2024.json")
    overlap={}
    if historical.is_file():
        old=json.loads(historical.read_text(encoding="utf-8"))
        old_codes={x["admin_code"] for x in old.get("records",[])}
        new_codes={x["admin_code"] for x in normalized}
        overlap={"matched_kabkot_codes":len(new_codes & old_codes),"old_only":len(old_codes-new_codes),"new_only":len(new_codes-old_codes),
          "note":"Overlap metadata only. No automatic year-on-year % until source coverage, type definitions and revisions checked."}
    result={
      "schema":"sli-bnpb-gis-district-2025-candidate-v1","period":"2025",
      "publisher":"BNPB official geospatial service",
      "source_url":BASE,"source_layer":"Jumlah_Bencana_kabkot", "source_layer_id":13,
      "retrieved_at":datetime.now(timezone.utc).isoformat(),
      "status":"publisher_gis_layer_observations_review_only_not_yet_accepted_by_editor",
      "geography":"kabupaten/kota boundaries, publisher feature set; not complete national jurisdiction coverage unless separately proven",
      "record_count":len(normalized),"records":normalized,"source_totals_unreviewed":totals,
      "missing_values":missing,"overlap_with_2024_resource":overlap,
      "limitations":[
       "Service title specifies 2025, but service metadata does not provide field-level revision or methodological bulletin dates; confirm period/revision before interpreting trend.",
       "The GIS layer fields are reported number of events, not physical hazard intensity, population exposure, climate attribution or asset-specific loss.",
       "The Jml_hdro source field is retained verbatim but NOT assumed to equal the sum of reported hazard subcategories.",
       "Year-over-year comparisons require matching geographic coverage/definitions; omitted districts are missing, NOT zero.",
       "2025 GIS layer totals can differ from 2025 BNPB official provincial spreadsheet because of publication snapshots / definitions."
      ]}
    out=Path("artifacts/sli-bnpb-gis-district-2025-review.json")
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("BNPB_GIS2025_SOURCE_RESULT="+json.dumps({"count":len(normalized),"totals":totals,"missing":missing,"overlap":overlap,
         "first_three":normalized[:3]},ensure_ascii=False,separators=(",",":")))
if __name__=="__main__":main()
