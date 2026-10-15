#!/usr/bin/env python3
"""Check SLI institutional tree, sources, actor references and ownership semantics."""
import json,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
obj=json.loads((root/"data/sector-command-hierarchy.json").read_text())
errors=[]
for sector,group in obj["sectors"].items():
    nodes=group["nodes"]
    by_id={x["id"]:x for x in nodes}
    if len(by_id)!=len(nodes):errors.append(sector+": duplicate node IDs")
    roots=[x for x in nodes if x.get("relation")=="root"]
    if len(roots)!=1:errors.append(sector+": must have exactly one presidency root")
    for x in nodes+group["market"]:
        if not str(x.get("source","")).startswith("https://"):errors.append(sector+": missing original source "+x["id"])
        if not x.get("role"):errors.append(sector+": missing specific role "+x["id"])
        if x.get("relation")=="market" and x.get("parent") is not None:errors.append(sector+": private operator wrongly drawn as state subordinate "+x["id"])
    for x in nodes:
        par=x.get("parent")
        if par is not None and par not in by_id:errors.append(sector+": missing parent "+x["id"])
        seen=set()
        current=x
        while current.get("parent"):
            if current["id"] in seen:
                errors.append(sector+": cyclical chain at "+x["id"]);break
            seen.add(current["id"])
            current=by_id.get(current["parent"],{})
    if sector=="minerals":
        for id in ["bpi","dam","mind","antam","ptba","inalum","timah","freeport","vale","dsi","brin","defense"]:
            if id not in by_id:errors.append(sector+": critical required actor missing "+id)
        if by_id["dsi"]["parent"]!="bpi" or by_id["mind"]["parent"]!="dam":errors.append("DSI / MIND ID must be separate Danantara branches")
        if by_id["dgminerba"]["parent"]!="minister":errors.append("Ditjen Minerba must report below ESDM Minister")
        if by_id["vale"].get("relation")!="minority":errors.append("Vale stake must not be misrepresented as wholly owned")
    if sector=="ai":
        if by_id["dgE"]["parent"]!="komdigi" or by_id["dirAI"]["parent"]!="dgE" or by_id["dgI"]["parent"]!="komdigi":errors.append("AI directors/Dirjen reporting levels are wrong")
        if by_id["neutra"]["parent"]!="telkom":errors.append("NeutraDC Telkom group relationship is incorrect")
if errors:
    print("\n".join(errors),file=sys.stderr)
    sys.exit(1)
print("Verified institutional ID references, nested minister/dirjen, separated Danantara portfolio and independent operators")
