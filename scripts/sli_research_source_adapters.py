"""Explicit safe adapters for public, structured report-level source provenance.
Only trusted, dataset-specific pointers attach an original publication to child
rows. No arbitrary URL inheritance, no year guesses, no fabricated verification.
"""
def scalar(v):
 return v if isinstance(v,(str,int,float)) and not isinstance(v,bool) else None
def record(path,title,url,period,value,unit,detail="",publisher="Original publisher",note=""):
 if not isinstance(url,str) or not url.startswith("https://") or not title or value is None:return
 row={"title":str(title)[:180],"source_url":url,"source_date":str(period or "publication_date_unconfirmed"),
      "publisher":publisher,"value":str(value)[:180],"unit":str(unit or "")[:90],
      "note":("Dataset-specific report crosswalk, not independent verification. "+str(detail)+" "+str(note))[:480]}
 return (tuple(path),row)
def adapted_rows(name,d):
 if not isinstance(d,dict):return
 if name=="heesi-2025-integrated.json":
  u=d.get("source_url");p=d.get("published");y=str(d.get("reference_year") or "")
  for i,x in enumerate(d.get("series",[])[:30]):
   vals=x.get("values",[]);years=x.get("years",[])
   if not years or len(years)!=len(vals):continue
   out=record(("series",str(i)),"HEESI "+str(x.get("name"))+" · "+str(years[-1]),u,p,
     vals[-1],x.get("unit"),"Observation "+str(years[-1])+"; PDF pages "+str(x.get("pdf_pages"))+". Historic series, not latest in real time.","ESDM",
     "Revision/methodology breaks and 2025 report edition apply.")
   if out:yield out
 if name=="heesi-2025-power-technologies.json":
  u=d.get("source");p=d.get("publication");year=d.get("observation_year")
  for i,x in enumerate(d.get("layers",[])[:22]):
   out=record(("layers",str(i)),"2025 installed power: "+str(x.get("name")),u,p,
     x.get("reported_total"),x.get("unit"),"National installed nameplate; printed HEESI page "+str(x.get("source_pdf_page"))+"; observation "+str(year),"ESDM",
     "Total national power technology category, not available firm grid connection capacity.")
   if out:yield out
 if name=="skkmigas-annual-2025.json":
  u=d.get("source_url");year=d.get("report_year")
  for i,x in enumerate(d.get("metrics",[])[:32]):
   out=record(("metrics",str(i)),"SKK Migas "+str(x.get("title")),u,str(year),
    x.get("value"),x.get("unit"),"Annual Report "+str(year)+" PDF page "+str(x.get("pdf_page"))+
    " detail: "+str(x.get("detail") or "")[:170],"SKK Migas","Report landing page links edition; review original PDF page for exact value.")
   if out:yield out
 if name=="pln-statistics-regional-baseline-2024.json":
  source=d.get("source") or {};u=source.get("url");date=d.get("source_published")
  for i,x in enumerate(d.get("national_actuals",[])[:20]):
   out=record(("national_actuals",str(i)),"PLN Statistics 2024 · "+str(x.get("label")),u,date,
    x.get("value"),x.get("unit"),"Observed 2024: "+str(x.get("table"))+" p."+str(x.get("page")),"PLN",
    "Historical observed installed assets, NOT RUPTL 2025–2034 planned additions.")
   if out:yield out
  for i,x in enumerate(d.get("distribution_transformers",[])[:20]):
   out=record(("distribution_transformers",str(i)),"PLN distribution transformers · "+str(x.get("province")),u,date,
    x.get("installed_mva"),"MVA","2024 reporting unit "+str(x.get("unit"))+", PDF p."+str(x.get("pdf_page")),"PLN",
    "Distribution transformers, not transmission substation firm spare headroom.")
   if out:yield out
 if name=="pln-saidi-saifi-2023-2025.json":
  sources=d.get("sources",{})
  for i,x in enumerate(d.get("records",[])[:40]):
   values=x.get("values") or {}
   scope=x.get("scope")
   for year in ("2025",): # prefer latest source and avoid 2023/2024 as fake current-year figures
    m=values.get(year,{})
    for indicator in ("saidi","saifi"):
     if indicator not in m:continue
     out=record(("records",str(i),year,indicator),
       "PLN "+str(x.get("unit"))+" "+indicator.upper()+" "+year,
       sources.get(year),year,m[indicator],
       "hours/customer/year" if indicator=="saidi" else "interruptions/customer/year",
       "PLN service unit; scope "+str(scope)+"; covered provinces "+", ".join(x.get("provinces") or [])+".","PLN",
       "Shared multi-province service unit metrics MUST NOT be represented as separately measured province-level values.")
     if out:yield out
 if name=="sli-bps-gini-2026.json":
  sources=d.get("sources",[]);source=next((x for x in sources if "province" in str(x.get("title","")).lower()),sources[0] if sources else {})
  for i,x in enumerate(d.get("provinces",[])[:38]):
   out=record(("provinces",str(i)),"Gini pengeluaran "+str(x.get("name"))+" · Maret 2026",
    source.get("url"),d.get("published_at"),x.get("combined"),"index 0–1",
    "BPS Susenas, 2026-03; urban "+str(x.get("urban"))+", rural "+str(x.get("rural"))+".","BPS",
    "Expenditure Gini, NOT wealth Gini; provincial values cannot be arithmetically averaged.")
   if out:yield out
 if name=="sli-bps-regional-intelligence.json":
  sources=d.get("sources") or {};s=sources.get("pdrb") or {}
  years=d.get("grdp_years") or []
  for i,x in enumerate(d.get("provinces",[])[:38]):
   vals=x.get("grdp_current") or []
   if len(vals)!=len(years) or not years:continue
   out=record(("provinces",str(i),"grdp_current"),"PDRB harga berlaku "+str(x.get("name"))+" · "+str(years[-1]),
    s.get("url"),s.get("released"),vals[-1],"IDR billion",
    "BPS provincial GRDP by expenditure; year "+str(years[-1])+".","BPS",
    "Nominal PDRB level is NOT growth, government investment realization or private capex.")
   if out:yield out
 if name=="sli-macro-indonesia-2026.json":
  sources=d.get("sources") or {}
  for i,x in enumerate(d.get("metrics",[])[:70]):
   if x.get("value") is None:continue
   s=sources.get(x.get("source_id"),{})
   out=record(("metrics",str(i)),"Indonesia macro · "+str(x.get("label")),s.get("url"),
    s.get("released"),x.get("value"),x.get("unit"),
    "Observation "+str(x.get("period"))+"; "+str(x.get("caveat") or "")[:140],s.get("publisher") or "Official publisher",
    "Metric is published-snapshot observation, not automatically live and not annualized.")
   if out:yield out
 if name=="ai-grid-official-crosswalk.json":
  n=d.get("national",{})
  for field,unit in (("planned_new_capacity_gw","GW"),("planned_renewables_storage_gw","GW"),("planned_transmission_circuit_km","circuit-km")):
   source=n.get("numeric_source") or n.get("source")
   out=record(("national",field),"Indonesia RUPTL 2025–2034 · "+field,source,d.get("updated_at"),n.get(field),unit,
    "RUPTL 2025–2034 planned nationwide additions","ESDM / PLN","Planned additions not operational built capacity.")
   if out:yield out
  for i,x in enumerate(d.get("system_peaks",[])[:20]):
   out=record(("system_peaks",str(i)),"PLN system peak · "+str(x.get("system")),x.get("source"),
    str(x.get("observed_year") or ""),x.get("peak_mw"),"MW",
    "Peak demand observation year "+str(x.get("observed_year")),"PLN",
    "Peak load is not grid headroom or commissioned AI data center load.")
   if out:yield out
 if name=="commodity-trade-flows.json":
  x=d.get("latest_bps") or {};u=x.get("source_url");p=x.get("released")
  for k in ("exports_total_musd","imports_total_musd","exports_oil_gas_musd","imports_oil_gas_musd","exports_non_oil_gas_musd","imports_non_oil_gas_musd"):
   out=record(("latest_bps",k),"BPS trade "+k,u,p,x.get(k),"USD million",
    "Reported period "+str(x.get("period")),"BPS","Accumulative selected period, not full-year annual total.")
   if out:yield out
 if name=="iea-2026-workbook-dashboard.json":
  # Source-linked summary record only; do not pretend mixed arrays are same-country/current figures.
  out=record(("coverage",),"IEA Critical Minerals Dataset 2026 · source and scenario scope",
   d.get("source"),d.get("edition"),d.get("edition"),"dataset vintage",
   str(d.get("caveat") or "")[:180],"IEA",
   "IEA dataset uses scenarios; do not label model estimates measured 2026 Indonesia mine production.")
  if out:yield out
