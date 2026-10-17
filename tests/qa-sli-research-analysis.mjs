import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildResearchReport,generateProvinceReport,findProvinces,detectIntents,reportToText,validateProfiles} from "../js/sli-research-analysis.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const provinces=JSON.parse(read("data/sli-research-province-preview.json"));
const corpus=JSON.parse(read("data/sli-research-evidence-preview.json"));
test("Every one of 38 BPS province names resolves to itself and nothing else",()=>{
 assert.equal(validateProfiles(provinces),true);
 for(const p of provinces.provinces){
  const found=findProvinces(p.name,provinces.provinces).map(x=>x.name);
  assert.deepEqual(found,[p.name],"Misrouted province "+p.name);
  const result=buildResearchReport(p.name,provinces,corpus);
  assert.deepEqual(result.geo,[p.name]);
  assert.equal(result.kind,"province");
  assert.match(reportToText(result,p.name),/BPS/);
 }
});
test("Central Java cannot leak West Java and there is only one source-accurate region",()=>{
 for(const query of ["Jawa Tengah","jateng","Central Java","pertumbuhan Jawa Tengah","investasi jateng","inflasi Jawa Tengah","data center di Jawa Tengah"]){
  const f=findProvinces(query,provinces.provinces);
  assert.deepEqual(f.map(x=>x.name),["Jawa Tengah"],query);
  const report=buildResearchReport(query,provinces,corpus);
  assert.deepEqual(report.geo,["Jawa Tengah"]);
  assert.ok(!report.sources.some(x=>x.title.includes("Jawa Barat")),"Wrong province source");
 }
 const data=buildResearchReport("Jawa Tengah",provinces,corpus);
 assert.ok(data.metrics.some(x=>x.value==="5,37%"));
 assert.ok(data.metrics.some(x=>x.value==="30,91%"));
 assert.ok(data.metrics.some(x=>x.value==="0,354"));
 assert.match(reportToText(data,"Jawa Tengah"),/pembentukan modal|PMTB/i);
 assert.match(reportToText(data,"Jawa Tengah"),/Gini/);
 assert.ok(!reportToText(data,"Jawa Tengah").includes("Assessment Ekonomi & Investasi: Jawa Barat"));
});
test("Nested Papua boundaries do not trigger three province reports",()=>{
 for(const [query,expected] of [["Papua","Papua"],["Papua Barat","Papua Barat"],["Papua Barat Daya","Papua Barat Daya"],["Southwest Papua","Papua Barat Daya"]]){
  assert.deepEqual(findProvinces(query,provinces.provinces).map(x=>x.name),[expected]);
 }
 const papua=buildResearchReport("Papua",provinces,corpus);
 assert.ok(!reportToText(papua,"Papua").includes("Tangguh Ubadari"));
});
test("Comparative queries are bounded to exactly two geographies",()=>{
 const two=buildResearchReport("Jawa Tengah vs Jawa Barat",provinces,corpus);
 assert.equal(two.kind,"comparison");
 assert.deepEqual(two.geo,["Jawa Tengah","Jawa Barat"]);
 assert.match(two.sections[0].body,/5,37/);
 const three=buildResearchReport("Jawa Tengah, Jawa Barat dan Jawa Timur",provinces,corpus);
 assert.equal(three.kind,"limit");
 assert.equal(three.geo.length,3);
});
test("Specific sector requests never substitute unobserved local evidence",()=>{
 const ai=buildResearchReport("data center Jawa Tengah",provinces,corpus);
 assert.ok(ai.sources.some(s=>/ZanKore/i.test(s.title)));
 assert.ok(ai.sections.some(s=>/bukan bukti|bukan kapasitas operasi/i.test(s.body)));
 const cpi=buildResearchReport("inflasi Jawa Tengah",provinces,corpus);
 assert.match(reportToText(cpi,"inflasi Jawa Tengah"),/Tidak ada seri inflasi\/IHK khusus Jawa Tengah/);
 const news=buildResearchReport("berita terkini Jawa Tengah",provinces,corpus);
 assert.match(reportToText(news,"berita terkini Jawa Tengah"),/Belum tersedia arsip berita/);
 const spklu=buildResearchReport("SPKLU Jawa Tengah",provinces,corpus);
 assert.match(reportToText(spklu,"SPKLU Jawa Tengah"),/belum ada bukti spesifik SPKLU/);
});
test("National questions return short analytical assessments, not unrelated regional hits",()=>{
 for(const [q,source] of [["berapa inflasi 2026","CPI headline inflation"],["suku bunga BI","BI policy rate"],["kurs rupiah","USD/IDR JISDOR"],["apa itu PMTB","Cara membaca pertumbuhan"]]){
  const report=buildResearchReport(q,provinces,corpus);
  assert.equal(report.kind,"theme");
  assert.equal(report.sources.length,1);
  assert.match(report.sources[0].title,new RegExp(source));
  assert.ok(report.sections.length>=2);
 }
 const trade=buildResearchReport("bandingkan ekspor impor",provinces,corpus);
 assert.match(reportToText(trade,"bandingkan ekspor impor"),/3,55/);
 const unknown=buildResearchReport("xyzzy unprovided economy of mars",provinces,corpus);
 assert.ok(["theme","insufficient"].includes(unknown.kind)); // never invent Mars figures
});
test("Research UI is a module using analysis engine and two independently dated snapshots",()=>{
 const html=read("sli-research-evidence-preview.html"),script=read("js/sli-research-ai.js");
 assert.match(html,/type="module" src="\.\/js\/sli-research-ai\.js/);
 assert.match(script,/import \{buildResearchReport,reportToText/);
 assert.match(script,/sli-research-province-preview\.json/);
 assert.match(script,/report\.sections/);
 assert.match(html,/BUKAN AI generatif/);
 assert.ok(!script.includes("api.openai.com"));
 const plans=JSON.parse(read("data/sli-membership-plans.json"));
 assert.equal(plans.policy.single_device_limit_is_live,false);
 assert.equal(plans.checkout_enabled,false);
});
