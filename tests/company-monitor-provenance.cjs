/* Regression: company-project edges must be explicit and sourced.
 * Run: node tests/company-monitor-provenance.cjs
 * Uses only built-in Node modules (no dependency installation).
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const base=path.resolve(__dirname,"..");
const js=fs.readFileSync(path.join(base,"js/sli-company-monitor.js"),"utf8");
const sandbox={window:{},document:{readyState:"loading",addEventListener(){}},URL,console};
vm.runInNewContext(js,sandbox,{filename:"sli-company-monitor.js"});
const {attributedProjects,groupEvidence}=sandbox.window.SLICompanyMonitor;
const issuer={ticker:"ANTM",name:"Aneka Tambang"};
const groups={records:[
 {id:"antm",name:"PT Aneka Tambang Tbk (ANTAM)",ticker:"ANTM",exchange:"IDX",group:"mindid",parent_id:"mindid",relationship:"reported-member",source_url:"https://idx.co.id/test"},
 {id:"mindid",name:"MIND ID",group:"mindid",parent_id:null,source_url:"https://mind.id/test"}
]};
const projects={records:[{id:"p1",name:"Battery factory",sector:"minerals"},{id:"p2",name:"Nickel project",sector:"minerals"}]};
const edges={project_participations:[
 {project_id:"p1",name:"PT Aneka Tambang Tbk (ANTAM)",source_url:"https://setneg.go.id/test",source_date:"2025-06-29"},
 {project_id:"p2",name:"Unrelated Nickel Operator",source_url:"https://setneg.go.id/test",source_date:"2025-06-29"},
 {project_id:"p2",name:"ANTM investor?",source_url:"https://setneg.go.id/test",source_date:"2025-06-29"},
 {project_id:"p1",name:"PT Aneka Tambang Tbk (ANTAM)",source_url:"javascript:alert(1)"}
]};
const matches=attributedProjects(issuer,groups,projects,edges);
assert.equal(matches.length,1,"only an exact, source-attributed project link is accepted");
assert.equal(matches[0].project.id,"p1");
assert.equal(groupEvidence(issuer,groups)[0].parent.name,"MIND ID");
const institutional={ticker:"ASII",name:"Astra International"};
const legalNameEdges={project_participations:[
 {project_id:"p1",name:"PT Astra International Tbk",source_url:"https://issuer.example/report"}
]};
assert.equal(attributedProjects(institutional,{records:[]},projects,legalNameEdges).length,1,"exact legal PT/Tbk forms work");
assert.equal(attributedProjects(institutional,{records:[]},projects,{project_participations:[]}).length,0,"no sector-only project edges");
const issuerRows=JSON.parse(fs.readFileSync(path.join(base,"data/sli-idx-issuer-universe.json"),"utf8")).records;
const companyRows=JSON.parse(fs.readFileSync(path.join(base,"data/sli-corporate-group-registry.json"),"utf8"));
const projectRows=JSON.parse(fs.readFileSync(path.join(base,"data/sli-project-registry.json"),"utf8"));
const evidenceRows=JSON.parse(fs.readFileSync(path.join(base,"data/sli-corporate-evidence-relationships.json"),"utf8"));
const idxByTicker=new Map(issuerRows.map(x=>[x.ticker,x]));
for(const ticker of ["ANTM","INCO","PGEO","ASII","TLKM"]){
 assert.ok(idxByTicker.has(ticker),"expected ticker catalogue anchor missing: "+ticker);
 for(const row of attributedProjects(idxByTicker.get(ticker),companyRows,projectRows,evidenceRows)){
  assert.ok(row.edge.source_url.startsWith("https://"));
  assert.ok(row.project.id && row.edge.project_id===row.project.id);
 }
}
console.log("SLI Company Monitor provenance checks passed");
