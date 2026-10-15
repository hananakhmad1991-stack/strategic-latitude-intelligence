#!/usr/bin/env python3
"""Energy actor source monitor. Only auto-update a named cabinet member when two official sources agree."""
from __future__ import annotations
import datetime as dt
import html
import json
import re
import unicodedata
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

DATA=Path("data/energy-governance-ccs.json")
OUT=Path("data/energy-actors-status.json")
CABINET="https://setkab.go.id/profil-kabinet/"
SPECS=[
 {"key":"Kementerian Lingkungan Hidup","cabinet":"Menteri Lingkungan Hidup/Kepala Badan Pengendalian Lingkungan Hidup","agency":"https://www.kemenlh.go.id/contents/8/Profil-Menteri","prefix":"Minister of Environment / Head of BPLH"},
 {"key":"Kementerian Keuangan","cabinet":"Menteri Keuangan","agency":"https://www.kemenkeu.go.id/en/profile/profile-pejabat/menteri-keuangan","prefix":"Minister of Finance"},
 {"key":"Kementerian ESDM / Minister","cabinet":"Menteri Energi dan Sumber Daya Mineral","agency":"https://www.esdm.go.id/id/profil/profil-pimpinan","prefix":"Minister of ESDM; energy-sector regulator"},
 {"key":"Bappenas","cabinet":"Menteri Perencanaan Pembangunan Nasional/Kepala Badan Perencanaan Pembangunan Nasional","agency":"https://www.bappenas.go.id","prefix":"Minister / Head of Bappenas"},
 {"key":"Kementerian Investasi dan Hilirisasi / BKPM","cabinet":"Menteri Investasi dan Hilirisasi/Kepala Badan Koordinasi Penanaman Modal","agency":"https://www.bkpm.go.id","prefix":"Minister of Investment / Head of BKPM"},
]
OTHER_SOURCES=[
 {"actor":"SKK Migas","url":"https://www.skkmigas.go.id/"},
 {"actor":"BPH Migas","url":"https://www.bphmigas.go.id/komite/"},
 {"actor":"BPMA — Aceh","url":"https://www.bpma.go.id/"},
 {"actor":"PLN Group and private IPPs","url":"https://web.pln.co.id/"},
 {"actor":"Kemenko Hilirisasi dan Transisi Energi","url":"https://www.esdm.go.id/id/profil/profil-pimpinan"},
]
AGENT="SLI-Public-Institutional-Verification/1.0"
NOW=dt.datetime.now(dt.timezone.utc)
def norm(s):
    s=unicodedata.normalize("NFKD",s.lower())
    s=s.replace("moh.","mohammad").replace("moh ","mohammad ").replace("mohammad","mohammad")
    return re.sub(r"[^a-z0-9]+"," ",s).strip()
def text_name_valid(name):
    words=name.split()
    return 2<=len(words)<=6 and all(len(w)>1 for w in words) and len(name)<80 and not any(w.isdigit() for w in words)
def fetch(url):
    req=urllib.request.Request(url,headers={"User-Agent":AGENT,"Accept":"text/html"})
    with urllib.request.urlopen(req,timeout=20) as r:
        if r.status!=200:raise RuntimeError("Unexpected status "+str(r.status))
        if r.geturl().split("/")[2] not in (url.split("/")[2],url.split("/")[2].removeprefix("www."),"www."+url.split("/")[2]):
            raise RuntimeError("Unexpected cross-domain redirect")
        return r.read(1800000).decode("utf-8","replace")
class Table(HTMLParser):
    def __init__(self):
        super().__init__();self.rows=[];self.row=None;self.cell=None
    def handle_starttag(self,tag,attrs):
        if tag=="tr":self.row=[]
        if tag in ("td","th") and self.row is not None:self.cell=[]
    def handle_data(self,data):
        if self.cell is not None:self.cell.append(data)
    def handle_endtag(self,tag):
        if tag in ("td","th") and self.cell is not None and self.row is not None:
            self.row.append(" ".join(" ".join(self.cell).split()));self.cell=None
        if tag=="tr" and self.row is not None:
            if self.row:self.rows.append(self.row)
            self.row=None
class Plain(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,data):self.parts.append(data)
def extract_rows(markup):
    p=Table();p.feed(markup);return p.rows
def flatten(markup):
    p=Plain();p.feed(markup);return " ".join(" ".join(p.parts).split())
def cabinet_candidate(rows,role):
    found=[];carry=False
    target=norm(role)
    for cells in rows:
        hit=next((i for i,x in enumerate(cells) if target in norm(x)),None)
        if hit is not None:carry=True;start=hit+1
        elif carry and (not cells or len(cells)<2 or "menteri" in norm(" ".join(cells[:2]))):
            carry=False;continue
        elif carry and len(cells)>=3 and re.match(r"^\d{1,2}$",cells[0].strip()):
            carry=False;continue
        elif carry:start=0
        else:continue
        candidates=[x for x in cells[start:] if text_name_valid(x) and "menteri" not in norm(x)
                    and not re.search(r"^(keputusan|peraturan|foto|image|profil)",norm(x))]
        if not candidates:continue
        name=candidates[0]
        # Store active candidate; some government tables append historical officeholders.
        found.append(name)
    return found[-1] if found else None
def agree_agency(name,text):
    n=norm(name)
    body=norm(text)
    if n in body:return True
    # Official department pages sometimes abbreviate "Mohammad" as "Moh".
    if n.startswith("mohammad "):
        return n.replace("mohammad ","moh ",1) in body
    return False

