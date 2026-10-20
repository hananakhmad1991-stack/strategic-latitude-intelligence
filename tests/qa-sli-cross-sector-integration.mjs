import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const json=p=>JSON.parse(read(p));

test("Food and mineral monitoring share the same attributed archive and live-sector taxonomy",()=>{
 const radar=json("data/research-signal-radar.json"),archive=json("data/sli-secondary-news-index.json");
 const js=read("js/research-signal-radar.js"),hub=read("js/sli-sector-monitor.js"),collector=read("scripts/research_signal_radar.py");
 assert.ok(["ok","partial","awaiting_first_scan","upstream_unavailable_last_good_preserved"].includes(radar.status));
 for(const sector of ["food","minerals","ai"]){
  assert.ok(radar.groups[sector]&&Array.isArray(radar.groups[sector].geopolitical)&&Array.isArray(radar.groups[sector].domestic));
  assert.ok(Object.prototype.hasOwnProperty.call(radar.counts,sector));
 }
 assert.match(collector,/\("food", "domestic", "rice_reserves"/);
 assert.match(collector,/\("food", "geopolitical", "global_grains"/);
 assert.match(js,/food:\{en:"Food & Agriculture"/);
 assert.match(hub,/sli-secondary-news-index\.json/);
 assert.match(hub,/sourceType|evidence_level/);
 assert.match(hub,/new URLSearchParams\(location\.search\)/);
 assert.ok(archive.source_snapshots.includes("research-signal-radar"));
 assert.ok(archive.articles.every(row=>["publisher_attributed_news_report","official_metadata_change_candidate"].includes(row.evidence_level)));
});

test("Institutional identity, food policy, geopolitics, and Research AI have live cross-sector source references",()=>{
 const page=read("food-agriculture-intelligence.html"),news=read("sli-sector-news.html");
 const tree=read("js/food-governance-tree.js"),network=read("js/food-governance-hierarchy.js");
 const identity=read("js/sli-entity-identity.js"),research=read("research-api/src/dashboard-corpus.mjs");
 const adapter=read("scripts/sli_research_source_adapters.py"),assistant=read("js/sli-research-assistant.js");
 const chapter=json("data/sli-geopolitical-chapter.json"),policy=json("data/sli-policy-regulatory-graph-2026.json");
 const coverage=json("data/sli-research-unified-index.json").coverage.datasets;
 for(const id of ['id="fa-hierarchy"','id="fa-network"','id="fa-monitoring"'])assert.ok(page.includes(id),id);
 assert.ok(page.includes('initSLIResearchRadar("food",target)'));
 assert.ok(news.includes('id="sliNewsSector"')&&news.includes('id="sliNewsScope"'));
 for(const url of ["sli-sector-news.html?sector=food","sli-sector-news.html?sector=minerals","sli-research-ai.html"])assert.ok(network.includes(url),url);
 assert.match(tree,/SLIEntityIdentity\.brand/);
 assert.match(network,/SLIEntityIdentity\.brand/);
 assert.match(identity,/badanpangan\.go\.id/);
 assert.match(identity,/pupuk-indonesia\.com/);
 assert.match(identity,/sli-entity-favicon/);
 assert.match(research,/target==="food"/);
 assert.match(research,/food-agriculture|pangan/);
 assert.match(adapter,/name=="food-agriculture-2026\.json"/);
 assert.match(adapter,/name=="food-governance-hierarchy\.json"/);
 assert.match(assistant,/new URLSearchParams\(location\.search\)\.get\("prompt"\)/);
 assert.ok(chapter.themes.find(t=>t.id==="foodsecurity"&&t.links.some(l=>l.url.includes("food-agriculture-intelligence"))));
 assert.ok(policy.nodes.some(n=>n.sector==="food"&&n.ref.includes("UU 18/2012")));
 assert.ok(coverage.some(d=>d.dataset==="food-agriculture-2026.json"&&d.indexed>0));
 assert.ok(coverage.some(d=>d.dataset==="food-governance-hierarchy.json"&&d.indexed>0));
});

test("All new sector routes load the standard shared shell and do not rewrite historical source periods",()=>{
 const page=read("sli-sector-news.html"),food=read("data/food-agriculture-2026.json");
 for(const path of ["js/sli-navigation.js","css/sli-navigation.css","js/sli-shared-appendix.js","js/sli-live-data.js","js/sli-sector-monitor.js"])assert.ok(page.includes(path));
 assert.match(page,/sli-chrome-pending/);
 const data=JSON.parse(food);
 assert.equal(data.publication.trade_data_until,"2026-04");
 assert.equal(data.publication.price_ntp_data_until,"2026-05");
 assert.ok(read("js/sli-sector-monitor.js").includes("claim")||read("js/sli-sector-monitor.js").includes("independently validated"));
});
