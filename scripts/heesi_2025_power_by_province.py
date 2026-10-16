#!/usr/bin/env python3
"""Extract all 17 2025 provincial power plant categories from ESDM HEESI pp118–119.

Uses exact PDF text-column positions to reconstruct the paired wide table on
PDF pages 134 and 135, validates all 38 province codes, row sums, and published
17 national category totals. Never guesses facility GPS or fuel mixture.
Requires PyMuPDF. Accepts the official, 172-page PyMuPDF document object.
"""
import json
import re

NAMES = {
"11":"Aceh","12":"Sumatera Utara","13":"Sumatera Barat","14":"Riau","15":"Jambi",
"16":"Sumatera Selatan","17":"Bengkulu","18":"Lampung","19":"Kepulauan Bangka Belitung",
"21":"Kepulauan Riau","31":"DKI Jakarta","32":"Jawa Barat","33":"Jawa Tengah",
"34":"Daerah Istimewa Yogyakarta","35":"Jawa Timur","36":"Banten","51":"Bali",
"52":"Nusa Tenggara Barat","53":"Nusa Tenggara Timur","61":"Kalimantan Barat",
"62":"Kalimantan Tengah","63":"Kalimantan Selatan","64":"Kalimantan Timur",
"65":"Kalimantan Utara","71":"Sulawesi Utara","72":"Sulawesi Tengah",
"73":"Sulawesi Selatan","74":"Sulawesi Tenggara","75":"Gorontalo",
"76":"Sulawesi Barat","81":"Maluku","82":"Maluku Utara","91":"Papua",
"92":"Papua Barat","93":"Papua Selatan","94":"Papua Tengah",
"95":"Papua Pegunungan","96":"Papua Barat Daya",
}
FIRST = [
("hydro_pp","Hydro power plant",181.4,6372.41),
("mini_hydro_pp","Mini-hydro power plant",212.6,940.46),
("micro_hydro_pp","Micro-hydro power plant",243.8,281.52),
("geothermal_pp","Geothermal power plant",277.8,2757.38),
("solar_pp","Solar photovoltaic power plant",309.0,1534.11),
("wind_pp","Wind power plant",340.1,151.91),
("biogas_pp","Biogas power plant",371.3,181.78),
("biomass_pp","Biomass power plant",402.5,3432.46),
]
SECOND = [
("biofuel_pp","Biofuel power plant",67.9,5.00),
("waste_pp","Waste-to-energy power plant",101.9,35.67),
("diesel_pp","Diesel power plant",135.9,6146.07),
("steam_pp","Steam power plant / PLTU",169.9,60542.14),
("gas_pp","Gas power plant",204.0,4582.71),
("coal_gasification_pp","Coal gasification power plant",238.0,450.00),
("gas_steam_pp","Combined-cycle gas-steam power plant",272.0,17433.56),
("gas_engine_pp","Gas engine power plant",306.0,2633.70),
("other_pp","Other generation",334.4,18.00),
("total_power","All installed generation",374.0,107498.89),
]


def extract(doc):
    assert len(doc)==172,"Unexpected official handbook page count"
    first=doc[133].get_text("words",sort=True)
    second=doc[134].get_text("words",sort=True)
    labels=[(round(w[1],1),w[4]) for w in first if 52<=w[0]<=55 and
            130<w[1]<515 and re.fullmatch(r"[0-9]{2}",w[4])]
    assert len(labels)==38 and {c for _,c in labels}==set(NAMES),"Province code list mismatch"
    records=[]
    for yy,code in labels:
        row={"province":NAMES[code],"code":code}
        for words,cols in [(first,FIRST),(second,SECOND)]:
            for key,title,ending,official_total in cols:
                matches=[w[4] for w in words if abs(w[1]-yy)<1.9 and abs(w[2]-ending)<.35]
                assert len(matches)==1,(code,key,matches)
                original=matches[0]
                assert original=="-" or re.fullmatch(r"[0-9,.]+",original),(code,key,original)
                row[key]=0 if original=="-" else float(original.replace(",",""))
        partial=sum(row[k] for k,*_ in FIRST+SECOND if k!="total_power")
        assert abs(partial-row["total_power"])<=.04,(row["province"],partial,row["total_power"])
        records.append(row)
    assert len(records)==38
    layers=[]
    for key,title,_,reported in FIRST+SECOND:
        total=sum(r[key] for r in records)
        assert abs(total-reported)<=.03,(title,total,reported)
        layers.append({
            "id":key,"name":title,"unit":"MW",
            "source_pdf_page":134 if any(x[0]==key for x in FIRST) else 135,
            "reported_total":reported,"sum_of_province_rows":round(total,2),
            "notes":"Official 2025 installed capacity by province. A PDF dash means no capacity listed, represented as zero in this categorical table. Source reporting changed to ownership-based classification in 2025.",
            "values":[{"province":r["province"],"value":r[key]} for r in records],
        })
    return {
        "id":"HEESI-2025-POWER-TECH-BY-PROVINCE",
        "source":"https://www.esdm.go.id/assets/media/content/content-handbook-of-energy-and-economic-statistics-of-indonesia-2025.pdf",
        "publication":"2026-07","observation_year":2025,
        "printed_pages":[118,119],"pdf_pages":[134,135],
        "scope_note":"38-province, 17 named power-plant categories and an independent total. Includes PLN and other ownership categories. Nameplate capacity, NOT generation (GWh), plant count, access, operational fuel burn or utilisation.",
        "validation":"All 38 province totals and all 18 category totals reconcile to ESDM printed table within 0.03 MW due rounding. Categories may have overlapping commercial definitions only where stated by ESDM; this dataset reproduces original mutually exclusive headers.",
        "province_count":38,"technology_count":17,
        "layers":layers,"province_rows":records,
    }


def write(doc,path):
    from pathlib import Path
    result=extract(doc)
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    Path(path).write_text(json.dumps(result,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print("HEESI 2025 provincial technologies: 38 provinces × 17 technologies, 107498.89 MW nationally")
    return result
