/* Catalyst v2 client-side filtering and UI wiring regression (Node built-ins). */
"use strict";
const assert=require("node:assert/strict"),vm=require("node:vm"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const js=fs.readFileSync(path.join(root,"js/sli-catalyst-history-ui.js"),"utf8");
const fakeStorage={getItem:()=>null,setItem:()=>{}};
const sandbox={window:{},localStorage:fakeStorage,
 document:{readyState:"loading",documentElement:{lang:"id"},addEventListener(){}},
 URL,URLSearchParams,console,Intl,Date};
vm.runInNewContext(js,sandbox,{filename:"sli-catalyst-history-ui.js"});
const api=sandbox.window.SLICatalystHistory;
assert.equal(typeof api.relevant,"function");
assert.equal(api.groupType("news_indexed"),"news");
assert.equal(api.groupType("official_metadata_indexed"),"news");
assert.equal(api.groupType("project_stage_index_changed"),"project");
assert.equal(api.groupType("project_participant_indexed"),"project");
assert.equal(api.groupType("project_participation_evidence_revised"),"project");
assert.equal(api.groupType("regulation_status_index_changed"),"regulation");
const names=new Map([["ANTM",{sector:"minerals"}],["INCO",{sector:"minerals"}],["PGEO",{sector:"energy"}]]);
const ev={kind:"project_stage_index_changed",sector:"minerals",title:"Battery chain investment",
 summary:"Stage change in the source index",source_url:"https://setneg.go.id/test",
 ticker_links:[{ticker:"ANTM",basis:"reported_project_participant"}],region:"Karawang",provinces:["West Java"]};
const base={scope:"context",type:"all",level:"direct",text:""};
assert.equal(api.relevant(ev,base,"ANTM",new Set(),names).basis,"direct");
assert.equal(api.relevant(ev,base,"INCO",new Set(),names).match,false,"sector context must not pose as a direct link");
assert.equal(api.relevant(ev,{...base,level:"sector"},"INCO",new Set(),names).basis,"sector");
assert.equal(api.relevant(ev,{...base,level:"sector"},"PGEO",new Set(),names).match,false);
assert.equal(api.relevant(ev,{...base,text:"West Java"},"ANTM",new Set(),names).match,true);
assert.equal(api.relevant(ev,{...base,text:"Papua"},"ANTM",new Set(),names).match,false);
assert.equal(api.relevant(ev,{...base,scope:"watch"},"",new Set(["ANTM"]),names).match,true);
assert.equal(api.relevant(ev,{...base,scope:"watch"},"",new Set(),names).match,false);
assert.equal(api.relevant(ev,{...base,type:"regulation"},"ANTM",new Set(),names).match,false);
assert.ok(api.prompt({...ev,detected_at_utc:"2026-10-20T05:00:00Z",source_at_utc:"2026-10-19",previous:"Announced",current:"Under construction"},"ANTM")
 .includes("Jangan menganggap perubahan indeks"),"DERGUBA must retain evidentiary caveats");
for(const name of ["sli-issuer.html","sli-decision-terminal.html"]){
 const h=fs.readFileSync(path.join(root,name),"utf8");
 assert.ok(h.includes('id="sliCatalystHistory"'),name+" missing historical timeline mount");
 assert.ok(h.includes("js/sli-catalyst-history-ui.js"),name+" missing history client");
 assert.ok(h.includes("css/sli-catalyst-history.css"),name+" missing history style");
 assert.ok(h.includes('class="sli-catalyst-archive"'),name+" missing fallback source explorer");
}
console.log("SLI Catalyst v2 UI QA passed: explicit/sector distinctions, watchlist/region/topic filters, issuer dossier and terminal mounts.");
