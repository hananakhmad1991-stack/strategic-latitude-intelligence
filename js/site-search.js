/* Strategic Latitude Intelligence · accessible cross-dashboard source search.
 * Static, locally indexed public records; no remote search server and no user query logging.
 * Search results navigate to the relevant SLI page/section. Source records are a locator,
 * NOT a promise that all records have dedicated detail panels or real-time values.
 */
(function() {
 "use strict";
 const INDEX_URL="data/site-search-index.json?v=20261016-search1";
 const ID="sliGlobalSearchRoot",MAX=11;
 const alias={
  batubara:["coal"],"minyak":["oil","migas"],"migas":["oil","gas"],"nikel":["nickel"],
  "panas":["geothermal"],"bumi":["geothermal"],"surya":["solar","plts"],
  "listrik":["power","electricity","pln"],"pembangkit":["power","generation"],
  "konsumsi":["consumption","demand"],"ekspor":["export","exports"],"impor":["import","imports"],
  "kilang":["refinery"],"provinsi":["province","provincial"],"cadangan":["reserve","reserves"],
  "investasi":["investment","investor"],"harga":["price","tariff"],"pengusaha":["entrepreneur","investor","forbes"],
  "gas":["migas"],"charging":["spklu"],"smelter":["refining","processing"],"peta":["map"],
  "data":["dataset"],"bbm":["fuel"],"ebt":["renewable"],"energi":["energy"],
  "stasiun":["station"],"geothermal":["panas","bumi"],"coal":["batubara"],"nickel":["nikel"],
  "oil":["minyak"],"energy":["energi"],"solar":["surya","plts"],"investment":["investasi"],
  "hydro":["plta"],"ev":["spklu"]
 };
 const norm=x=>String(x||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("en").replace(/[^a-z0-9]+/g," ").trim();
 const collapse=x=>norm(x).replace(/\s+/g," ");
 const lookup=(entry)=>{
  const title=collapse(entry.title),subtitle=collapse(entry.description||""),key=collapse(entry.keywords||""),
   page=collapse(entry.page||"");
  return {title,subtitle,key,page,all:[title,subtitle,key,page].join(" ")};
 };
 const passes=(entry,query)=>{
  const hay=entry._tokens||lookup(entry);const tokens=norm(query).split(/\s+/).filter(Boolean);
  if(tokens.length===0)return 0;
  let score=0;
  for(const token of tokens){
   const variants=[token,...(alias[token]||[])];
   const used=variants.find(v=>hay.all.includes(v));
   if(!used)return 0;
   if(hay.title===used)score+=38;
   else if(hay.title.startsWith(used))score+=20;
   else if(hay.title.includes(used))score+=12;
   else if(hay.subtitle.includes(used))score+=5;
   else if(hay.key.includes(used))score+=3;
   else score+=1;
  }
  if(hay.title.includes(norm(query)))score+=14;
  if(entry.kind==="section")score+=3;
  if(entry.kind==="dashboard")score+=6;
  return score;
 };
 const rank=(items,q,page,scope="all",limit=MAX)=>{
  const found=[];
  for(const item of items){
   if(scope==="page"&&item.page!==page)continue;
   const value=passes(item,q);if(value>0)found.push({entry:item,score:value+(item.page===page?2:0)});
  }
  found.sort((a,b)=>b.score-a.score||a.entry.title.localeCompare(b.entry.title));
  return found.slice(0,limit).map(x=>x.entry);
 };
 function init(options){
  const root=document.getElementById(ID);if(!root||root.dataset.ready==="true")return;
  const getPage=options?.getPage||(()=> "overview"),navigate=options?.navigate||(()=>{});
  root.dataset.ready="true";
  root.setAttribute("role","search");root.setAttribute("aria-label","Strategic Latitude Intelligence site search");
  root.replaceChildren();
  const shell=document.createElement("div");shell.className="sli-search-input-wrap";
  const icon=document.createElement("span");icon.className="sli-search-magnifier";icon.setAttribute("aria-hidden","true");icon.textContent="⌕";
  const input=document.createElement("input");input.id="sliGlobalSearchInput";input.type="search";input.className="sli-search-input";
  input.autocomplete="off";input.spellcheck=false;input.setAttribute("role","combobox");
  input.setAttribute("aria-autocomplete","list");input.setAttribute("aria-controls","sliGlobalSearchResults");
  input.setAttribute("aria-expanded","false");input.setAttribute("aria-haspopup","listbox");
  const keys=document.createElement("kbd");keys.className="sli-search-shortcut";keys.textContent="Ctrl K";
  shell.append(icon,input,keys);
  const pop=document.createElement("div");pop.id="sliGlobalSearchResults";pop.className="sli-search-popover";pop.setAttribute("role","listbox");
  pop.hidden=true;const controls=document.createElement("div");controls.className="sli-search-controls";
  const scope=document.createElement("select");scope.className="sli-search-scope";
  scope.setAttribute("aria-label","Search scope");
  for(const [v,l] of [["all","All dashboards"],["page","This dashboard"]]){const o=document.createElement("option");o.value=v;o.textContent=l;scope.append(o)}
  const count=document.createElement("span");count.className="sli-search-count";
  controls.append(scope,count);
  const list=document.createElement("div");list.className="sli-search-list";
  const footer=document.createElement("p");footer.className="sli-search-footer";
  pop.append(controls,list,footer);root.append(shell,pop);
  let open=false,data=[],loading=null,results=[],active=-1,requested=0;
  const lang=()=>window.SLIi18n?.language||document.documentElement.lang||"en";
  const id=()=>lang()==="id";
  function labels(){
   input.placeholder=id()?"Cari data, proyek, lokasi, indikator…":"Search data, projects, places, indicators…";
   input.setAttribute("aria-label",id()?"Cari di semua dashboard SLI":"Search every SLI dashboard");
   keys.textContent="Ctrl K";
   scope.options[0].textContent=id()?"Semua dashboard":"All dashboards";
   scope.options[1].textContent=id()?"Dashboard ini":"This dashboard";
  }
  function show(){
   if(open)return;open=true;pop.hidden=false;input.setAttribute("aria-expanded","true");root.classList.add("sli-search-open");
  }
  function close(){
   if(!open)return;open=false;pop.hidden=true;root.classList.remove("sli-search-open");
   input.setAttribute("aria-expanded","false");input.removeAttribute("aria-activedescendant");active=-1;
  }
  function pages(){
   const nav=[...document.querySelectorAll("#nav button[data-page]")];
   return nav.map((el,i)=>({id:"sli-live-page-"+i,title:(el.textContent||"").replace(/^[^a-zA-Z0-9]+/,"").trim(),
    description:el.dataset.page+" · "+(el.title||""),page:el.dataset.page,anchor:"",kind:"dashboard",keywords:""}));
  }
  function currentHeadings(){
   const host=document.getElementById("content");if(!host)return[];
   const result=[];let i=0;
   for(const el of host.querySelectorAll("h2,h3,h4,[data-search-title]")){
    if(i++>220)break;
    const t=(el.getAttribute("data-search-title")||el.textContent||"").replace(/\s+/g," ").trim();
    if(t.length<3||t.length>165)continue;
    const relevant=el.closest('[id]'),anchor=relevant?.id&&relevant.id!=="content"?relevant.id:"";
    result.push({id:"sli-live-heading-"+i,title:t,description:(id()?"Bagian dashboard ini":"Section on this dashboard"),page:getPage(),anchor,kind:"section",keywords:""});
   }
   return result;
  }
  function createResult(item,i){
   const b=document.createElement("button");b.type="button";b.className="sli-search-result";b.id="sliSearchOption"+i;b.dataset.index=String(i);b.setAttribute("role","option");b.setAttribute("aria-selected",String(i===active));
   const meta=document.createElement("span");meta.className="sli-search-result-meta";
   const labels={dashboard:id()?"DASHBOARD":"DASHBOARD",section:id()?"BAGIAN":"SECTION",record:id()?"DATA SUMBER":"SOURCE RECORD",indicator:id()?"INDIKATOR":"INDICATOR",topic:id()?"TOPIK":"TOPIC"};
   const type=document.createElement("span");type.textContent=labels[item.kind]||"RESULT";
   const where=document.createElement("span");where.textContent="· "+(data.pages?.find(p=>p.id===item.page)?.label||item.page);
   meta.append(type,where);
   const title=document.createElement("strong");title.textContent=item.title;
   const desc=document.createElement("span");desc.className="sli-search-result-description";desc.textContent=item.description||"";
   b.append(meta,title,desc);b.addEventListener("click",()=>selectItem(item));return b;
  }
  function update(){
   if(!open)return;
   const q=input.value.trim();list.replaceChildren();
   if(q.length<2){
    results=[];active=-1;count.textContent="";
    const msg=document.createElement("p");msg.className="sli-search-empty";
    msg.textContent=id()?"Tulis minimal 2 karakter. Contoh: SPKLU, Rokan, nikel, PLN, batubara.":"Type 2+ characters. Try SPKLU, Rokan, nickel, PLN or coal.";
    list.append(msg);footer.textContent=id()?"Cari lintas 9 dashboard · sumber publik, bukan data real-time.":"Search across 9 dashboards · sourced records, not live telemetry.";return;
   }
   const candidates=[...data.entries||[],...pages(),...currentHeadings()];
   results=rank(candidates,q,getPage(),scope.value,MAX);
   active=-1;count.textContent=results.length===MAX?(id()?"Hasil teratas":"Top results"):(results.length+" "+(id()?"hasil":"results"));
   if(!results.length){
    const note=document.createElement("p");note.className="sli-search-empty";note.textContent=id()?"Belum ada kecocokan. Coba kata lain atau pilih Semua dashboard.":"No matches. Try another word or All dashboards.";list.append(note);
   }else results.forEach((item,i)=>list.append(createResult(item,i)));
   footer.textContent=loading&&!data.entries?.length?(id()?"Memuat indeks data…":"Loading the public data index…"):id()?"Enter: buka hasil · Esc: tutup · data historis, bukan live.":"Enter: open result · Esc: close · historical data, not live.";
  }
  function setActive(next){
   if(!results.length)return;
   active=(next+results.length)%results.length;
   list.querySelectorAll(".sli-search-result").forEach((b,i)=>{b.classList.toggle("is-active",i===active);b.setAttribute("aria-selected",String(i===active))});
   const focused=results[active];if(!focused)return;
   input.setAttribute("aria-activedescendant","sliSearchOption"+active);
   list.querySelector("#sliSearchOption"+active)?.scrollIntoView({block:"nearest"});
  }
  function preload(){
   if(loading)return loading;
   loading=fetch(INDEX_URL,{cache:"force-cache"}).then(r=>{if(!r.ok)throw Error("Index temporarily unavailable");return r.json()})
    .then(v=>{if(v?.schema!=="sli-search-1"||!Array.isArray(v.entries))throw Error("Invalid public search index");data=v;data.entries.forEach(x=>{x._tokens=lookup(x)});if(open)update();return data})
    .catch(err=>{console.warn("[SLI Search] Site index unavailable, navigation only",err);data={pages:[],entries:[]};if(open)update();return data});
   return loading;
  }
  function goToRecord(item){
   const requestToken=++requested;
   close();input.value="";
   const previous=getPage();const target=item.page;
   if(target&&target!==previous)navigate(target);
   // The page shell is synchronous; many charts load asynchronously. Retry only
   // until the target section and relevant filter exist, without creating GPS or
   // inventing a record-specific deep link where no exact detail panel exists.
   let jumped=false;
   const attempt=(delay)=>{
    setTimeout(()=>{
     if(requestToken!==requested)return;
     const el=item.anchor?document.getElementById(item.anchor):document.getElementById("content");
     if(!el)return;
     if(!jumped){el.scrollIntoView({behavior:delay?"smooth":"auto",block:"start"});jumped=true}
     if(item.komdigi_tab){
      const tab=[...el.querySelectorAll("button.kd25-tab")].find(b=>b.dataset.tab===item.komdigi_tab);
      if(tab&&tab.getAttribute("aria-selected")!=="true")tab.click();
      if(item.komdigi_tab==="regional"&&item.province){
       const provinceBtn=[...el.querySelectorAll("button.kd25-province")].find(b=>(b.textContent||"").includes(item.province));
       provinceBtn?.click();
      }
     }
     if(item.layer){
      const select=el.querySelector("select.he25-atlas-select");
      if(select&&[...select.options].some(o=>o.value===item.layer)){
       if(select.value!==item.layer){select.value=item.layer;select.dispatchEvent(new Event("change",{bubbles:true}))}
       if(item.province){
        const match=[...el.querySelectorAll(".he25-atlas-rank")].find(b=>(b.textContent||"").includes(item.province));
        match?.click();
       }
      }
     }
    },delay);
   };
   [0,140,450,900,1600].forEach(attempt);
  }
  function selectItem(item){goToRecord(item)}
  function begin(){show();labels();preload();update()}
  function onInput(){show();preload();update()}
  input.addEventListener("focus",begin);
  input.addEventListener("input",onInput);
  input.addEventListener("keydown",e=>{
   if(e.key==="Escape"){e.preventDefault();close();input.blur();return}
   if(e.key==="ArrowDown"){e.preventDefault();if(!open)begin();setActive(active+1);return}
   if(e.key==="ArrowUp"){e.preventDefault();if(!open)begin();setActive(active-1);return}
   if(e.key==="Enter"&&results.length){e.preventDefault();selectItem(results[active>=0?active:0])}
  });
  scope.addEventListener("change",update);
  document.addEventListener("keydown",e=>{
   if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();input.focus();input.select();return}
   if(e.key==="/"&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!/input|textarea|select/i.test(document.activeElement?.tagName||"")&&!document.activeElement?.isContentEditable){
    e.preventDefault();input.focus();return
   }
   if(e.key==="Escape"&&open){close();input.blur()}
  });
  document.addEventListener("pointerdown",e=>{if(open&&!root.contains(e.target))close()});
  document.addEventListener("sli:languagechange",()=>{labels();if(open)update()});
  // Page changes may occur from the sidebar while the popover is open.
  document.addEventListener("sli:pagechange",()=>{if(open)update()});
  labels();
  window.SLISearch={open:()=>input.focus(),close,refresh:()=>{loading=null;data={pages:[],entries:[]};return preload()},rank};
 }
 window.initSLISiteSearch=init;
 window.SLISearchMath={normalize:norm,rank,passes};
})();