import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {checkMarineIntegration} from "../js/sli-marine-crosssector.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));
const hub=json("data/sli-marine-crosssector.json");
const kkp=json("data/sli-marine-fisheries-kkp.json");

test("One source-qualified marine registry connects source, policies, issuers, institutions and geopolitical caveats",()=>{
 const qa=checkMarineIntegration(hub);assert.equal(qa.pass,true,qa.errors.join(","));
 assert.equal(hub.regulations.length,7);
 assert.ok(hub.regulations.every(x=>x.status!=="verified_article_text"));
 assert.ok(hub.agencies.every(x=>x.source_url.startsWith("https://")));
 for(const route of ["news","policy","entities","stocks","research","dashboard","geo"])assert.ok(hub.links.find(l=>l.id===route),route);
 assert.ok(hub.assumptions.some(x=>x.includes("not official IDX classification")));
 assert.match(read("marine-fisheries-intelligence.html"),/mfConnectedIntelligence/);
 assert.match(read("marine-fisheries-intelligence.html"),/sli-marine-crosssector\.mjs/);
});
test("IDX thematic fisheries ticker watchlist derives exact issuer dossier and no fabricated prices",()=>{
 const db=json("data/sli-idx-issuer-universe.json");
 const x=hub.issuer_candidates.map(x=>x.ticker);
 assert.deepEqual(x,["CPRO","DSFI","IKAN","PCAR"]);
 assert.equal(db.records.filter(row=>row.sector==="marine"||row.theme_marine===true).length,4);
 for(const ticker of x){
  const row=db.records.find(x=>x.ticker===ticker);
  assert.ok(row&&(row.sector==="marine"||row.theme_marine===true)&&row.exchange==="IDX",ticker);
  assert.equal(row.verification,"idx_seed_awaiting_official_refresh");
  for(const name of ["market_cap","revenue","net_income","total_assets"])assert.equal(row[name],null);
  assert.ok(/^https:\/\//.test(row.marine_evidence_url));
 }
 assert.match(read("js/sli-idx-tradingview.js"),/marine:\["CPRO","DSFI","IKAN","PCAR"\]/);
 assert.match(read("js/sli-idx-sector-watchlist.js"),/watchlist/);
 assert.match(read("index.html"),/marine-fisheries-intelligence\.html/);
 assert.match(read("index.html"),/sliMarineHomeSnapshot/);
 assert.match(read("js/sli-home-portal.js"),/sli-marine-fisheries-kkp\.json/);
});
test("Marine news radar is segregated into domestic and geopolitical lanes, with truthful empty status",()=>{
 const feed=json("data/research-signal-radar.json");
 const py=read("scripts/research_signal_radar.py");
 const monitor=read("js/sli-sector-monitor.js");
 assert.ok(Array.isArray(feed.groups.marine.domestic));
 assert.ok(Array.isArray(feed.groups.marine.geopolitical));
 assert.deepEqual(feed.counts.marine,{geopolitical:0,domestic:0});
 assert.equal((py.match(/\("marine", "(?:domestic|geopolitical)"/g)||[]).length,8); // includes two GROUP definitions
 assert.match(py,/seafood_trade/);
 assert.match(py,/marine_policy/);
 assert.match(read("sli-sector-news.html"),/value="marine"/);
 assert.match(monitor,/marine:\{id:"Kelautan & Perikanan"/);
 assert.match(monitor,/val==="marine"/);
});
test("Marine legislation stays index-metadata-only and original legal amendments are explicit",()=>{
 const g=json("data/sli-policy-regulatory-graph-2026.json");
 const laws=g.nodes.filter(x=>x.sector==="marine");
 assert.equal(laws.length,7);
 assert.ok(laws.every(x=>/metadata/.test(x.evidence)&&x.verification_scope.includes("no provision text verified")));
 assert.ok(g.edges.some(e=>e.from==="kkp_uu_45_2009"&&e.to==="kkp_uu_31_2004"&&e.type==="amends"));
 assert.ok(g.edges.some(e=>e.from==="kkp_uu_1_2014"&&e.to==="kkp_uu_27_2007"&&e.type==="amends"));
 assert.match(read("js/sli-regulatory-explorer.js"),/marine:n=>n.sector==="marine"/);
 assert.match(read("policy-regulatory-intelligence.html"),/sector=marine/);
});
test("KKP institutions join canonical Entities and Natuna/chokepoint analysis has marine evidence link",()=>{
 const script=read("js/sli-entities.js");
 assert.match(script,/function fromMarineRegistry\(db\)/);
 assert.match(script,/sector:'marine'/);
 assert.match(script,/fromMarineRegistry\(await response\.json\(\)\)/);
 assert.match(script,/params\.get\('sector'\)==='marine'/);
 const geo=json("data/sli-geopolitical-chapter.json");
 const natuna=geo.themes.find(x=>x.id==="natuna");
 const maritime=geo.themes.find(x=>x.id==="maritime");
 assert.ok(natuna.links.some(x=>x.url==="./marine-fisheries-intelligence.html"));
 assert.ok(maritime.links.some(x=>x.url==="./marine-fisheries-intelligence.html"));
 assert.ok(hub.geopolitical_channels.every(x=>x.guard.length>20));
});
test("DERGUBA receives observed KKP rows but not legal metadata disguised as article text",()=>{
 const index=json("data/sli-research-unified-index.json");
 const marine=index.records.filter(x=>x.dataset==="sli-marine-fisheries-kkp.json");
 assert.equal(marine.length,28);
 assert.ok(marine.every(x=>x.source_type==="public_dashboard_source_record_not_claim_verified"));
 assert.ok(!marine.some(x=>/2025/.test(x.title)));
 assert.ok(!index.records.some(x=>x.dataset==="sli-marine-crosssector.json"),"Unreviewed legal crosslinks must not be treated as article text");
 assert.equal(kkp.records.length,18);
 assert.match(read("js/sli-marine-crosssector.mjs"),/sli-research-ai\.html\?prompt=/);
});
