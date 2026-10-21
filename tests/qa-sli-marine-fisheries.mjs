import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import {marineSeries,marineLatest,marineShares,marineGrowth,validateMarineData} from "../js/sli-marine-fisheries.mjs";

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
test("Marine dashboard follows SLI canonical navigation, no new top-level group or overlapping agriculture dashboard",()=>{
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
 assert.equal(groups.length,7);
 assert.equal(groups.filter(g=>g.includes("marine")).length,1);
 assert.equal(modules.marine[2],"marine-fisheries-intelligence.html");
 assert.ok(groups.find(g=>g.includes("food")).includes("marine"));
 assert.ok(modules.food[2].includes("food-agriculture-intelligence.html"));
 assert.ok(modules.marine[1].includes("Kelautan"));
 assert.match(read("sli-sector-data-library.html"),/id="marine"/);
 assert.match(read("food-agriculture-intelligence.html"),/marine-fisheries-intelligence\.html/);
});
