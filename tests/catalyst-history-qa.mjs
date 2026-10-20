/* SLI server-side Catalyst ledger regression tests. No network dependencies. */
import assert from "node:assert/strict";
import {mkdtemp,writeFile,readFile,mkdir,rm,unlink} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import {build} from "../scripts/build_catalyst_history.mjs";
const root=await mkdtemp(path.join(tmpdir(),"sli-catalyst-"));
const save=async(rel,content)=>{const p=path.join(root,rel);await mkdir(path.dirname(p),{recursive:true});await writeFile(p,JSON.stringify(content))};
const read=async rel=>JSON.parse(await readFile(path.join(root,rel),"utf8"));
const at="2026-10-20T05:00:00Z";
const news={updated_at_utc:at,articles:[{id:"n1",title:"Indonesia food policy background",publisher:"Source",sector:"food",published_at_utc:"2026-10-20T04:30:00Z",url:"https://publisher.example/first",evidence_level:"publisher_attributed_news_report"}]};
const projects={as_of:"2026-10-20",records:[{id:"p1",name:"Battery plant project",sector:"Critical minerals",stage:"Under construction",provinces:["West Java"],region:"Karawang",source_url:"https://setneg.go.id/report",evidence_date:"2026-10-17"}]};
const laws={updated_at:"2026-10-20",nodes:[{id:"law1",ref:"UU Test",label:"Energy policy",kind:"legislation",sector:"energy",status:"enacted",region:"Indonesia",source:"https://peraturan.go.id/test",verified_at:"2026-10-18"}]};
const issuers={as_of:"2026-10-20",records:[{ticker:"ANTM",name:"Aneka Tambang",exchange:"IDX",sector:"minerals"},{ticker:"INCO",name:"Vale Indonesia",exchange:"IDX",sector:"minerals"}]};
const groups={records:[{ticker:"ANTM",exchange:"IDX",name:"PT Aneka Tambang Tbk (ANTAM)",source_url:"https://idx.co.id/profile"}]};
const actors={project_participations:[{name:"PT Aneka Tambang Tbk (ANTAM)",project_id:"p1",source_url:"https://setneg.go.id/report",source_date:"2026-10-17"}]};
const files={news:"data/sli-secondary-news-index.json",projects:"data/sli-project-registry.json",laws:"data/sli-policy-regulatory-graph-2026.json",issuers:"data/sli-idx-issuer-universe.json",groups:"data/sli-corporate-group-registry.json",actors:"data/sli-corporate-evidence-relationships.json"};
try{
 for(const [k,v]of Object.entries({news,projects,laws,issuers,groups,actors}))await save(files[k],v);
 let result=await build(root,{now:at});
 assert.equal(result.initialized,true,"first run should initialize server baseline");
 assert.equal(result.added,0,"first observation cannot produce false historical catalysts");
 assert.equal((await read("data/sli-catalyst-history.json")).events.length,0);
 assert.equal((await build(root,{now:"2026-10-20T06:00:00Z"})).added,0,"idempotent unchanged inputs");
 // Explicit change on dated source plus direct participant; new explicit issuer headline.
 news.updated_at_utc="2026-10-20T08:00:00Z";
 news.articles.unshift({id:"n2",title:"ANTM announces mine expansion",publisher:"Reuters",sector:"minerals",
  published_at_utc:"2026-10-20T07:00:00Z",url:"https://publisher.example/new",evidence_level:"publisher_attributed_news_report"});
 news.articles.push({id:"old",title:"Historical archive imported later",sector:"food",publisher:"Old",
  published_at_utc:"2025-01-01T00:00:00Z",url:"https://publisher.example/old"});
 news.articles.push({id:"unsafe",title:"Unsafe URL",sector:"minerals",publisher:"Bad",published_at_utc:"2026-10-20T07:00:00Z",url:"javascript:alert(1)"});
 projects.records[0].stage="Operational";
 laws.nodes[0].status="amended";
 actors.project_participations[0].source_date="2026-10-20";
 await save(files.news,news);await save(files.projects,projects);await save(files.laws,laws);await save(files.actors,actors);
 result=await build(root,{now:"2026-10-20T08:30:00Z"});
 assert.equal(result.added,4,"news + project stage + regulation status + updated project participant evidence");
 let ledger=await read("data/sli-catalyst-history.json");
 assert.equal(ledger.events.length,4);
 const newsEvent=ledger.events.find(x=>x.kind==="news_indexed");
 assert.equal(newsEvent.ticker_links[0].ticker,"ANTM","direct ticker in headline only");
 assert.equal(newsEvent.ticker_links[0].basis,"explicit_headline_identity");
 assert.equal(newsEvent.impact_status,"not_assessed");
 const projectEvent=ledger.events.find(x=>x.kind==="project_stage_index_changed");
 assert.equal(projectEvent.previous,"Under construction");
 assert.equal(projectEvent.current,"Operational");
 assert.deepEqual(projectEvent.provinces,["West Java"]);
 assert.equal(projectEvent.ticker_links.length,1,"only evidenced participant");
 assert.equal(projectEvent.ticker_links[0].ticker,"ANTM");
 assert.ok(!projectEvent.ticker_links.some(x=>x.ticker==="INCO"),"no sector-only ownership");
 const lawEvent=ledger.events.find(x=>x.kind==="regulation_status_index_changed");
 assert.equal(lawEvent.ticker_links.length,0,"cross-sector law not misattributed to a company");
 assert.equal(lawEvent.current,"amended");
 const actorEvent=ledger.events.find(x=>x.kind==="project_participation_evidence_revised");
 assert.ok(actorEvent,"updated source date generates participation evidence revision");
 assert.equal(actorEvent.ticker_links[0].ticker,"ANTM");
 assert.equal(actorEvent.impact_status,"not_assessed");
 assert.ok(actorEvent.summary.includes("not proof of new shareholding"));
 assert.equal((await build(root,{now:"2026-10-20T09:00:00Z"})).added,0,"no duplicate events across reruns");
 assert.equal((await read("data/sli-catalyst-history.json")).count,4);
 // Source outage should preserve previous snapshot and must not forge disappearing entities.
 await unlink(path.join(root,files.projects));
 result=await build(root,{now:"2026-10-20T10:00:00Z"});
 assert.ok(result.missing.includes("projects"));
 const baseline=await read("data/sli-catalyst-state.json");
 assert.equal(baseline.projects.p1.stage,"Operational");
 assert.equal((await read("data/sli-catalyst-history.json")).count,4);
 console.log("SLI Catalyst shared-history QA passed: zero false first-run alerts, source-dated delta, joins, idempotence, source outage, URL safety");
}finally{await rm(root,{recursive:true,force:true})}
