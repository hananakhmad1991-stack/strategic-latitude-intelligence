import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {marineSeries,marineLatest,marineShares,marineGrowth,validateMarineData} from "../js/sli-marine-fisheries.mjs";
import {validateMarineGovernance} from "../js/sli-marine-governance.mjs";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-marine-fisheries-kkp.json"));
test("KKP historical observations have intact source provenance and exclude estimated 2025",()=>{
 const result=validateMarineData(data);
 assert.equal(result.pass,true,JSON.stringify(result.errors));
 assert.equal(result.records,18);
 assert.equal(marineSeries(data,"seaweed_aquaculture").length,6);
 assert.equal(marineLatest(data,"seaweed_aquaculture").value,9853604.06);
 assert.equal(marineLatest(data,"aquaculture_total").value,15754611.52);
 assert.equal(marineLatest(data,"marine_fishers").value,2819994);
 assert.equal(data.estimated_not_actual.length,2);
 assert.ok(data.records.every(row=>row.year<=2024&&row.verification_status==="source_table_transcribed_official_historical"));
 assert.ok(data.estimated_not_actual.every(x=>x.year===2025&&x.status==="estimate"));
 assert.ok(data.records.every(x=>x.source_url.startsWith("https://portaldata.kkp.go.id/")));
});
test("KKP secondary policy guardrails prevent misleading sector arithmetic and invented coverage",()=>{
 assert.ok(marineLatest(data,"aquaculture_total").value>marineLatest(data,"seaweed_aquaculture").value);
 assert.ok(marineGrowth(marineSeries(data,"seaweed_aquaculture"))>0);
 const provinces=marineShares(data);
 assert.equal(provinces.length,10);
 assert.equal(provinces[0].province,"Sulawesi Selatan");
 assert.equal(provinces[0].value,4018691.97);
 assert.ok(provinces[0].share_pct>40&&provinces[0].share_pct<42);
 assert.equal(data.thematic_register.filter(x=>x.status==="observed_historical").length,3);
 assert.ok(data.thematic_register.some(x=>x.id==="salt"&&x.status==="catalog_only"));
 assert.ok(data.thematic_register.some(x=>x.id==="conservation"&&x.status==="catalog_only"));
 assert.ok(data.thematic_register.some(x=>x.id==="wpp"&&x.status==="catalog_only"));
 assert.match(data.policy,/commercial redistribution/i);
 assert.match(data.policy,/Zero is never substituted/);
});
test("KKP static data fails validation on fabricated zeros, missing periods, estimates disguised as actuals and wrong sources",()=>{
 const cloned=()=>structuredClone(data);
 {const d=cloned();d.records[0].value=0;assert.ok(validateMarineData(d).errors.includes("invalid_observation"))}
 {const d=cloned();d.records[0].year=2025;assert.ok(validateMarineData(d).errors.some(x=>x.startsWith("missing_year:")))}
 {const d=cloned();d.estimated_not_actual[0].status="actual";assert.ok(validateMarineData(d).errors.includes("mixed_or_invalid_estimates"))}
 {const d=cloned();d.records[0].source_url="https://not-kkp.example/fake";assert.ok(validateMarineData(d).errors.includes("invalid_observation"))}
 {const d=cloned();d.province_seaweed_2024[0].value=100000000;assert.ok(validateMarineData(d).errors.includes("province_exceeds_national"))}
});
test("Marine dashboard has independent Home and Explore Data destinations",()=>{
 const page=read("marine-fisheries-intelligence.html"),nav=read("js/sli-navigation.js");
 for(const expected of ["js/sli-live-data.js","js/sli-shared-appendix.js","css/sli-navigation.css","js/sli-navigation.js"])
  assert.equal(page.split(expected).length-1,1,"shared platform asset duplicate/missing "+expected);
 assert.match(page,/type="module" src="\.\/js\/sli-marine-fisheries\.mjs/);
 assert.match(page,/id="marine-provenance"/);
 assert.match(page,/id="marine-sectors"/);
 assert.match(page,/id="marine-provinces"/);
 assert.match(page,/id="marine-trends"/);
 assert.match(page,/data-id=/);
 assert.match(page,/data-en=/);
 const fakeWindow={addEventListener(){}};const fakeDoc={readyState:"loading",addEventListener(){}};
 vm.runInNewContext(nav,{window:fakeWindow,document:fakeDoc,location:{pathname:"/marine-fisheries-intelligence.html",hash:""}});
 const {groups,modules}=fakeWindow.SLIArchitecture;
 assert.equal(groups.length,8);
 assert.equal(groups.filter(g=>g.includes("marine")).length,1);
 assert.equal(modules.marine[2],"marine-fisheries-intelligence.html");
 assert.ok(!groups.find(g=>g.includes("food")).includes("marine"));
 assert.deepEqual(Array.from(groups.find(g=>g.includes("marine")).slice(2)),["marine"]);
 assert.match(read("index.html"),/href="\.\/marine-fisheries-intelligence\.html" class="sli-portal-topic-main"/);
 for(const id of ["marine-governance","marine-hierarchy","marine-network","mfHierarchyDiagram","mfNetworkDiagram"])assert.ok(page.includes('id="'+id+'"'),id);
 assert.match(page,/js\/sli-marine-governance\.mjs/);
 assert.ok(modules.food[2].includes("food-agriculture-intelligence.html"));
 assert.ok(modules.marine[1].includes("Kelautan"));
 assert.match(read("sli-sector-data-library.html"),/id="marine"/);
 assert.match(read("food-agriculture-intelligence.html"),/marine-fisheries-intelligence\.html/);
});

test("KKP governance sources separate official directorates from six functional hubs",()=>{
 const d=JSON.parse(read("data/sli-marine-governance.json"));
 const checked=validateMarineGovernance(d);
 assert.equal(checked.pass,true,JSON.stringify(checked.issues));
 assert.equal(d.groups.length,6);
 assert.equal(d.schema,"sli-marine-governance-v2");
 assert.ok(checked.organizations>=50);
 assert.ok(checked.verified_people>=40);
 assert.equal(d.hierarchy.find(x=>x.id==="wamen").officeholder.name,"Irwan Meilano");
 assert.equal(d.hierarchy.find(x=>x.id==="setjen").officeholder.name,"Andy Artha Donny Oktopura");
 assert.equal(d.hierarchy.find(x=>x.id==="djpdspkp").officeholder.name,"Yudi Nurul Ihsan");
 assert.equal(d.hierarchy.find(x=>x.id==="itjen").officeholder.name,"Ade Tajudin Sutiawarman");
 assert.ok(d.emblem.url.startsWith("https://ptsp.kkp.go.id/"));
 assert.ok(d.actors.find(x=>x.id==="bappenas").sector_contact?.name==="Mohamad Rahmat Mulianda");
 assert.equal(d.hierarchy.find(x=>x.id==="djprl").parent,"minister");
 assert.equal(d.hierarchy.find(x=>x.id==="djpkel").parent,"minister");
 assert.ok(d.hierarchy.some(x=>x.id==="bppmhkp"));
 assert.ok(d.legal_sources.some(x=>x.url.includes("perpres-no-112-tahun-2025")));
 assert.ok(d.legal_sources.some(x=>x.url.includes("DetailPeraturan/6750")));
 assert.ok(d.actors.some(x=>x.id==="dkp"));
 assert.ok(!d.hierarchy.some(x=>x.id==="dkp"),"Regional authority must not become a KKP subordinate");
 for(const hub of d.groups)assert.ok(hub.actor_ids.length>=2);
 const fake=structuredClone(d);fake.groups[0].actor_ids=["does-not-exist"];assert.equal(validateMarineGovernance(fake).pass,false);
 {const stale=structuredClone(d);stale.hierarchy.find(x=>x.id==="wamen").officeholder.name="Didit Herdiawan";assert.equal(validateMarineGovernance(stale).pass,false)}
 const page=read("marine-fisheries-intelligence.html");
 assert.ok(page.indexOf('id="marine-governance"')<page.indexOf('id="marine-overview"'),"Institutional intelligence must appear above statistics");
 for(const id of ["mfHierarchyQuery","mfHierarchyFilter","mfExpandAll","mfCollapseAll","mfNetworkChips","mfNetworkCount"])assert.ok(page.includes('id="'+id+'"'),id);
 assert.match(read("js/sli-marine-governance.mjs"),/mf-gov-link-lines/);
 assert.match(read("css/sli-marine-fisheries.css"),/mf-gov-network-grid/);
});
