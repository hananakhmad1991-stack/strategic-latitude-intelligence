#!/usr/bin/env python3
"""Strict offline XLSX->canonical CSV transfer ONLY for official KKP source exports.
No network, no public raw dataset, no numbers guessed. Actual source workbook needed.
"""
import csv, pathlib, sys, math
from import_kkp_hatchery_export import COLUMNS,normalize,resolve
def fmt(v):
 if v is None or isinstance(v,bool):return ""
 if isinstance(v,(float,int)):
  if not math.isfinite(v):return ""
  if v<=0:return str(v)
  if float(v).is_integer():return str(int(v))
  return f"{v:.8f}".rstrip("0").rstrip(".").replace(".",",")
 return str(v).strip()
def main():
 if len(sys.argv)!=3:raise SystemExit("usage: convert_kkp_hatchery_xlsx_to_csv.py input.xlsx output.csv")
 src,dest=map(pathlib.Path,sys.argv[1:])
 if src.suffix.lower()!=".xlsx" or src.stat().st_size>30_000_000:raise ValueError("Source must be bounded XLSX")
 from openpyxl import load_workbook
 wb=load_workbook(src,read_only=True,data_only=True)
 if len(wb.worksheets)>12:raise ValueError("Too many worksheets")
 headers=["Tahun","Provinsi","Kab/Kota","Kelompok Ikan","Volume (Ribu Ekor)","Nilai (Rp. Juta)","Harga Rata-Rata Tertimbang (Rp/ribu ekor)"]
 count=0
 for sh in wb.worksheets:
  rows=sh.iter_rows(values_only=True)
  mapping=None
  for n,values in enumerate(rows):
   if n>1500:raise ValueError("Unexpectedly large source spreadsheet")
   if mapping is None:
    if n>30:break
    candidates=[str(x or "").strip() for x in values]
    try:mapping=resolve(candidates)
    except ValueError:continue
    indexes={key:candidates.index(col) for key,col in mapping.items()}
    continue
   if count>1400:raise ValueError("Unexpected source row volume")
   obj={key:fmt(values[idx] if idx<len(values) else None) for key,idx in indexes.items()}
   if not any(obj.values()):continue
   if count==0:records=[]
   records.append(obj);count+=1
  if mapping is not None:break
 if count!=1387:raise ValueError("Expected exactly 1387 official source rows, received "+str(count))
 dest.parent.mkdir(parents=True,exist_ok=True)
 with dest.open("w",encoding="utf-8",newline="") as fd:
  writer=csv.writer(fd);writer.writerow(headers)
  for r in records:writer.writerow([r[k] for k in ("year","province","district","species","volume_ribu_ekor","value_rp_million","weighted_price_rp_per_thousand")])
 print("Structured XLSX source rows converted for offline KKP audit:",count)
if __name__=="__main__":main()
