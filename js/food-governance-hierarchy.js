/* SLI Food & Agriculture Institutional Network v3
 * Same six-hub interactive network pattern as Oil & Gas stakeholder explorer.
 * Source: reviewed food-governance-hierarchy.json. Lines are FUNCTIONAL, never a claim of reporting.
 */
(()=>{"use strict";
const NS="http://www.w3.org/2000/svg",ROOT="faOrgGraph",PANEL="faOrgInspector",DETAIL="faOrgDetail";
const E=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const SVG=(tag,attrs={},value)=>{const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(value!==undefined)n.textContent=String(value);return n};
const en=()=>document.documentElement.lang?.toLowerCase().startsWith("en");
const T=(id,english)=>en()?english:id;
const state={group:"all",issue:"all",query:"",selected:"bapanas"};
let cache=null,renderSequence=0;
const groups=[
 {id:"policy",color:"#d9bf89",idName:"Arahan nasional, koordinasi & perencanaan",enName:"National strategy, coordination & planning",ids:["pres","kemenkopangan","bappenas","kemenkoekon"]},
 {id:"production",color:"#7ebcd0",idName:"Produksi pertanian, perikanan & pelaksana daerah",enName:"Agriculture, fisheries & regional delivery",ids:["kementan","wamentan-2026","setjen-kementan","itjen-kementan","ditjen-tp","ditjen-horti","ditjen-psp","ditjen-psp-2026","pusdatin","kkp","pemda"]},
 {id:"security",color:"#8ac7b2",idName:"Ketahanan pangan, gizi & tata niaga",enName:"Food security, nutrition & trade rules",ids:["bapanas","bgn","kemendag","bpom"]},
 {id:"enterprise",color:"#c4aed7",idName:"Operator BUMN & rantai pasok",enName:"State food and farm-input operators",ids:["bulog","pupuk","idfood"]},
 {id:"industry",color:"#d4a78b",idName:"Industri pangan & pembinaan daerah",enName:"Food industry & regional governance",ids:["kemenperin","wamenperin-2026","kemendagri"]},
 {id:"evidence",color:"#96bcd8",idName:"Statistik, moneter & pengawasan publik",enName:"Statistics, monetary context & oversight",ids:["bps","bi","dpr","bpk"]}
];
const issues=[
 {id:"rice",idName:"Cadangan beras pemerintah & stabilisasi harga",enName:"Government rice reserves & price stabilization",route:["policy","production","security","enterprise","evidence"],
  stepsId:["Kemenko Pangan mengoordinasikan persoalan lintas lembaga; Bapanas menangani kebijakan cadangan dan stabilisasi sesuai mandat.","Kementan menangani sisi produksi; Perum BULOG menjalankan pengadaan, penyimpanan dan penyaluran berdasarkan penugasan.","BPS menyediakan indikator resmi produksi/harga; data tidak membuktikan garis komando kementerian terhadap BULOG."],
  stepsEn:["Food coordination and Bapanas address interagency policy, government food reserves and stabilization within their respective mandates.","Agriculture handles production; BULOG undertakes assigned procurement, storage and distribution.","BPS provides official statistics; those data do not establish a ministry's administrative command over BULOG."],
  actors:["kemenkopangan","bapanas","kementan","bulog","bps"]},
 {id:"fertilizer",idName:"Subsidi pupuk, distribusi & produksi pertanian",enName:"Fertilizer subsidy, delivery & agricultural output",route:["policy","production","enterprise","evidence"],
  stepsId:["Kebijakan dan alokasi subsidi tidak identik dengan kegiatan operasional perusahaan pupuk.","Kementan dan unit terkait menangani kebijakan input pertanian sesuai ketentuan; Pupuk Indonesia beroperasi sebagai pemasok BUMN.","Statistik dan pelaksanaan daerah perlu dibandingkan dengan data penyaluran nyata serta sumber pemerintah terbaru."],
  stepsEn:["Subsidy allocations are public policy, separate from a fertilizer company's operating decisions.","Agriculture manages relevant farm-input policy; Pupuk Indonesia operates as an SOE supplier.","Regional delivery and official statistics require comparison with actual government distribution records."],
  actors:["kementan","ditjen-psp","pupuk","pemda","bps"]},
 {id:"inflation",idName:"Inflasi pangan dan pengendalian harga",enName:"Food inflation and price control",route:["policy","security","enterprise","evidence","industry"],
  stepsId:["BPS mengukur inflasi secara statistik; Bank Indonesia mengelola instrumen moneter dan koordinasi pengendalian inflasi.","Bapanas menangani aspek stabilisasi pangan; Kemendag berwenang di ranah perdagangan.","BULOG dapat menjalankan penugasan distribusi tertentu; kewenangan masing-masing tidak boleh disamakan."],
  stepsEn:["BPS measures inflation; Bank Indonesia handles monetary policy and coordinated inflation responses.","Bapanas handles food stabilization within its remit; Trade handles commerce policy.","BULOG may execute specific distribution mandates. These are separate statutory and operational roles."],
  actors:["bps","bi","bapanas","kemendag","bulog","kemenkoekon"]},
 {id:"imports",idName:"Impor, ekspor & perdagangan komoditas pangan",enName:"Food imports, exports & commodity trade",route:["policy","production","security","industry","evidence"],
  stepsId:["Kementan dan KKP bertanggung jawab atas subsektor produksi masing-masing; Bapanas menyediakan perspektif kebutuhan dan pasokan pangan.","Kemendag menjalankan kebijakan perdagangan dan tata niaga sesuai lingkup hukumnya.","BPS menerbitkan statistik perdagangan; volume ekspor/impor harus dibedakan dari persetujuan kebijakan dan realisasi lapangan."],
  stepsEn:["Agriculture and Fisheries govern their production subsectors; Bapanas addresses national food availability.","Trade exercises relevant cross-border and distribution policy authority.","BPS publishes trade statistics. Volumes differ from import authorizations and implementation."],
  actors:["kemendag","bapanas","kementan","kkp","bps"]},
 {id:"nutrition",idName:"Program pemenuhan gizi & rantai pasok makanan",enName:"Nutrition programmes & food supply chain",route:["policy","security","enterprise","production","evidence"],
  stepsId:["BGN menangani program gizi; Bapanas dan Kementan memiliki mandat berbeda atas pasokan pangan serta produksi.","Operasional pengadaan/layanan dan standar keamanan pangan harus mengacu pada ketentuan program dan otoritas yang berwenang.","Data keberhasilan, audit dan pelaksanaan daerah harus dipisah dari pengumuman program."],
  stepsEn:["BGN runs nutrition programmes; Bapanas and Agriculture have distinct food-supply and production responsibilities.","Programme procurement, services and food safety follow their respective legal frameworks.","Implementation outcomes, audit findings and regional delivery must be distinguished from announcements."],
  actors:["bgn","bapanas","kementan","bpom","pemda","bpk"]},
 {id:"regional",idName:"Pangan daerah, produksi & kewenangan otonomi",enName:"Regional food policy & decentralized authority",route:["policy","production","industry","evidence"],
  stepsId:["Pemerintah daerah menjalankan kewenangan otonomi sesuai pembagian urusan; bukan unit kerja Kemendagri.","Kemendagri melakukan pembinaan penyelenggaraan pemerintahan daerah; Kementan memberikan kebijakan/pembinaan teknis bidang pertanian.","Data BPS dan Pusdatin harus disandingkan dengan laporan pemerintah daerah yang sebanding periode dan metodologinya."],
  stepsEn:["Local governments execute their statutory autonomous responsibilities; they are not divisions of Home Affairs.","Home Affairs guides regional governance; Agriculture leads relevant sectoral technical guidance.","Regional results should be reconciled with BPS/Pusdatin data using comparable periods and methodology."],
  actors:["pemda","kemendagri","kementan","pusdatin","bps"]}
];
const edges=[["policy","production"],["policy","security"],["policy","industry"],["production","security"],["production","enterprise"],["security","enterprise"],["security","evidence"],["industry","production"],["industry","enterprise"],["production","evidence"]];
const label=g=>en()?g.enName:g.idName;
const issueName=i=>en()?i.enName:i.idName;
const groupOf=id=>groups.find(g=>g.ids.includes(id));
function A(url,title){if(!/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(url||""))return E("span",null,T("Tautan belum diverifikasi","Link not verified"));
 const x=E("a",null,title);x.href=url;x.target="_blank";x.rel="noopener noreferrer";return x}
function button(value,cls,fn){const b=E("button",cls,value);b.type="button";b.addEventListener("click",fn);return b}
function matching(db){
 const query=state.query.trim().toLocaleLowerCase(),issue=issues.find(x=>x.id===state.issue);
 const allowed=issue?new Set(issue.actors):null;
 return db.nodes.filter(a=>(state.group==="all"||groupOf(a.id)?.id===state.group)&&(!allowed||allowed.has(a.id))&&
 (!query||[a.name,a.en,a.id,a.kind,a.kindEn,a.role,a.roleEn,a.person].join(" ").toLocaleLowerCase().includes(query)));
}
function wrap(svgText,x,width=30){const arr=svgText.split(/\s+/),lines=[""];for(const part of arr){const i=lines.length-1;if((lines[i]+" "+part).trim().length>width&&lines.length<3)lines.push(part);else lines[i]+=(lines[i]?" ":"")+part}return lines}
function networkGraph(container,db,selectGroup,visible){
 const graph=E("div","fa-gvn-plot");graph.setAttribute("data-sli-visual","");
 graph.id="faGovGraphPlot";
 const heading=E("div","fa-gvn-plot-header");
 heading.append(E("strong",null,T("Hubungan fungsional · klik simpul","Functional accountability · select a node")),
   E("span",null,T("Bukan hierarki pelaporan universal","Not a universal reporting hierarchy")));
 graph.append(heading);
 const svg=SVG("svg",{viewBox:"0 0 960 406",role:"img","aria-label":T("Jaringan enam kelompok kelembagaan pangan","Six-group food governance relationship network")});
 svg.append(SVG("title",{},T("Jaringan hubungan fungsional kelembagaan pangan","Food sector functional relationship network")));
 svg.append(SVG("rect",{x:0,y:0,width:960,height:406,rx:14,fill:"#0b2234"}));
 const xy=[[162,112],[480,112],[798,112],[162,302],[480,302],[798,302]];
 const coords=Object.fromEntries(groups.map((g,i)=>[g.id,xy[i]]));
 const issue=issues.find(i=>i.id===state.issue);
 const activeGroups=new Set(visible.map(n=>groupOf(n.id)?.id));
 for(const [a,b]of edges){const u=coords[a],v=coords[b],inPath=issue&&issue.route.includes(a)&&issue.route.includes(b);
  const path=SVG("path",{d:"M "+u[0]+" "+u[1]+" Q 480 208 "+v[0]+" "+v[1],stroke:inPath?"#d8be84":"#54748a","stroke-width":inPath?2.7:1.25,opacity:issue&&!inPath?".16":".55",fill:"none","stroke-dasharray":a==="industry"?"5 5":""});svg.append(path)}
 groups.forEach((g,i)=>{
  const [x,y]=xy[i],active=state.group===g.id||issue?.route.includes(g.id)||activeGroups.has(g.id)&&!!state.query;
  const group=SVG("g",{role:"button",tabindex:"0","aria-pressed":String(state.group===g.id),"aria-label":label(g)});group.style.cursor="pointer";
  group.append(SVG("rect",{x:x-146,y:y-61,width:292,height:122,rx:12,fill:active?"#21435a":"#172e43",stroke:g.color,"stroke-width":active?2.7:1.4,opacity:issue&&!issue.route.includes(g.id)?".35":"1"}));
  group.append(SVG("rect",{x:x-125,y:y-37,width:6,height:74,rx:3,fill:g.color}));
  const lines=wrap(label(g),null,en()?31:33);
  lines.forEach((s,k)=>group.append(SVG("text",{x:x-108,y:y-27+k*18,fill:"#f3f6f9","font-size":lines.length>2?12:13,"font-family":"system-ui","font-weight":k?520:680},s)));
  group.append(SVG("text",{x:x-108,y:y+43,fill:g.color,"font-size":11,"font-family":"system-ui"},g.ids.length+" "+T("entitas","entities")));
  group.append(SVG("title",{},label(g)));
  group.addEventListener("click",()=>selectGroup(g.id));group.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectGroup(g.id)}});
  svg.append(group)
 });
 graph.append(svg,E("p","fa-gvn-hint",T("Garis menunjukkan keterkaitan koordinasi, operasional, distribusi, data dan pengawasan; tidak menunjukkan kepemilikan perusahaan atau hubungan atasan langsung.","Links indicate coordination, operations, distribution, evidence or oversight, not corporate ownership or a direct reporting relationship.")));
 container.append(graph);
 const exp=window.SLIVisualExport;
 if(exp?.register){
  exp.register(graph,{getData:()=>({headers:["ID","Lembaga","Nama Inggris","Kelompok","Mandat","Batas kewenangan","Pimpinan","Tanggal konfirmasi","Sumber"],rows:db.nodes.map(n=>[n.id,n.name,n.en,groupOf(n.id)?.id||"",n.role,n.limit,n.confirmed?n.person||"": "",n.confirmed||"",n.sources?.[0]?.url||""]),kind:"source-dated-registry"}),
   getMeta:()=>({title:T("Hubungan kelembagaan pangan dan pertanian","Food & Agriculture Institutional Network"),source:"SLI Food governance institution register (official institution links in profile)",period:db.as_of,sourceUrl:"https://badanpangan.go.id/",completeness:T("Registri 24 lembaga; hubungan fungsional, bukan pelaporan resmi","24 institutions; functional network not official reporting chart")})});
 }else document.addEventListener("sli:exportready",()=>{if(graph.isConnected&&window.SLIVisualExport?.register)window.SLIVisualExport.register(graph,{getData:()=>({headers:["ID","Institution","Group","Mandate","Source"],rows:db.nodes.map(n=>[n.id,n.name,groupOf(n.id)?.id||"",n.role,n.sources?.[0]?.url||""])}),getMeta:()=>({title:"SLI Food Governance Network",period:db.as_of,source:"Official institutional sources"})})},{once:true});
}
function profile(panel,db){
 const target=panel.querySelector("#"+DETAIL)||panel;
 target.replaceChildren();
 const item=db.nodes.find(n=>n.id===state.selected);
 if(!item){target.append(E("p",null,T("Pilih satu lembaga untuk melihat mandat dan sumbernya.","Select an institution to inspect its mandate and sources.")));return}
 const g=groupOf(item.id);
 target.append(E("span","fa-gvn-overline",g?label(g):""));
 const visual=E("div","fa-gvn-actor-name");if(window.SLIEntityIdentity?.brand)visual.append(window.SLIEntityIdentity.brand(item.name,"government"));
 visual.append(E("h3",null,T(item.name,item.en)));target.append(visual);
 if(item.person&&item.confirmed){target.append(E("p","fa-gvn-leader",item.person+" · "+T("Pejabat","Officeholder")),
   E("p","fa-gvn-stamp",T("Konfirmasi resmi: ","Official reference: ")+item.confirmed))}
 else target.append(E("p","fa-gvn-stamp",T("Nama pimpinan belum terkonfirmasi oleh dokumen resmi bertanggal dalam registri.","No dated primary-source officeholder confirmation is stored.")));
 target.append(E("p","fa-gvn-mandate",T(item.role,item.roleEn)));
 target.append(E("span","fa-gvn-role-badge",T(item.kind,item.kindEn)));
 const dl=E("dl","fa-gvn-profile-lines");
 const kv=(k,v)=>{dl.append(E("dt",null,k),E("dd",null,v))};
 kv(T("Periode sumber","Source snapshot"),db.as_of);
 kv(T("Hubungan","Relationship"),item.parent?T("Unit/titik asosiasi: ","Unit/associated entity: ")+(db.nodes.find(n=>n.id===item.parent)?.name||item.parent):T("Jalur fungsi","Functional lane"));
 target.append(dl);
 target.append(E("h4",null,T("Mandat dan batas kewenangan","Authority boundary")),E("p","fa-gvn-boundary",T(item.limit,item.limitEn)));
 if(item.relation)target.append(E("p","fa-gvn-boundary",T(item.relation,item.relationEn)));
 if(item.related?.length){
  target.append(E("h4",null,T("Tautan lembaga terkait","Related institution links")));
  const related=E("div","fa-gvn-related");
  item.related.forEach(id=>{const x=db.nodes.find(n=>n.id===id);if(x)related.append(button(T(x.name,x.en)+" ↗","fa-gvn-related-btn",()=>{state.group="all";state.issue="all";state.query="";state.selected=id;window.SLIFoodGovernance.render()}))});
  target.append(related);
 }
 const cross=E("div","fa-gvn-crosslinks");
 for(const [idText,enText,href]of [["Berita pangan ↗","Food news ↗","./sli-sector-news.html?sector=food"],["Regulasi pangan ↗","Food regulations ↗","./policy-regulatory-intelligence.html"],["Research AI ↗","Research AI ↗","./sli-research-ai.html?prompt="+encodeURIComponent(T("Bandingkan mandat "+item.name+" dengan statistik pangan resmi, kebijakan dan berita teratribusi.","Compare the mandate of "+item.en+" against official food statistics, policies and attributed news."))]]){
  const a=E("a",null,T(idText,enText));a.href=href;cross.append(a);
 }
 target.append(E("h4",null,T("Hubungkan analisis SLI","Linked SLI analysis")),cross,E("h4",null,T("Rujukan dan bukti primer","Primary institutional references")));
 const refs=E("div","fa-gvn-sources");
 (item.sources||[]).forEach((s,i)=>refs.append(A(s.url,(s.label||T("Dokumen resmi","Official document"))+" ↗")));
 if(item.leaderSource)refs.append(A(item.leaderSource,T("Sumber pimpinan bertanggal ↗","Dated officeholder source ↗")));
 target.append(refs);
 target.append(E("p","fa-gvn-caution",T("Sumber bertanggal, bukan konfirmasi status real-time. Kedekatan pada peta tidak berarti subordinasi administratif atau kepemilikan.","Source-dated, not a real-time officeholder registry. Diagram proximity does not establish administrative subordination or ownership.")));
}
function draw(root,inspector,db){
 const map=new Map(db.nodes.map(n=>[n.id,n]));
 root.replaceChildren();root.classList.add("fa-gvn-root");
 const detail=E("details","fa-gvn-context");
 detail.append(E("summary",null,T("Memahami koordinasi pangan, kewenangan produksi, penugasan BUMN dan pemerintahan daerah","Understanding food governance, production, SOE assignments and regional autonomy")));
 const body=E("div","fa-gvn-context-copy");
 [T("Kemenko Pangan berperan mengoordinasikan kebijakan. Kementan, Bapanas, Kemendag, BGN dan KKP tidak otomatis menjadi satu hierarki administratif.","Food coordination does not make Agriculture, Bapanas, Trade, Nutrition and Fisheries one statutory reporting hierarchy."),
  T("Perum BULOG, Pupuk Indonesia dan ID FOOD adalah operator BUMN. Penugasan, regulasi dan kepemilikan perusahaan harus dibedakan.","BULOG, Pupuk Indonesia and ID FOOD are SOE operators. Assignments, regulations and ownership rights are different."),
  T("Pemerintah daerah menjalankan urusan otonomi, sementara BPS, BI, DPR dan BPK memiliki fungsi statistik, moneter, legislatif dan audit yang berbeda.","Regional government has decentralized authority. BPS, BI, DPR and BPK have distinct statistical, monetary, legislative and audit functions.")].forEach(s=>body.append(E("p",null,s)));
 detail.append(body);root.append(detail);
 const controls=E("div","fa-gvn-controls");
 const searchL=E("label","fa-gvn-field");searchL.append(E("span",null,T("Cari lembaga, unit, atau pejabat","Find an institution, unit or officeholder")));
 const input=E("input","fa-gvn-search");input.type="search";input.value=state.query;input.placeholder=T("Kementan, Bapanas, BULOG, BGN…","Agriculture, Bapanas, BULOG, BGN…");searchL.append(input);
 const issueL=E("label","fa-gvn-field");issueL.append(E("span",null,T("Telusuri satu persoalan pangan","Trace a specific food policy issue")));
 const issueSel=E("select","fa-gvn-issue");
 [{id:"all",idName:"Seluruh tanggung jawab kelembagaan",enName:"All institutional responsibilities"},...issues].forEach(v=>{const opt=E("option",null,issueName(v));opt.value=v.id;issueSel.append(opt)});
 issueSel.value=state.issue;issueL.append(issueSel);controls.append(searchL,issueL);root.append(controls);
 const tabs=E("div","fa-gvn-tabs");const tabButtons=[];
 const selectGroup=id=>{state.group=state.group===id?"all":id;state.issue="all";state.query="";state.selected=groups.find(g=>g.id===state.group)?.ids[0]||state.selected;draw(root,inspector,db)};
 const groupAll=[{id:"all",idName:"Seluruh "+db.nodes.length+" lembaga",enName:"All "+db.nodes.length+" entities"},...groups];
 groupAll.forEach(g=>{const b=button(issueName(g),"fa-gvn-tab"+(state.group===g.id?" active":""),()=>selectGroup(g.id));b.setAttribute("aria-pressed",String(state.group===g.id));tabs.append(b);tabButtons.push(b)});root.append(tabs);
 const workspace=E("div","fa-gvn-workspace");
 const left=E("div","fa-gvn-left");workspace.append(left,inspector);root.append(workspace);
 inspector.classList.add("fa-gvn-inspector");inspector.setAttribute("aria-live","polite");
 if(!inspector.querySelector("#"+DETAIL)){inspector.append(E("div",null,undefined)).lastElementChild.id=DETAIL}
 function redraw(){
  left.replaceChildren();
  const rows=matching(db),picked=rows.find(n=>n.id===state.selected);
  if(!picked)state.selected=rows[0]?.id||null;
  if(!state.query)networkGraph(left,db,selectGroup,rows);
  const issue=issues.find(i=>i.id===state.issue);
  if(issue){
   const focus=E("div","fa-gvn-issue-panel");focus.append(E("h4",null,issueName(issue)));
   const ol=E("ol");(en()?issue.stepsEn:issue.stepsId).forEach(s=>ol.append(E("li",null,s)));focus.append(ol);
   left.append(focus);
  }
  left.append(E("p","fa-gvn-count",rows.length+" "+T("lembaga ditampilkan · klik untuk profil lengkap","entities shown · select an institution")));
  const tiles=E("div","fa-gvn-tiles");
  rows.forEach(n=>{const g=groupOf(n.id),b=button(T(n.name,n.en),"fa-gvn-tile"+(n.id===state.selected?" active":""),()=>{state.selected=n.id;redraw()});
    b.setAttribute("aria-pressed",String(n.id===state.selected));
    const visual=E("span","fa-gvn-entity-row");if(window.SLIEntityIdentity?.brand)visual.append(window.SLIEntityIdentity.brand(n.name,"government"));
    visual.append(E("strong",null,T(n.name,n.en)));b.textContent="";b.append(visual,E("span",null,g?label(g):""));tiles.append(b)});
  left.append(tiles);
  if(rows.length===0)left.append(E("p","fa-gvn-noresults",T("Tidak ditemukan. Hapus kata pencarian atau ubah filter.","Nothing matches. Clear the search or change filters.")));
  profile(inspector,db);
  tabButtons.forEach((b,i)=>{const active=groupAll[i].id===state.group;b.classList.toggle("active",active);b.setAttribute("aria-pressed",String(active))});
 }
 input.addEventListener("input",()=>{state.query=input.value;redraw()});
 issueSel.addEventListener("change",()=>{state.issue=issueSel.value;state.group="all";state.query="";input.value="";redraw()});
 redraw();
 root.append(E("p","fa-gvn-footer",T("Catatan metodologi: peta mencakup 24 simpul lembaga berdasarkan sumber resmi yang ditautkan, diperiksa per 20 Oktober 2026. Hubungan adalah koordinasi fungsional, bukan bagan komando resmi. Periksa regulasi dan perubahan jabatan melalui JDIH dan sumber primer.","Method: 24 source-dated institutions reviewed as of 20 October 2026. Relations show functional coordination, not a statutory command chart. Verify organizational changes and officeholders in official primary sources.")));
}
function render(){
 const root=document.getElementById(ROOT);if(!root)return;
 const inspector=document.getElementById(PANEL);if(!inspector)return;
 const seq=++renderSequence;
 if(!cache)root.replaceChildren(E("p","fa-gvn-loading",T("Memuat jaringan kelembagaan pangan…","Loading the food governance network…")));
 const load=cache?Promise.resolve(cache):fetch("./data/food-governance-hierarchy.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Dataset HTTP "+r.status);return r.json()}).then(db=>{
  if(db.schema!=="sli-food-governance-v2"||!Array.isArray(db.nodes)||db.nodes.length<24||db.nodes.some(n=>!groupOf(n.id)))throw Error("Invalid or unmapped food governance source register");
  cache=db;return db;
 });
 load.then(db=>{if(seq!==renderSequence||!root.isConnected)return;draw(root,inspector,db)})
 .catch(err=>{console.error("[SLI Food Governance Network]",err);if(seq===renderSequence)root.replaceChildren(E("p","fa-error",T("Gagal memuat jaringan. Coba muat ulang dan periksa sumbernya.","Network unavailable. Reload and inspect the source register.")))});
}
window.SLIFoodGovernance={render,version:"3.0",getState:()=>({...state})};
})();