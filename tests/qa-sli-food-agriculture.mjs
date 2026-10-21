import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const root=new URL("../",import.meta.url);
const read=p=>readFileSync(new URL(p,root),"utf8");
const data=JSON.parse(read("data/food-agriculture-2026.json"));
const find=(scope,sector)=>data.trade.find(r=>r.scope===scope&&r.sector===sector);
test("food is a new source-dated sector, never a synthetic live quote",()=>{
 assert.equal(data.schema,"sli-food-2026-launch-v1");
 assert.equal(data.publication.release,"2026-06");
 assert.equal(data.publication.trade_data_until,"2026-04");
 assert.equal(data.publication.price_ntp_data_until,"2026-05");
 assert.match(data.publication.pdf,/satudata\.pertanian\.go\.id\/assets\/docs\/publikasi\//);
 assert.equal(data.quality.monthly_auto_updates,false);
});
test("food trade totals preserve original thousands USD and raw/processed differences",()=>{
 assert.equal(data.trade.length,15);
 assert.equal(data.tradeMonthly.length,60,"3 coverage scopes × 5 sectors × 4 months");
 assert.equal(new Set(data.tradeMonthly.map(r=>r.period)).size,4);
 assert.ok(data.tradeMonthly.every(r=>Math.abs(r.export-r.import-r.balance)<=2));
 for(const scope of ["Segar + olahan","Segar","Olahan"]){
  const total=find(scope,"Pertanian Total");
  assert.ok(total&&total.unit==="ribu USD");
  for(const item of data.trade.filter(z=>z.scope===scope)){
   assert.equal(item.unit,"ribu USD");
   assert.ok(Number.isFinite(item.export)&&Number.isFinite(item.import)&&Number.isFinite(item.balance));
   assert.ok(Math.abs(item.export-item.import-item.balance)<=2,"published rounded trade components must reconcile within 2 thousand US$: "+item.sector);
  }
 }
 assert.equal(find("Segar + olahan","Pertanian Total").balance,6271208);
 assert.equal(find("Segar","Pertanian Total").balance,-2651598);
 assert.equal(find("Olahan","Pertanian Total").balance,8922806);
});
test("province farmer indices cover 38 BPS places with consistent numeric arrays",()=>{
 assert.equal(data.provinces.length,38);
 assert.equal(new Set(data.provinces).size,38);
 for(const k of ["april","may","ntup"]){
  assert.equal(data.ntp[k].length,38);
  assert.ok(data.ntp[k].every(v=>Number.isFinite(v)&&v>50&&v<300));
 }
 assert.equal(data.ntp.may[3],207.41);
 assert.equal(data.ntp.may[37],93.93);
 assert.equal(data.ntp.unit,"indeks 2018=100");
});
test("national index comparison preserves source calendar periods and all original subsectors",()=>{
 const v=data.nationalFarmerIndices;
 assert.equal(v.series.length,6);
 assert.deepEqual(v.periods,["2025-05","2026-01","2026-02","2026-03","2026-04","2026-05"]);
 for(const r of v.series){
  assert.equal(r.ntp.length,6);assert.equal(r.ntup.length,6);
  assert.ok(r.ntp.every(x=>Number.isFinite(x)&&x>0));
  assert.ok(r.ntup.every(x=>Number.isFinite(x)&&x>0));
  assert.ok(data.tables.find(t=>t.number===r.table).structured);
 }
 assert.equal(v.series[0].ntp[5],127.73);
 assert.equal(v.series[3].ntp[5],140.58);
});
test("all eleven 34-place commodity price series distinguish true missing values from zero",()=>{
 assert.equal(data.prices.places.length,34);
 assert.equal(data.prices.items.length,11);
 assert.ok(data.prices.items.some(x=>x.table===49));
 assert.ok(data.prices.items.some(x=>x.values.includes(null)));
 for(const item of data.prices.items){
  assert.equal(item.values.length,34);
  assert.equal(item.period,"2026-05");
  assert.ok(item.values.every(v=>v===null||(Number.isFinite(v)&&v>0&&v<400000)));
 }
});
test("all original table IDs preserve source anomaly and page links, without invented complete numeric coverage",()=>{
 assert.equal(data.tables.length,63);
 assert.equal(data.tables[0].number,1);
 assert.equal(data.tables.at(-1).number,64);
 assert.ok(!data.tables.some(r=>r.number===63));
 assert.equal(data.tables.find(r=>r.number===38).pdfPage,57);
 assert.equal(data.tables.find(r=>r.number===49).pdfPage,70);
 assert.equal(data.tables.find(r=>r.number===64).pdfPage,87);
 assert.ok(data.tables.some(r=>!r.structured));
});
test("food UX follows existing Energy/SLI architecture with genuine interactive data inspectors",()=>{
 const page=read("food-agriculture-intelligence.html");
 const js=read("js/food-agriculture-intelligence.js");
 const css=read("css/food-agriculture-intelligence.css");
 const nav=read("js/sli-navigation.js"),home=read("index.html");
 for(const id of ["fa-overview","fa-trade","fa-farmers","fa-prices","fa-governance","fa-analysis","fa-sources"])assert.ok(page.includes('id="'+id+'"'));
 for(const id of ["faTradeScope","faTradeMonth","faNationalGroup","faNationalMetric","faFarmerProvince","faCommodity","faPricePlace","faOrgGraph","faSourceSearch"])assert.ok(page.includes('id="'+id+'"'));
 assert.match(page,/sli-live-data\.js/);
 assert.match(page,/sli-navigation\.js\?v=20261019-id-audit9/);
 assert.match(page,/localStorage\.getItem\('sli-ui-language'\)/);
 assert.match(js,/SLIVisualExport.*register/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/MutationObserver/);
 assert.match(js,/government|kementan|kemenkopangan/i);
 assert.match(css,/fa-kpis/);
 assert.match(nav,/food-agriculture-intelligence\.html/);
 assert.match(home,/food-agriculture-intelligence\.html/);
 assert.doesNotMatch(page,/ONCLICK\s*=/i);
});

test("Bapanas leader is official-source verified and not overwritten by obsolete mockup data",()=>{
 const registry=JSON.parse(read("data/food-institution-leadership.json"));
 assert.equal(registry.schema_version,"sli-food-leadership-v1");
 assert.equal(registry.review_status,"official_primary_source_verified");
 const bapanas=registry.appointments.find(a=>a.institution_id==="bapanas");
 const kemen=registry.appointments.find(a=>a.institution_id==="kementan");
 assert.equal(bapanas.person,"Andi Amran Sulaiman");
 assert.equal(kemen.person,bapanas.person,"double-hatted leadership should remain consistent");
 assert.equal(bapanas.appointed_on,"2025-10-09");
 assert.match(bapanas.instrument,/116\/P Tahun 2025/);
 assert.equal(bapanas.replaces,"Arief Prasetyo Adi");
 assert.equal(bapanas.last_official_confirmation,"2026-10-14");
 assert.ok(bapanas.sources.some(s=>s.type==="official_head_profile"&&s.url==="https://badanpangan.go.id/wiki/profil-kepala-badan"));
 assert.ok(bapanas.sources.some(s=>s.type==="official_dated_press_release"&&s.url.includes("badanpangan.go.id/")));
 const js=read("js/food-agriculture-intelligence.js");
 assert.match(js,/fetch\("\.\/data\/food-institution-leadership\.json"/);
 assert.match(js,/review_status!=="official_primary_source_verified"/);
 assert.match(js,/last_official_confirmation/);
 assert.doesNotMatch(js,/Arief Prasetyo Adi/,"Do not hardcode superseded holder in live UI.");
 assert.equal(registry.rules.missing_officeholder,"show_unverified_do_not_guess");
});

test("food governance v2 is an interactive, source-led hierarchy without false ministerial subordination",()=>{
 const model=JSON.parse(read("data/food-governance-hierarchy.json"));
 const page=read("food-agriculture-intelligence.html");
 const js=read("js/food-governance-hierarchy.js");
 const main=read("js/food-agriculture-intelligence.js");
 const style=read("css/food-governance-hierarchy.css");
 assert.equal(model.schema,"sli-food-governance-v2");
 assert.ok(model.nodes.length>=20);
 const byId=new Map(model.nodes.map(n=>[n.id,n]));
 assert.equal(byId.get("pres").person,"Prabowo Subianto");
 assert.equal(byId.get("kemenkopangan").person,"Zulkifli Hasan");
 assert.equal(byId.get("bapanas").person,"Andi Amran Sulaiman");
 assert.equal(byId.get("kementan").person,byId.get("bapanas").person);
 assert.equal(byId.get("bgn").person,"Sudaryono");
 assert.equal(byId.get("pusdatin").parent,"kementan");
 assert.equal(byId.get("pemda").parent,"kemendagri");
 for(const item of model.nodes){
  if(item.parent)assert.ok(byId.has(item.parent),item.id+" parent must exist");
  for(const other of item.related||[])assert.ok(byId.has(other),item.id+" related node must exist");
  assert.ok(item.sources?.length>0&&item.sources.every(s=>s.url.startsWith("https://")));
  assert.ok(item.role&&item.roleEn&&item.limit&&item.limitEn);
  if(item.group==="authority"||item.group==="coordination")assert.equal(item.parent,undefined,item.id+" must not be fictitiously nested under coordinating ministry");
 }
 assert.match(page,/food-governance-hierarchy\.js/);
 assert.match(page,/food-governance-hierarchy\.css/);
 assert.match(page,/id="faOrgGraph" class="fa-governance-map"/);
 assert.match(main,/SLIFoodGovernance\.render/);
 assert.match(js,/fa-gvn-workspace/);
 assert.match(js,/fa-gvn-tabs/);
 assert.match(js,/networkGraph/);
 assert.match(js,/profile\(inspector,db\)/);
 assert.match(js,/fa-gvn-related/);
 assert.match(js,/fetch\("\.\/data\/food-governance-hierarchy\.json"/);
 assert.match(style,/fa-gvn-tiles/);
 assert.match(style,/fa-gvn-plot/);
 assert.match(style,/fa-gvn-inspector/);
});

test("Food functional intelligence matches the Oil & Gas six-group navigation model",()=>{
 const registry=JSON.parse(read("data/food-governance-hierarchy.json"));
 const script=read("js/food-governance-hierarchy.js");
 const css=read("css/food-governance-hierarchy.css");
 const page=read("food-agriculture-intelligence.html");
 const groups=[
 ["policy",["pres","kemenkopangan","bappenas","kemenkoekon"]],
 ["production",["kementan","wamentan-2026","wamentan-alim-2026","setjen-kementan","itjen-kementan","ditjen-tp","ditjen-horti","ditjen-psp","ditjen-psp-2026","kementan-ditjen-lahan","kementan-ditjen-bun","kementan-ditjen-pkh","kementan-brmp","kementan-bppsdmp","pusdatin","kkp","pemda"]],
 ["security",["bapanas","bgn","kemendag","bpom"]],
 ["enterprise",["bulog","pupuk","idfood"]],
 ["industry",["kemenperin","wamenperin-2026","kemendagri"]],
 ["evidence",["bps","bi","dpr","bpk"]]
 ];
 assert.equal(groups.length,6);
 const all=groups.flatMap(g=>g[1]);assert.equal(all.length,35);
 assert.equal(new Set(all).size,all.length);
 assert.deepEqual([...all].sort(),registry.nodes.map(n=>n.id).sort(),"Every curated institution must be placed once in the functional diagram");
 for(const [key,ids]of groups){
   assert.match(script,new RegExp('id:"'+key+'"'));
   for(const id of ids)assert.ok(script.includes('"'+id+'"'),"Missing functional node "+id);
 }
 for(const issue of ["rice","fertilizer","inflation","imports","nutrition","regional"])assert.match(script,new RegExp('id:"'+issue+'"'));
 assert.match(script,/getData:\(\)=>/,"Universal export must register verified records, not guessed numeric data");
 assert.match(script,/SLIVisualExport\.register/);
 assert.match(script,/role:"button"/);
 assert.match(script,/keydown/);
 assert.match(script,/aria-pressed/);
 assert.match(script,/fa-gvn-issue-panel/);
 assert.match(script,/source-dated/i);
 assert.match(css,/grid-template-columns:minmax\(0,1\.64fr\)/);
 assert.match(page,/two-wamentan1/,"Cache bust must deliver both October 2026 Deputy Agriculture offices");
 assert.doesNotMatch(script,/new Function|eval\(/,"Do not dynamically evaluate untrusted source data");
});


test("Food dual visualization contract: original card hierarchy and six-hub network coexist independently",()=>{
 const html=read("food-agriculture-intelligence.html");
 const main=read("js/food-agriculture-intelligence.js");
 const tree=read("js/food-governance-tree.js");
 const treeStyle=read("css/food-governance-tree.css");
 const network=read("js/food-governance-hierarchy.js");
 const source=JSON.parse(read("data/food-governance-hierarchy.json"));
 const times=(content,phrase)=>content.split(phrase).length-1;
 for(const id of ["fa-hierarchy","fa-network","faOrgHierarchy","faOrgHierarchyInspector","faOrgHierarchyDetail","faOrgGraph","faOrgInspector","faOrgDetail"])
   assert.equal(times(html,'id="'+id+'"'),1,"Each component must have one unique independent DOM mount: "+id);
 assert.ok(html.indexOf('id="fa-hierarchy"')<html.indexOf('id="fa-network"'),"Keep original card hierarchy first and six-hub network next");
 assert.match(html,/href="#fa-hierarchy"/);
 assert.match(html,/href="#fa-network"/);
 assert.match(html,/js\/food-governance-tree\.js\?v=20261020-[a-z0-9-]+/);
 assert.match(html,/css\/food-governance-tree\.css\?v=20261020-[a-z0-9-]+/);
 assert.match(html,/js\/food-governance-hierarchy\.js\?v=20261020-[a-z0-9-]+/);
 assert.match(main,/SLIFoodGovernance\.render\(\)/);
 assert.match(main,/SLIFoodGovernanceHierarchy\.render\(\)/);
 assert.match(tree,/window\.SLIFoodGovernanceHierarchy=\{render/);
 assert.match(tree,/const root=\$\("faOrgHierarchy"\),detail=\$\("faOrgHierarchyDetail"\)/);
 assert.match(tree,/fa-gov-branches/);
 assert.match(tree,/fa-gov-children/);
 assert.match(tree,/drawInspector/);
 assert.match(tree,/fa-gov-search/);
 assert.match(tree,/fa-gov-filter/);
 assert.match(network,/window\.SLIFoodGovernance=\{render/);
 assert.match(network,/networkGraph/);
 assert.match(network,/fa-gvn-tabs/);
 assert.match(network,/fa-gvn-issue-panel/);
 assert.match(treeStyle,/#fa-governance \.fa-tree-layout\{display:grid/);
 assert.match(treeStyle,/#faOrgHierarchyInspector\{display:block/);
 assert.ok(!treeStyle.includes("#faOrgInspector"),"Tree style must not alter the network inspector");
 assert.ok(!tree.includes('window.SLIFoodGovernance={'),"Tree must not replace network renderer");
 assert.ok(!network.includes('window.SLIFoodGovernanceHierarchy={'),"Network must not replace tree renderer");
 assert.match(tree,/food-governance-hierarchy\.json/);
 assert.match(network,/food-governance-hierarchy\.json/);
 assert.equal(source.nodes.length,35);
 assert.ok(source.nodes.find(n=>n.id==="pusdatin"&&n.parent==="kementan"));
});
