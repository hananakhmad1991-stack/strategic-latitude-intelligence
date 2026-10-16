#!/usr/bin/env python3
"""Normalize BNPB open datastore province totals; fail closed on schema/remote errors."""
import json, urllib.request, urllib.parse, pathlib, datetime
BASE=pathlib.Path(__file__).resolve().parents[1]
RESOURCE="df39e8c3-117e-40fa-b518-ff1037743955"
URL="https://data.bnpb.go.id/api/3/action/datastore_search"
DEST=BASE/"data/sli-bnpb-provincial-2025.json"
COLUMNS={"BANJIR":"flood","CUACA EKSTREM":"extreme_weather","KEBAKARAN HUTAN DAN LAHAN":"wildfire","KEKERINGAN":"drought","TANAH LONGSOR":"landslide","GELOMBANG PASANG DAN ABRASI":"coastal"}
def fetch(offset):
    query=urllib.parse.urlencode({"resource_id":RESOURCE,"limit":100,"offset":offset})
    req=urllib.request.Request(URL+"?"+query,headers={"User-Agent":"SLI-open-research/1.0"})
    with urllib.request.urlopen(req,timeout=25) as response:
        payload=json.load(response)
    if payload.get("success") is not True or not isinstance(payload.get("result",{}).get("records"),list):
        raise ValueError("BNPB CKAN datastore returned invalid response")
    return payload["result"]
def run():
    rows=[];offset=0;seen=set()
    while True:
        page=fetch(offset);records=page["records"]
        if not records:break
        for r in records:
            prov=str(r.get("Provinsi","")).strip()
            if not prov or prov.lower() in ("indonesia","total","jumlah"):continue
            code=str(r.get("Kode Wilayah Provinsi","")).strip()
            if prov.lower() in seen:raise ValueError("Duplicate province: "+prov)
            seen.add(prov.lower())
            totals={}
            for source,key in COLUMNS.items():
                v=r.get(source)
                if v in (None,"","-"):totals[key]=None
                else:
                    n=int(str(v).replace(".","").replace(",",""))
                    if n<0:raise ValueError("Negative count")
                    totals[key]=n
            lat=r.get("Latitude");lon=r.get("Longitude")
            rows.append({"province":prov,"code":code,"administrative_centroid":[float(lat),float(lon)] if lat not in (None,"") and lon not in (None,"") else None,"events":totals,"year":2025})
        offset+=len(records)
        if len(records)<100 or offset>=500:break
    if len(rows)<30 or len(rows)>45:raise ValueError("Unexpected province count: "+str(len(rows)))
    payload={"schema":"sli-bnpb-provincial-disasters-v1","year":2025,"source":"BNPB Satu Data / DIBI","resource_id":RESOURCE,"source_url":"https://data.bnpb.go.id/dataset/kompilasi-data-kejadian-dan-dampak-bencana-2025/resource/"+RESOURCE,"retrieved_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),"spatial_basis":"province administrative centroid, not hazard or asset location","warning":"2025 province annual event counts are historical frequency, not facility exposure, probability, event severity or hazard raster.","records":rows}
    DEST.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Validated provinces",len(rows))
if __name__=="__main__":run()
