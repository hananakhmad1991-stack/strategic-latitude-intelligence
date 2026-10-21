#!/usr/bin/env python3
"""Offline validator for KKP's 2024 hatchery CSV export. NEVER scrape or publish unlicensed bulk data.
The standard portal preview displays only 10 of 1,387 source rows; source CSV must be
obtained from KKP's own 'Unduh Data' control or an explicitly permitted distributor.
Use --rights-reviewed only AFTER documented data-use permission; writes an artifact,
not a public repository data file. No network, AI estimates or bulk API guessing.
"""
import argparse,csv,hashlib,json,pathlib,re,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
EXPECTED_ROWS=1387
SOURCE="https://portaldata.kkp.go.id/datainsight/produksi-ikan-pembenihan"
COLUMNS={"year":("tahun","year"),"province":("provinsi","province"),
"district":("kab kota","kabupaten kota","kab kota wilayah","district city","kabupaten"),
"species":("kelompok ikan","jenis ikan","komoditas","fish category"),
"volume_ribu_ekor":("volume ribu ekor","volume produksi ribu ekor","volume"),
"value_rp_million":("nilai rp juta","nilai produksi rp juta","nilai"),
"weighted_price_rp_per_thousand":("harga rata rata tertimbang rp ribu ekor","harga rata rata tertimbang","harga rata rata")}
def normalize(s):
 return " ".join(re.findall(r"[a-z0-9]+",str(s or "").lower()))
def resolve(headers):
 names={normalize(n):n for n in headers}
 mapping={}
 for field,options in COLUMNS.items():
  candidates=[names[n] for k in options if (n:=normalize(k)) in names]
  if len(candidates)!=1:raise ValueError("Unambiguous KKP CSV header required for "+field+": "+str(candidates))
  mapping[field]=candidates[0]
 if len(set(mapping.values()))!=len(mapping):raise ValueError("Overlapping field header assignment")
 return mapping
def number(s):
 t=str(s or "").strip().replace(" ","")
 if not t or t in ("-","NA","N/A"):raise ValueError("Blank numeric cell")
 # Original KKP prints Indonesian separator format: 13.980.000, 1.398, 0,25.
 if not re.fullmatch(r"(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?",t):raise ValueError("Non-ID number format "+repr(t))
 x=float(t.replace(".","").replace(",","."))
 if not (x>0 and x<1e14):raise ValueError("Invalid amount "+repr(t))
 return x
def examine(stream,preview=None):
 reader=csv.DictReader(stream)
 if not reader.fieldnames:raise ValueError("Missing CSV header")
 c=resolve(reader.fieldnames)
 rows=[];seen=set()
 for line,r in enumerate(reader,start=2):
  try:
   year=int(str(r[c["year"]]).strip())
   if year!=2024:raise ValueError("Expected 2024 observations")
   p=str(r[c["province"]] or "").strip().title()
   d=str(r[c["district"]] or "").strip().title()
   sp=str(r[c["species"]] or "").strip().title()
   if not p or not d or not sp:raise ValueError("Missing locality/species")
   key=(p.casefold(),d.casefold(),sp.casefold(),year)
   if key in seen:raise ValueError("Duplicate district-species-year record")
   seen.add(key)
   row={"year":year,"province":p,"district":d,"species":sp,
    "volume_ribu_ekor":number(r[c["volume_ribu_ekor"]]),
    "value_rp_million":number(r[c["value_rp_million"]]),
    "weighted_price_rp_per_thousand":number(r[c["weighted_price_rp_per_thousand"]])}
   rows.append(row)
  except (TypeError,ValueError) as e:raise ValueError(f"KKP CSV line {line}: {e}") from e
 if len(rows)!=EXPECTED_ROWS:raise ValueError(f"Expected exactly {EXPECTED_ROWS} KKP district/commodity source rows; got {len(rows)}")
 if preview:
  def key(r):return tuple(str(r[k]).casefold() for k in ("province","district","species"))
  sampled={key(r):r for r in rows}
  for p in preview:
   found=sampled.get(key(p))
   if not found:raise ValueError("Previously source-visible top-ten row missing: "+str(key(p)))
   for k in ("volume_ribu_ekor","value_rp_million","weighted_price_rp_per_thousand"):
    if abs(found[k]-float(p[k]))>0.001:raise ValueError("Source-visible 10-row mismatch "+str(key(p))+" "+k)
 return rows
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--csv",required=True,help="KKP 2024 official source CSV, externally obtained with use permission")
 ap.add_argument("--audit",default="artifacts/kkp-hatchery-export-review.json")
 ap.add_argument("--normalized-output",default="artifacts/kkp-hatchery-reviewed-2024.json")
 ap.add_argument("--rights-reviewed",action="store_true",help="Explicit permission for storing the full source-derived numeric rows in artifacts")
 args=ap.parse_args()
 source=pathlib.Path(args.csv);payload=source.read_bytes()
 if len(payload)>20_000_000:raise ValueError("KKP source CSV unexpectedly large")
 if b"\x00" in payload:raise ValueError("Not a UTF-8 CSV (binary XLSX needs explicit conversion)")
 raw=payload.decode("utf-8-sig")
 old=json.loads((ROOT/"data/sli-kkp-portal-screened-2024.json").read_text(encoding="utf-8"))
 rows=examine(raw.splitlines(keepends=True),old["seed_district_top_rows"]["rows"])
 out={"schema":"sli-kkp-2024-hatchery-import-review-v1","source_url":SOURCE,"source_sha256":hashlib.sha256(payload).hexdigest(),
   "observation_year":2024,"rows":len(rows),"district_species_pairs":len({(x["province"],x["district"],x["species"]) for x in rows}),
   "volume_sum_ribu_ekor":round(sum(x["volume_ribu_ekor"] for x in rows),3),
   "kkp_national_displayed_ribu_ekor":old["seed_species"]["national_total_displayed"],
   "report_total_gap_ribu_ekor":round(sum(x["volume_ribu_ekor"] for x in rows)-old["seed_species"]["national_total_displayed"],3),
   "preview_top10_reconciled":True,"storage_rights_reviewed":args.rights_reviewed,
   "public_sli_numeric_ingestion":"not_promoted_requires_manual_source_license_and_methodology_review",
   "warnings":["No auto-publication, national-ratio inference, map boundary approval, or 2026-supply claims.","Full output requires explicit rights review; both outputs remain Actions/local artifacts until human acceptance."]}
 target=pathlib.Path(args.audit);target.parent.mkdir(parents=True,exist_ok=True);target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 if args.rights_reviewed:
  target=pathlib.Path(args.normalized_output);target.parent.mkdir(parents=True,exist_ok=True)
  target.write_text(json.dumps({"schema":"sli-kkp-2024-hatchery-reviewed-candidate-v1","audit":out,"rows":rows},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps(out,ensure_ascii=False))
if __name__=="__main__":main()
