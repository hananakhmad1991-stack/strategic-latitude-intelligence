import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateHatcheryProvinceSummary} from "../js/sli-kkp-hatchery-provincial.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const d=JSON.parse(read("data/sli-kkp-hatchery-province-cards-2024.json"));
test("33 official visible provincial hatchery cards subtotal is NOT a fully attributed national breakdown",()=>{
 assert.equal(validateHatcheryProvinceSummary(d).pass,true);
 assert.equal(d.rows.length,33);
 assert.equal(d.rows.reduce((a,r)=>a+r.volume_ribu_ekor,0),187483665);
 assert.equal(d.national_total_displayed,188203415);
 assert.equal(d.unallocated_displayed_gap,719750);
 assert.equal(d.observation_year,2024);
 assert.equal(d.unit,"ribu ekor");
 assert.equal(d.rows.find(x=>x.province==="Jawa Timur").volume_ribu_ekor,41649893);
 assert.ok(!d.rows.some(x=>x.province==="Maluku Utara"));
 const modified=structuredClone(d);modified.rows[0].volume_ribu_ekor=0;
 assert.equal(validateHatcheryProvinceSummary(modified).pass,false);
});
test("KKP provincial hatchery chart has full attribution and no fabricated Papua assignment",()=>{
 const html=read("marine-fisheries-intelligence.html"),js=read("js/sli-kkp-hatchery-provincial.mjs");
 for(const id of ["mfHatcheryProvincePanel","mfHatcheryProvinceSearch","mfHatcheryProvinceCSV","mfHatcheryProvinceStatus","mfHatcheryProvinceRanking","mfHatcheryProvinceSource"])
 assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.match(html,/selisih ditampilkan sebagai tidak teralokasi/);
 assert.match(js,/sliLocalOnly:true/);
 assert.match(js,/unallocated_displayed_gap/);
 assert.match(js,/Source publisher/);
});
