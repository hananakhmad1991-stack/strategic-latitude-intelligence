#!/usr/bin/env python3
"""SLI all-dashboard centralized appendix, acronym deduplication, and provenance QA."""
import json,re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
d=json.loads((ROOT/"data/sli-unified-glossary.json").read_text(encoding="utf-8"))
energy=json.loads((ROOT/"data/energy-appendix.json").read_text(encoding="utf-8"))
mapref=json.loads((ROOT/"data/strategic-map-glossary.json").read_text(encoding="utf-8"))
assert len(d["items"])>=250,(len(d["items"]),"glossary unexpectedly short")
def key(s):return re.sub(r"\s+"," ",str(s).replace("\u2010","-").replace("\u2011","-").replace("\u2013","-").replace("\u2014","-").strip().casefold())
keys=[key(x["term"]) for x in d["items"]]
assert len(keys)==len(set(keys)),"duplicate canonical term names"
slugs=[x["slug"] for x in d["items"]]
assert len(slugs)==len(set(slugs)) and all(re.fullmatch(r"[a-z0-9-]+",x) for x in slugs)
domains=set(d["domain_labels"])
categories=set(d["category_labels"])
assert {"macro","ai","energy","electricity","oilgas","minerals","policy","investment","maps","data","trade"}.issubset(domains)
for x in d["items"]:
 assert x["term"] and x["en"] and x["id"],("Untranslated or undefined",x.get("term"))
 assert x["category"] in categories and x["domains"] and set(x["domains"]).issubset(domains),(x["term"],"domain invalid")
 assert x["origin"] and x["source_path"],x["term"]
 if x["origin"].startswith("Original"):
  assert x["source_path"] in {"data/energy-appendix.json","data/strategic-map-glossary.json"}
energykeys={key(x["term"]) for x in energy["items"]}
mapkeys={key(x["term"]) for group in mapref["sections"] for x in group["items"]}
dictkeys=set(keys)
assert energykeys.issubset(dictkeys),"Missing energy terms"
assert mapkeys.issubset(dictkeys),"Missing map terms"
assert len(energykeys&mapkeys)>=10 and d["merge"]["cross_source_duplicate_terms_deduplicated"]>=10
assert sum(x["category"]=="units" for x in d["items"])>=20
assert "data/sli-unified-glossary.json" in d["original_source_paths"] or len(d["original_source_paths"])==2
# Every HTML entrypoint includes the same shared appendix, with one canonical source.
pages=sorted(ROOT.glob("*.html"))
assert len(pages)>=24,len(pages)
for page in pages:
 txt=page.read_text(encoding="utf-8")
 assert txt.count("js/sli-shared-appendix.js")==1,(page.name,"shared appendix absent or repeated")
 assert "sli-glossary-methodology.html" in txt or page.name=="sli-glossary-methodology.html",(page.name,"missing reference link")
assert "Appendix · Terms &amp; Units" in (ROOT/"index.html").read_text(encoding="utf-8")
js=(ROOT/"js/sli-shared-appendix.js").read_text(encoding="utf-8")
assert "data/sli-unified-glossary.json" in js and "sli:pagechange" in js
assert "sliGlossaryMain" in js and "sliSharedAppendixBar" in js
assert "term-" in js and "URLSearchParams" in js
assert "getData().then(drawFull)" in js
assert "(x.note_en||x.note_id)?'<small>'" in js,"glossary source note conditional missing"
# Legacy energy and map are no longer parallel full dictionaries; their technical caveats remain.
energy_js=(ROOT/"js/energy-appendix.js").read_text(encoding="utf-8")
assert "sli-glossary-methodology.html" in energy_js
assert "data/energy-appendix.json" in energy_js
assert "data/energy-appendix.json" not in js,"Common glossary must not render old appendix on every page"
map_js=(ROOT/"js/strategic-map.js").read_text(encoding="utf-8")
assert "sli-glossary-methodology.html?domain=maps" in map_js
assert "source_layers" in map_js and "registryCounts" in map_js and "GeoNames" in map_js
assert 'for(const group of guide.sections)' not in map_js,"Duplicate map glossary still rendered"
main=(ROOT/"sli-glossary-methodology.html").read_text(encoding="utf-8")
for phrase in ("MW vs MVA","Pasal 7","Not verified / unavailable","Observation","Project announced","IT MW","Data provenance","Data-quality labels","Original references"):
 assert phrase.lower() in main.lower(),phrase
print("PASS shared appendix coverage:",len(pages),"pages;",len(d["items"]),
      "canonical bilingual terms;",len(energykeys&mapkeys),"legacy cross-source overlaps deduplicated")