def person_before_role(markup, official_role):
    p=Plain();p.feed(markup)
    parts=[" ".join(t.split()) for t in p.parts if t.strip()]
    goal=norm(official_role)
    for i,part in enumerate(parts):
        if norm(part)!=goal:continue
        for before in reversed(parts[max(0,i-5):i]):
            if text_name_valid(before) and before.upper()==before and not re.search(r"PROFIL|LHKPN|DIREKTORAT|MENTERI",before):
                return before.title()
    return None

def main():
    d=json.loads(DATA.read_text(encoding="utf-8"))
    actors={x["name"]:x for l in d["governance"]["layers"] for x in l["actors"]}
    scans=[];changes=[];needs=[];errors=[]
    try:
        cab=fetch(CABINET)
        rows=extract_rows(cab)
        if len(rows)<30:raise RuntimeError("Cabinet table too small; no updates")
    except Exception as ex:
        rows=[];errors.append({"source":"Cabinet roster","error":type(ex).__name__+": "+str(ex)[:180]})
    for spec in SPECS:
        row={"actor":spec["key"],"primary_source":CABINET,"corroboration_source":spec["agency"]}
        current=actors.get(spec["key"])
        candidate=cabinet_candidate(rows,spec["cabinet"]) if rows else None
        row["candidate"]=candidate
        try:
            agency_text=flatten(fetch(spec["agency"]))
            corroborated=bool(candidate and agree_agency(candidate,agency_text))
        except Exception as ex:
            corroborated=False;row["error"]=type(ex).__name__+": "+str(ex)[:140]
            errors.append({"source":spec["agency"],"error":row["error"]})
        row["corroborated"]=corroborated
        if current and candidate and corroborated and text_name_valid(candidate):
            was=(current.get("person_name") or current.get("lead","").split(" · ",1)[0]).strip()
            # On name differences require dual official sources, both true here.
            if norm(was)!=norm(candidate):
                current.update(person_name=candidate,
                    lead=candidate+" · "+spec["prefix"]+" (dual official confirmation)",
                    source=spec["agency"],verified=NOW.date().isoformat(),
                    verification_status="Auto-verified against cabinet roster AND ministerial leadership page")
                changes.append({"actor":spec["key"],"old":was,"new":candidate,
                                "status":"auto-updated","sources":[CABINET,spec["agency"]]})
                row["status"]="auto-updated"
            else:row["status"]="confirmed-current"
        else:
            row["status"]="requires-review" if candidate and current and not corroborated else "source-unavailable"
            if candidate and current and norm(candidate)!=norm(current.get("person_name") or current["lead"].split(" · ",1)[0]) and not corroborated:
                needs.append({"actor":spec["key"],"candidate":candidate,"previous":current["lead"],
                              "reason":"Cabinet candidate not corroborated by ministerial page",
                              "sources":[CABINET,spec["agency"]]})
        scans.append(row)
    # Check current primary institutional sites: a successful download is not proof of an appointment.
    for src in OTHER_SOURCES:
        row={"actor":src["actor"],"primary_source":src["url"],"status":"source-unavailable"}
        try:
            markup=fetch(src["url"])
            row["status"]="source-available-review-needed"
            row["bytes_read"]=len(markup)
        except Exception as ex:
            row["error"]=type(ex).__name__+": "+str(ex)[:140]
            errors.append({"source":src["url"],"error":row["error"]})
        scans.append(row)
    # The ESDM leadership profile explicitly pairs each current appointee with an official role.
    try:
        esdm_url="https://www.esdm.go.id/id/profil/profil-pimpinan"
        profile=fetch(esdm_url)
        for key,position,descriptor in [
            ("Ditjen Migas — ESDM","DIRJEN MIGAS","Director General of Oil and Gas"),
            ("Ditjen EBTKE — ESDM","DIRJEN EBTKE","Director General of EBTKE"),
            ("Ditjen Ketenagalistrikan — ESDM","PLT. DIRJEN KETENAGALISTRIKAN","Acting Director General of Electricity"),
        ]:
            found=person_before_role(profile,position)
            row={"actor":key,"primary_source":esdm_url,"candidate":found,
                 "verification":"Direct official ESDM role-linked current leadership profile"}
            current=actors.get(key)
            if current and found and text_name_valid(found):
                old=current.get("person_name") or current.get("lead","").split(" · ",1)[0]
                if norm(old)!=norm(found):
                    current.update(person_name=found,lead=found+" · "+descriptor+" (official ESDM role profile)",
                        source=esdm_url,verified=NOW.date().isoformat(),
                        verification_status="Auto-verified official ESDM role-linked leadership profile")
                    changes.append({"actor":key,"old":old,"new":found,"status":"auto-updated","sources":[esdm_url]})
                    row["status"]="auto-updated"
                else:row["status"]="confirmed-current"
            else:row["status"]="profile-role-unreadable"
            scans.append(row)
    except Exception as ex:
        errors.append({"source":"Official ESDM leadership profile","error":type(ex).__name__+": "+str(ex)[:160]})

    if changes:
        DATA.write_text(json.dumps(d,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    output={"checked_at_utc":NOW.isoformat(),"verification_method":"Dual official cabinet + ministry-site name agreement for auto-updating ministers; other offices are monitored as source status and require role-specific corroboration.",
            "current_actor_count":len(actors),"official_sources_checked":len(scans),
            "verified_auto_changes":changes,"requires_review":needs,"checks":scans,"errors":errors,
            "disclaimer":"No change is not evidence that no appointments happened. An unreachable, ambiguous or stale government source must not overwrite the last verified officeholder. No minister names are inferred from news headlines."}
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Official actor scan:",len(scans),"auto changes:",len(changes),"review:",len(needs),"errors:",len(errors))
if __name__=="__main__":main()
