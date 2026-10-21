import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateScreenedPortal,rankedRegions,rankedSeeds,rankedDistrictSeed} from "../js/sli-marine-source-atlas.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const regional=JSON.parse(read("data/sli-kkp-portal-screened-2024.json"));
const register=JSON.parse(read("data/sli-kkp-screened-source-register.json"));
const src=id=>register.sources.find(x=>x.id===id);
test("KKP 2024 province fishers and seaweed are numeric, source-cited, and reconcile to official national totals",()=>{
 const test=validateScreenedPortal(regional,register);
 assert.equal(test.pass,true,JSON.stringify(test.issues));
 assert.equal(test.sources,25);
 const fish=regional.province_indicators.find(x=>x.id==="marine_fishers_2024");
 const weed=regional.province_indicators.find(x=>x.id==="seaweed_growout_2024");
 assert.equal(fish.rows.length,37);
 assert.equal(fish.rows.reduce((s,x)=>s+x.value,0),2819994);
 assert.equal(fish.unit,"orang");
 assert.equal(weed.rows.length,26);
 assert.ok(Math.abs(weed.rows.reduce((s,x)=>s+x.value,0)-9853604.06)<=0.05);
 assert.equal(weed.unit,"ton");
 assert.ok(fish.rows.every(x=>x.value>0));
 assert.ok(!fish.rows.some(x=>x.province==="Papua Pegunungan"),"No invented zero for landlocked Papua Pegunungan");
 assert.ok(!weed.rows.some(x=>x.province==="Aceh"),"Blanks in source remain absent, not zero");
 assert.equal(rankedRegions(regional,"marine_fishers_2024").length,12);
 assert.equal(rankedRegions(regional,"marine_fishers_2024","Sulawesi Tengah",true)[0].value,260449);
 assert.equal(rankedRegions(regional,"seaweed_growout_2024")[0].province,"Sulawesi Selatan");
 assert.equal(rankedRegions(regional,"seaweed_growout_2024")[0].value,4018691.97);
});
test("Hatchery snapshot is precisely qualified as a partial species ranking, not 1387 imported detailed district rows",()=>{
 assert.equal(regional.seed_species.detail_rows_displayed,1387);
 assert.equal(regional.seed_species.rows.length,12);
 assert.equal(regional.seed_species.unit,"ribu_ekor");
 assert.equal(rankedSeeds(regional)[0].species,"Lele");
 assert.equal(regional.seed_species.national_total_displayed,188203415);
 assert.ok(regional.seed_species.rows.reduce((s,x)=>s+x.value,0)<regional.seed_species.national_total_displayed);
 assert.match(regional.methodology.seed_unit_caution,/DO NOT/i);
});
test("Screened KKP source leads cover trade, capture, livelihood, salt, consumption, GDP, vessels, conservation and compliance without fabricated imported status",()=>{
 for(const id of ["capture","salt_prod","salt_farmers","consumption","absorption","exports","trade_hs","fisheries_gdp","fleet","land","extension","pnbp","monitoring","enforcement","conservation","wpp","mangrove"])
  assert.ok(src(id),id);
 assert.equal(src("trade_hs").numeric_import_status,"not_imported");
 assert.ok(src("trade_hs").visual_types.includes("sankey-conditional"));
 assert.equal(src("conservation").status,"map_layer_only");
 assert.equal(src("mangrove").status,"catalog_metadata_only");
 assert.ok(register.sources.every(x=>x.source_url.startsWith("https://portaldata.kkp.go.id/")));
 assert.equal(register.sources.filter(x=>x.numeric_import_status!=="not_imported").length,3);
 assert.match(regional.methodology.map_policy,/harmonization/i);
});
test("SLI source atlas UI is wired to dedicated Marine dashboard with source-qualified interactions",()=>{
 const html=read("marine-fisheries-intelligence.html"),js=read("js/sli-marine-source-atlas.mjs"),css=read("css/sli-marine-fisheries.css");
 for(const id of ["marine-source-atlas","mfAtlasProvinceMetric","mfAtlasProvinceQuery","mfAtlasProvinceChart","mfAtlasProvinceRows","mfAtlasAllButton","mfAtlasCSV","mfAtlasSeedList","mfAtlasSourceCards","mfAtlasSourceGroup","mfAtlasSourceStatus","mfAtlasProvinceSource"]){
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 }
 assert.ok(html.indexOf('id="marine-governance"')<html.indexOf('id="marine-source-atlas"'));
 assert.ok(html.indexOf('id="marine-source-atlas"')<html.indexOf('id="marine-sectors"'));
 assert.match(html,/js\/sli-marine-source-atlas\.mjs/);
 assert.match(js,/downloadCSV\(/);
 assert.match(js,/sli:languagechange/);
 assert.match(js,/numeric_import_status/);
 assert.match(css,/mf-atlas-source-grid/);
 const broken=structuredClone(regional);broken.province_indicators[0].rows[0].value=0;
 assert.equal(validateScreenedPortal(broken,register).pass,false);
 const duplicate=structuredClone(register);duplicate.sources.push({...duplicate.sources[0]});
 assert.equal(validateScreenedPortal(regional,duplicate).pass,false);
 const disguised=structuredClone(register);disguised.sources[0].status="numeric_ingested_2024";
 // Catalogue-only rows must not be marked numeric merely by changing status.
 assert.equal(disguised.sources[0].numeric_import_status,"not_imported");
});

test("KKP hatchery top-10 qualified district/value/weighted price data do not pretend to cover 1387",()=>{
 const group=regional.seed_district_top_rows;
 assert.equal(group.rows.length,10);
 assert.equal(group.source_rows_displayed,1387);
 assert.equal(group.unit_volume,"ribu_ekor");
 assert.equal(group.unit_value,"Rp juta");
 assert.equal(group.unit_weighted_price,"Rp/ribu ekor");
 assert.equal(group.rows[0].district,"Kediri");
 assert.equal(group.rows[0].value_rp_million,1398);
 assert.equal(rankedDistrictSeed(regional,"vaname").length,3);
 assert.equal(rankedDistrictSeed(regional,"bogor").length,1);
 assert.equal(rankedDistrictSeed(regional,"sumatera selatan").length,2);
 const broken=structuredClone(regional);broken.seed_district_top_rows.rows[0].value_rp_million=NaN;
 assert.equal(validateScreenedPortal(broken,register).pass,false);
 const html=read("marine-fisheries-intelligence.html"),js=read("js/sli-marine-source-atlas.mjs");
 for(const id of ["mfAtlasDistrictQuery","mfAtlasDistrictCount","mfAtlasDistrictCSV","mfAtlasDistrictRows","mfAtlasDistrictSource"])
  assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.match(js,/rankedDistrictSeed\(data,state\.districtQuery\)/);
 assert.match(html,/10 dari 1\.387 baris/);
});
