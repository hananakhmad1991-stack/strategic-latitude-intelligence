/* SLI Food governance card hierarchy v2 restored as independent view; functional v3 is preserved separately. */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const isEn=()=>document.documentElement.lang==="en";
const T=(id,en)=>isEn()?en:id;
const E=(tag,cl,txt)=>{const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=String(txt);return x};
let cache=null,latest=0;
const state={selected:"kemenkopangan",q:"",group:"all",expanded:new Set(["kementan","kemendagri"])};
const lanes=[
 {id:"coordination",idTitle:"01 · Arah dan koordinasi nasional",enTitle:"01 · National policy & coordination",idHint:"Koordinator dan perencana tidak otomatis menjadi atasan kementerian teknis.",enHint:"Coordination and planning do not make these bodies statutory superiors of sector ministries."},
 {id:"authority",idTitle:"02 · Kementerian & otoritas sektoral",enTitle:"02 · Sector ministries & authorities",idHint:"Masing-masing lembaga mempertahankan mandat hukumnya; klik kementerian untuk melihat unit di dalamnya.",enHint:"Each institution retains its own legal mandate; expand ministries to inspect internal units."},
 {id:"operator",idTitle:"03 · Operator BUMN dan rantai pasok",enTitle:"03 · SOEs & supply chains",idHint:"Hubungan operasi atau penugasan, bukan subordinasi kepada kementerian sektor.",enHint:"Commercial execution or assignment is not subordination to a sector ministry."},
 {id:"evidence",idTitle:"04 · Statistik, moneter, dan pengawasan",enTitle:"04 · Evidence, monetary system & oversight",idHint:"BPS, BI, BPK dan DPR memiliki status kelembagaan yang berbeda; tidak ditempatkan sebagai unit kementerian.",enHint:"BPS, BI, BPK and DPR have distinct legal statuses; none is a sector-ministry department."}
];
function link(url,label){const a=E("a",null,label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a}
function validDb(db){return db&&db.schema==="sli-food-governance-v2"&&Array.isArray(db.nodes)&&db.nodes.some(x=>x.id==="pres")}
function getData(){if(!cache)cache=fetch("./data/food-governance-hierarchy.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Food governance HTTP "+r.status);return r.json()}).then(d=>{if(!validDb(d))throw Error("Food governance schema mismatch");return d}).catch(e=>{cache=null;throw e});return cache}
function render(){const root=$("faOrgHierarchy"),detail=$("faOrgHierarchyDetail");if(!root||!detail)return;
 const ticket=++latest;root.replaceChildren(E("p","fa-gov-loading",T("Memuat peta kewenangan dan sumber resmi…","Loading official governance graph…")));
 getData().then(db=>{if(ticket!==latest||!root.isConnected)return;draw(root,detail,db)}).catch(err=>{if(ticket!==latest)return;console.error("[SLI Food Governance]",err);root.replaceChildren(E("p","fa-error",T("Peta kelembagaan belum dapat dimuat. Silakan muat ulang atau periksa sumber data.","Governance diagram could not load. Retry or inspect the data source.")))});
}
function draw(root,detail,db){
 const map=new Map(db.nodes.map(n=>[n.id,n]));
 if(!map.has(state.selected))state.selected="kemenkopangan";
 root.replaceChildren();root.classList.add("fa-gov-root");
 const guide=E("div","fa-gov-intro");
 guide.append(E("strong",null,T("Bagan kelembagaan pangan nasional","National food governance structure")),
   E("p",null,T("Alur dibaca dari Presiden → koordinasi & kebijakan sektor → unit pelaksana. Garis ke unit internal menunjukkan organisasi; hubungan koordinasi, penugasan BUMN, dan pembinaan daerah sengaja dipisahkan.","Read from the President to national coordination and sector responsibilities, then internal delivery units. Internal reporting, cross-ministry coordination, SOE assignments and regional guidance remain distinct.")));
 root.append(guide);
 const bar=E("div","fa-gov-tools");
 const find=E("input","fa-gov-search");find.type="search";find.value=state.q;find.placeholder=T("Cari lembaga, unit, pejabat…","Find an agency, office or leader…");find.setAttribute("aria-label",T("Cari institusi pangan","Search food institutions"));
 const select=E("select","fa-gov-filter");select.setAttribute("aria-label",T("Filter jenis lembaga","Filter by institution category"));
 [["all",T("Semua jalur kelembagaan","All institutional lanes")],...lanes.map(l=>[l.id,T(l.idTitle,l.enTitle)])].forEach(([v,s])=>{const o=E("option",null,s);o.value=v;select.append(o)});select.value=state.group;
 const expand=E("button","fa-gov-small-btn",T("Buka unit","Expand units")),collapse=E("button","fa-gov-small-btn",T("Tutup unit","Collapse units"));expand.type=collapse.type="button";
 bar.append(find,select,expand,collapse);root.append(bar);
 const head=E("div","fa-gov-pres");root.append(head);
 const chunks=E("div","fa-gov-branches");root.append(chunks);
 const methodology=E("p","fa-gov-method",T("Bagan fungsional bersumber · revisi: ","Source-dated functional map · reviewed: ")+db.as_of+". "+T("Kementerian tidak otomatis berada di bawah kementerian koordinator. Pemda memiliki otonomi. Nama pejabat bukan data real-time.","Coordinating ministries do not automatically command technical ministries. Regions are autonomous. Officeholders are not verified in real time."));root.append(methodology);
 const match=n=>!state.q||[n.name,n.en,n.kind,n.kindEn,n.person,n.role,n.roleEn].some(x=>String(x||"").toLocaleLowerCase().includes(state.q.toLocaleLowerCase()));
 function actorCard(a,nested){
  const entry=E("div","fa-gov-entry"+(nested?" nested":""));
  const b=E("button","fa-gov-card"+(state.selected===a.id?" chosen":""),undefined);b.type="button";b.setAttribute("aria-pressed",String(state.selected===a.id));
  const status=E("small","fa-gov-kind",T(a.kind,a.kindEn));b.append(status,E("strong",null,T(a.name,a.en)));
  if(a.person&&a.confirmed)b.append(E("span","fa-gov-person",a.person));
  b.append(E("span","fa-gov-caption",a.relation?T(a.relation,a.relationEn):T(a.kind,a.kindEn)));
  b.addEventListener("click",()=>{state.selected=a.id;drawCards();drawInspector()});entry.append(b);
  const children=db.nodes.filter(n=>n.parent===a.id);
  if(children.length&&!state.q){
   const toggle=E("button","fa-gov-toggle",(state.expanded.has(a.id)? "▾ ":"▸ ")+T(children.length+" unit/relasi · lihat",children.length+" units/links · view"));
   toggle.type="button";toggle.setAttribute("aria-expanded",String(state.expanded.has(a.id)));
   toggle.addEventListener("click",()=>{if(state.expanded.has(a.id))state.expanded.delete(a.id);else state.expanded.add(a.id);drawCards()});entry.append(toggle);
   if(state.expanded.has(a.id)){const sub=E("div","fa-gov-children");children.forEach(n=>sub.append(actorCard(n,true)));entry.append(sub)}
  }
  return entry;
 }
 function drawCards(){
  head.replaceChildren();chunks.replaceChildren();
  if(state.group==="all"&&!state.q){head.append(E("div","fa-gov-level",T("LEVEL 0 · ARAH NASIONAL","LEVEL 0 · NATIONAL DIRECTION")));head.append(actorCard(map.get("pres"),false))}
  const filtered=!!state.q||state.group!=="all";let total=0;
  for(const lane of lanes){
   if(state.group!=="all"&&state.group!==lane.id)continue;
   const section=E("section","fa-gov-lane lane-"+lane.id);
   section.append(E("h4",null,T(lane.idTitle,lane.enTitle)),E("p",null,T(lane.idHint,lane.enHint)));
   const cards=E("div","fa-gov-lane-grid");
   const list=db.nodes.filter(n=>(n.group===lane.id&&match(n))||(Boolean(state.q)&&lane.id==="authority"&&n.group==="unit"&&match(n)));
   list.forEach(a=>{if(!filtered&&a.parent)return;cards.append(actorCard(a,false));total++});
   if(!cards.children.length)continue;
   section.append(cards);chunks.append(section);
  }
  if(!total)chunks.append(E("p","fa-gov-empty",T("Tidak ada lembaga yang cocok. Coba kata lain atau kembali ke semua jalur.","No matching institutions. Try another query or select all lanes.")));
 }
 function drawInspector(){
  const actor=map.get(state.selected)||map.get("pres");detail.replaceChildren();
  detail.append(E("h3",null,T(actor.name,actor.en)));
  detail.append(E("p","fa-gov-role",T(actor.role,actor.roleEn)));
  const dl=E("dl");
  function kv(k,v){dl.append(E("dt",null,k),E("dd",null,v))}
  kv(T("Jenis lembaga","Institution type"),T(actor.kind,actor.kindEn));
  kv(T("Posisi peta","Map position"),actor.parent?T("Unit/cakupan di bawah ","Unit/association under ")+T(map.get(actor.parent)?.name||"",map.get(actor.parent)?.en||""):T("Jalur ","Lane ")+(lanes.find(l=>l.id===actor.group)?T(lanes.find(l=>l.id===actor.group).idTitle,lanes.find(l=>l.id===actor.group).enTitle):T("Arah nasional","National direction")));
  kv(T("Tanggal tinjauan","Snapshot date"),db.as_of);detail.append(dl);
  if(actor.person&&actor.confirmed){
   detail.append(E("div","fa-gov-lead-title",T("PIMPINAN · BERDASARKAN SUMBER RESMI","OFFICEHOLDER · OFFICIAL SOURCE")));
   detail.append(E("div","fa-gov-lead",actor.person));
   detail.append(E("p","fa-gov-asof",T("Terakhir dikonfirmasi pada sumber: ","Last confirmed in official source: ")+actor.confirmed));
   if(actor.leaderSource)detail.append(link(actor.leaderSource,T("Verifikasi nama/jabatan ↗","Verify officeholder ↗")));
  }else detail.append(E("p","fa-gov-unverified",T("Nama pejabat tidak ditampilkan tanpa sumber primer bertanggal.","No officeholder shown without a dated primary source.")));
  detail.append(E("h4",null,T("Batas kewenangan","Authority boundary")),E("p",null,T(actor.limit,actor.limitEn)));
  if(actor.relation)detail.append(E("p","fa-gov-relationship",T(actor.relation,actor.relationEn)));
  if(actor.related?.length){
   detail.append(E("h4",null,T("Lembaga terkait (hubungan fungsional)","Related institutions (functional links)")));
   const links=E("div","fa-gov-related");actor.related.forEach(id=>{const to=map.get(id);if(!to)return;const btn=E("button",null,T(to.name,to.en)+" ↗");btn.type="button";btn.addEventListener("click",()=>{state.selected=to.id;drawCards();drawInspector()});links.append(btn)});detail.append(links);
  }
  detail.append(E("h4",null,T("Rujukan primer","Primary references")));
  const sources=E("div","fa-gov-sources");(actor.sources||[]).forEach(s=>sources.append(link(s.url,(s.label||T("Laman lembaga resmi","Official institution page"))+" ↗")));detail.append(sources);
  detail.append(E("p","fa-gov-warning",T("Diagram tidak menggantikan dasar hukum organisasi. Perubahan status dan pejabat diperiksa pada JDIH serta publikasi resmi bertanggal.","This diagram does not override statutory organization law. Verify subsequent changes against official gazettes and dated institutional records.")));
 }
 find.addEventListener("input",()=>{state.q=find.value.trim();drawCards()});
 select.addEventListener("change",()=>{state.group=select.value;drawCards()});
 expand.addEventListener("click",()=>{db.nodes.filter(n=>db.nodes.some(c=>c.parent===n.id)).forEach(n=>state.expanded.add(n.id));drawCards()});
 collapse.addEventListener("click",()=>{state.expanded.clear();drawCards()});
 drawCards();drawInspector();
}
window.SLIFoodGovernanceHierarchy={render,version:"2.0"};
})();
