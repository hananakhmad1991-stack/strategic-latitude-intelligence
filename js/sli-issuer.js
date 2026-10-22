/* Standalone, focused SLI IDX issuer dossier. All internal details use the SAME published
 * issuer and corporate registries as Entity Intelligence. Quote widgets stay inside provider iframe.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
const id=()=>document.documentElement.lang==="id";
const T=(en,bahasa)=>id()?bahasa:en;
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n};
const safe=(url)=>{try{const a=new URL(url);return a.protocol==="https:"&&!a.username&&!a.password?a.href:null}catch{return null}};
const link=(url,txt,external=false)=>{const a=E("a",null,txt);a.href=url;if(external){a.target="_blank";a.rel="noopener noreferrer"}return a};
const member=new Map();
function tickerFrom(locationObject){
 const p=new URLSearchParams(locationObject.search);
 const candidate=p.get("ticker")||p.get("tvwidgetsymbol")||p.get("symbol")||"";
 const normalized=candidate.trim().toUpperCase();
 const raw=normalized.startsWith("IDX:")?normalized.slice(4):normalized;
 return /^[A-Z0-9]{4}$/.test(raw)?raw:null;
}
const typed=(label,value,parent)=>{if(value===null||value===undefined||value==="")return;
 parent.append(E("dt",null,label),E("dd",null,String(value)))};
function sourceLink(parent,url,caption){const path=safe(url);if(path)parent.append(link(path,caption+" ↗",true))}
function tradingview(host,ticker,name){
 const outer=E("div","sli-issuer-tv");
 outer.append(E("h3",null,T("TradingView market quotation · IDX:"+ticker,"Harga saham dari TradingView · IDX:"+ticker)));
 outer.append(E("p","sli-issuer-tv-disclosure",T("Displayed by TradingView independently in its official widget. Data may be delayed. SLI does not copy or relicense any quote.","Ditampilkan langsung oleh widget resmi TradingView. Data bisa tertunda. SLI tidak menyalin atau mendistribusikan ulang harga saham.")));
 const frame=E("div","tradingview-widget-container");
 const mount=E("div","tradingview-widget-container__widget");
 frame.append(mount);
 const footer=E("div","tradingview-widget-copyright");
 footer.append(link("https://www.tradingview.com/symbols/IDX-"+ticker+"/",ticker+" on TradingView ↗",true));
 frame.append(footer);
 const src="https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
 const config={symbols:[[ticker+" · "+name,"IDX:"+ticker+"|1D"]],chartType:"area",lineWidth:2,lineType:0,colorTheme:"dark",isTransparent:true,
  locale:id()?"id":"en",fontFamily:"system-ui",dateRanges:["1d|1","1m|30","3m|60","12m|1D","60m|1W"],autosize:true,width:"100%",height:"100%",
  showSymbolLogo:true,hideMarketStatus:false,changeMode:"price-and-percent"};
 const s=E("script");s.type="text/javascript";s.src=src;s.async=true;s.textContent=JSON.stringify(config);frame.append(s);
 outer.append(frame);host.append(outer);
}

/* Provider-owned historical TradingView widget; issuer code remains the exact IDX ticker
 * already resolved from SLI's source-dated registry. No price data is copied into SLI.
 */
const TV_ADVANCED_CHART="https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
function historicalChartConfig(ticker){
 if(!/^[A-Z0-9]{4}$/.test(ticker))throw Error("Invalid IDX ticker for historical chart");
 return {
  autosize:true,symbol:"IDX:"+ticker,interval:"D",timezone:"Asia/Jakarta",
  theme:"dark",backgroundColor:"#122d41",gridColor:"rgba(101,133,157,0.16)",
  style:"1",locale:id()?"id":"en",hide_side_toolbar:true,
  hide_top_toolbar:false,withdateranges:true,range:"12M",
  allow_symbol_change:false,hide_legend:false,hide_volume:false,
  save_image:false,calendar:false,details:false,hotlist:false,watchlist:[],
  compareSymbols:[],studies:[],support_host:"https://www.tradingview.com"
 };
}
function historicalChart(host,ticker){
 const section=E("section","sli-issuer-history");
 section.append(E("h3",null,T("Historical share price · IDX:"+ticker,"Historis harga saham · IDX:"+ticker)));
 section.append(E("p","sli-issuer-history-intro",T(
  "Interactive daily candlesticks, starting from the past year. Select a different timeframe or date range using the TradingView toolbar.",
  "Grafik candlestick harian interaktif, dengan rentang awal satu tahun. Ubah interval atau rentang historis menggunakan toolbar TradingView."
 )));
 const frame=E("div","sli-issuer-history-frame tradingview-widget-container");
 frame.setAttribute("aria-label",T("Interactive historical chart for IDX:"+ticker,"Grafik historis saham IDX:"+ticker));
 const mount=E("div","tradingview-widget-container__widget");
 frame.append(mount);
 const legal=E("div","tradingview-widget-copyright");
 legal.append(link("https://www.tradingview.com/symbols/IDX-"+ticker+"/",T(ticker+" historical chart by TradingView ↗",ticker+" · grafik historis TradingView ↗"),true));
 frame.append(legal);
 const script=E("script");
 script.src=TV_ADVANCED_CHART;script.type="text/javascript";script.async=true;
 script.textContent=JSON.stringify(historicalChartConfig(ticker));
 frame.append(script);section.append(frame);
 const note=E("p","sli-issuer-history-note",T(
  "Historical prices are displayed and calculated by TradingView. Exchange data may be delayed, adjusted or unavailable for some symbols; this is not a verified SLI financial dataset.",
  "Harga historis ditampilkan dan dihitung langsung oleh TradingView. Data bursa dapat tertunda, disesuaikan, atau tidak tersedia untuk sebagian saham; ini bukan dataset keuangan SLI yang telah diverifikasi."
 ));
 section.append(note);
 host.append(section);
}

function showFinancialEvidence(parent,records){
 const section=E("section","sli-issuer-financial-evidence");
 section.append(E("h2",null,T("Source-linked financial statements","Laporan keuangan bersumber")));
 const r=records.find(x=>x.financial_source_url&&x.financial_period&&x.financial_currency&&["revenue","net_income","total_assets"].some(k=>typeof x[k]==="number"&&Number.isFinite(x[k])));
 if(!r){section.append(E("p","sli-issuer-missing",T("No reconciled financial figures available. N/A is not zero.","Angka keuangan belum direkonsiliasi. N/A bukan nol.")));parent.append(section);return;}
 section.append(E("p",null,T("Period","Periode")+": "+r.financial_period+" · "+r.financial_currency));
 const facts=E("dl","sli-issuer-facts");
 for(const [k,en,ind] of [["revenue","Revenue","Pendapatan"],["net_income","Net income","Laba bersih"],["total_assets","Total assets","Total aset"]]){
 const v=r[k];typed(T(en,ind),typeof v==="number"&&Number.isFinite(v)?v.toLocaleString(id()?"id-ID":"en-US"):"N/A",facts);}
 section.append(facts);sourceLink(section,r.financial_source_url,T("Financial source","Sumber laporan"));
 section.append(E("p","sli-issuer-missing",T("Source-registry units and period; not a live quote. Verify consolidation basis.","Mengikuti satuan dan periode registri; bukan kuotasi pasar. Basis konsolidasi perlu diperiksa.")));
 parent.append(section);
}
/* Evidence-grade investor/actor map. Holdings, country links, people and asset rights
 * are never conflated with verified ultimate beneficial ownership. */
const evidenceId={MEDC:"medc",INCO:"vale",ANTM:"antam",PTBA:"ptba",TLKM:"telkom",BYAN:"byan",AADI:"aadi",ASII:"astra"};
const number=v=>new Intl.NumberFormat(id()?"id-ID":"en-US",{maximumFractionDigits:3}).format(v);
function actorSection(ticker,relations,assets,groupRecords){
 const section=E("section","sli-issuer-actor-map");
 section.append(E("h2",null,T("Actor, ownership & concession intelligence","Pemetaan aktor, kepemilikan & konsesi")));
 section.append(E("p","sli-issuer-notice",T(
   "Ownership means reported direct holdings; nationality and country links are corporate jurisdictions, not a person's citizenship. PSC/IUPK rights are not shares in the issuer. An ultimate beneficial owner is not asserted without individual-level evidence.",
   "Kepemilikan berarti saham langsung yang dilaporkan; negara merujuk keterkaitan badan hukum, bukan kewarganegaraan seseorang. Hak PSC/IUPK bukan saham emiten. Pemilik manfaat akhir tidak ditetapkan tanpa bukti tingkat individu."
  )));
 const profile=(relations.ownership_profiles||[]).find(p=>p.id===evidenceId[ticker]);
 const assetsItem=(assets.records||[]).find(x=>x.ticker===ticker);
 const directorList=groupRecords.filter(r=>r.ticker===ticker).flatMap(r=>r.directors||[]);
 function sub(label){const h=E("h3",null,label);section.append(h);}
 sub(T("Reported shareholders / direct equity","Pemegang saham langsung yang dilaporkan"));
 if(profile){
  section.append(E("p","sli-issuer-actor-meta",T("Reference date: ","Tanggal sumber: ")+profile.reference_date));
  const list=E("div","sli-issuer-actor-list");
  for(const sh of profile.shareholders||[]){
   const item=E("article","sli-issuer-actor-entry");
   item.append(E("strong",null,sh.name),E("span",null,(sh.reported_pct==null?"N/A":number(sh.reported_pct)+"%")+" · "+(
     sh.holder_kind==="person"?T("Disclosed individual shareholder; NOT necessarily ultimate BO","Pemegang saham individu; BELUM tentu pemilik manfaat akhir"):
     sh.holder_kind==="aggregate_not_entity"?T("Shareholder aggregate — not an identifiable person/entity","Agregat pemegang saham — bukan identitas pemilik"):
     T("Reported direct corporate shareholder","Pemegang saham korporasi langsung terlapor")
   )));
   if(profile.source_urls?.[0])sourceLink(item,profile.source_urls[0],T("Original equity disclosure","Bukti saham asli"));
   list.append(item);
  }
  section.append(list);
 }else section.append(E("p","sli-issuer-missing",T("No dated issuer-level shareholding profile has been validated in SLI.","Belum ada profil pemegang saham emiten bertanggal yang tervalidasi di SLI.")));
 sub(T("Public named management / individuals","Nama pengurus atau individu yang tercatat"));
 if(directorList.length){
  const grid=E("div","sli-issuer-actor-list");
  for(const p of directorList){
   if(!p?.name||!safe(p.source_url))continue;
   const item=E("article","sli-issuer-actor-entry");
   item.append(E("strong",null,p.name),E("span",null,p.title_id+" · "+p.source_date));
   sourceLink(item,p.source_url,T("Dated appointment source","Bukti jabatan bertanggal"));
   grid.append(item);
  }
  section.append(grid);
 }else section.append(E("p","sli-issuer-missing",T("No verified current officer roster for this ticker. Names in shareholder disclosures do not prove management roles.","Susunan pejabat perusahaan terkini belum diverifikasi. Nama pemegang saham tidak otomatis merupakan pengurus.")));
 sub(T("Country / foreign corporate connections","Keterkaitan negara / korporasi asing"));
 const countries=assetsItem?.cross_border_links||[];
 if(countries.length){
  const grid=E("div","sli-issuer-actor-list");
  for(const c of countries){
   const item=E("article","sli-issuer-actor-entry");item.append(E("strong",null,c.actor+" · "+c.country),E("span",null,c.relationship+" · "+c.note));
   sourceLink(item,c.source_url,T("Official company source","Sumber perusahaan"));grid.append(item);
  }
  section.append(grid);
 }else section.append(E("p","sli-issuer-missing",T("Corporate foreign-jurisdiction links require source-level checking. No citizen nationality is inferred from names.","Keterkaitan yurisdiksi asing korporasi perlu bukti resmi; kewarganegaraan individu tidak ditebak dari nama.")));
 sub(T("Concessions / permits / production-sharing contracts","Konsesi / izin / kontrak bagi hasil"));
 const rights=assetsItem?.rights||[];
 if(rights.length){
  const grid=E("div","sli-issuer-actor-list");
  for(const right of rights){
   const item=E("article","sli-issuer-actor-entry");
   item.append(E("strong",null,right.name),E("span",null,right.region+" · "+right.type+" · "+right.relation));
   if(right.participating_interest_pct!=null)item.append(E("span",null,T("Reported PSC working interest: ","Hak partisipasi PSC terlapor: ")+number(right.participating_interest_pct)+"%"));
   if(right.area_ha!=null)item.append(E("span",null,T("Reported permitted area: ","Luas perizinan terlapor: ")+number(right.area_ha)+" ha"));
   if(right.expiry_reported)item.append(E("span",null,T("Source-reported expiry: ","Masa berlaku menurut sumber: ")+right.expiry_reported));
   item.append(E("small",null,right.source_period+" · "+right.note));
   sourceLink(item,right.source_url,T("Underlying company evidence","Bukti sumber perusahaan"));
   grid.append(item);
  }
  section.append(grid);
 }else section.append(E("p","sli-issuer-missing",T("No verified concession-level asset record yet. A project announcement is not a concession award.","Belum ada data konsesi per aset yang terverifikasi. Pengumuman proyek bukan bukti izin atau konsesi.")));
 section.append(E("p","sli-issuer-notice",T(
  "Ultimate beneficial owner: NOT VERIFIED. Under the 2026 OJK/IDX/KSEI transparency rules, certain 10%+ beneficial-ownership details are obtainable by authorized request, not a fully open public database.",
  "Ultimate beneficial owner: BELUM TERVERIFIKASI. Menurut ketentuan transparansi OJK/BEI/KSEI 2026, sebagian rincian pemilik manfaat 10%+ memerlukan permintaan resmi dan tidak tersedia sebagai data publik terbuka."
  )));
 sourceLink(section,"https://ojk.go.id/id/berita-dan-kegiatan/siaran-pers/Pages/OJK-BEI-dan-KSEI-Tuntaskan-Empat-Agenda-Reformasi-Transparansi-Pasar-Modal-Indonesia.aspx",T("OJK transparency rules","Aturan transparansi OJK"));
 return section;
}
function issuerFinancials(issuer,groups,ticker){
 const gr=groups.records.find(r=>r.ticker===ticker&&r.exchange==="IDX");
 const reported=gr?.financial_source_url&&gr?.financial_period?gr:issuer;
 const section=E("section","sli-issuer-financials");
 section.append(E("h2",null,T("Verified issuer financials (not live quotes)","Keuangan emiten bersumber (bukan harga langsung)")));
 const dl=E("dl","sli-issuer-facts");
 for(const [key,en,bahasa] of [["revenue","Revenue","Pendapatan"],["net_income","Net income","Laba bersih"],["total_assets","Total assets","Total aset"]]){
  const val=reported?.[key];
  const good=typeof val==="number"&&Number.isFinite(val)&&reported.financial_period&&safe(reported.financial_source_url);
  typed(T(en,bahasa),good?number(val)+" "+(reported.financial_currency||"")+" · "+reported.financial_period:T("N/A · financial source/period not yet verified","N/A · sumber/periode laporan belum terverifikasi"),dl);
 }
 typed(T("Market capitalization","Kapitalisasi pasar"),T("N/A · dated closing price and shares data not licensed for redistribution","N/A · harga penutupan dan saham beredar belum tersedia dengan izin redistribusi"),dl);
 section.append(dl);
 if(reported?.financial_basis)section.append(E("p","sli-issuer-notice",reported.financial_basis));
 sourceLink(section,reported?.financial_source_url,T("Source financial report","Laporan keuangan sumber"));
 return section;
}

function render(data,ticker,groups,relations,assets){
 const root=$("sliIssuerDossier");root.replaceChildren();
 const name=data.name||ticker, related=groups.records.filter(n=>n.exchange==="IDX"&&n.ticker===ticker);
 root.append(E("span","sli-issuer-kicker",T("SOURCED ENTITY DOSSIER · IDX","PROFIL ENTITAS BERSUMBER · BEI")));
 const heading=E("div","sli-issuer-title");
 const mark=window.SLIEntityIdentity?.brand?.(name,"building");
 if(mark)heading.append(mark);heading.append(E("h1",null,name));root.append(heading);
 root.append(E("span","sli-issuer-ticker","IDX:"+ticker),E("p","sli-issuer-sector",T("Sector","Sektor")+": "+(data.sector||T("Classification pending","Klasifikasi belum diverifikasi"))));
 const notice=E("p","sli-issuer-notice",data.verification==="official_exchange_snapshot"?
 T("Official IDX directory snapshot. Listing and financial information may have changed since the date.","Snapshot direktori BEI resmi. Informasi pencatatan dan keuangan dapat berubah."):
 T("This ticker comes from a curated SLI catalogue. Current listing, sector and shareholding need confirmation against official BEI records.","Kode berasal dari katalog kurasi SLI. Status pencatatan, sektor, dan kepemilikan perlu dicocokkan kembali dengan catatan resmi BEI."));
 root.append(notice);
 const content=E("div","sli-issuer-content"),left=E("section","sli-issuer-main"),side=E("aside","sli-issuer-side");
 const facts=E("dl","sli-issuer-facts");
 typed(T("Ticker / exchange","Kode saham / bursa"),"IDX:"+ticker,facts);
 typed(T("Company name · source register","Nama perusahaan · registri"),name,facts);
 typed(T("Strategic sector","Sektor strategis"),data.sector,facts);
 typed(T("Source register date","Tanggal registri"),data.source_as_of||"2026-10-20",facts);
 typed(T("Current BEI listing verified?","Status pencatatan BEI sudah pasti?"),data.verification==="official_exchange_snapshot"?T("Official snapshot only","Snapshot resmi bertanggal"):T("Pending official reconciliation","Menunggu rekonsiliasi resmi"),facts);
 left.append(E("h2",null,T("Issuer profile and provenance","Profil emiten dan sumber")),facts);
 const sources=E("div","sli-issuer-links");
 sourceLink(sources,data.source_url,T("Official issuer profile (BEI)","Profil emiten resmi (BEI)"));
 sourceLink(sources,"https://www.idx.co.id/id/perusahaan-tercatat/laporan-keuangan-dan-tahunan/",T("BEI financial and annual reports","Laporan keuangan dan tahunan BEI"));
 sources.append(link("./sli-entities.html?ticker="+encodeURIComponent(ticker)+"#"+encodeURIComponent("company:idx:"+ticker),T("Cross-check full SLI entities register ↗","Periksa registri lengkap Entitas SLI ↗")));
 sources.append(link("./sli-research-ai.html?prompt="+encodeURIComponent(T("Analyze IDX:"+ticker+" ("+name+") against official company disclosures, audited balance sheet, SLI corporate ownership sources and strategic sector risks. Do not invent prices or market caps.","Analisis IDX:"+ticker+" ("+name+") dari keterbukaan emiten BEI, laporan keuangan diaudit, kepemilikan korporasi SLI, dan risiko sektoral. Jangan mengarang harga atau kapitalisasi.")),T("Research AI ↗","Research AI ↗")));
 left.append(sources);
 showFinancialEvidence(left,related);
 const relate=E("section","sli-issuer-related");relate.append(E("h2",null,T("Group and ownership links","Hubungan grup dan kepemilikan")));
 if(!related.length){relate.append(E("p",null,T("A verified corporate group relationship has not been matched for this issuer. Do not infer ownership.","Hubungan grup yang terverifikasi belum ditemukan dalam registri. Jangan asumsikan kepemilikan.")));}
 else {
  for(const r of related){
   const block=E("article","sli-issuer-related-row");
   block.append(E("strong",null,r.name),E("small",null,T("Relationship","Hubungan")+": "+(r.relationship||"—")+(r.ownership_pct!=null?" · "+r.ownership_pct+"%":"")));
   const source=E("div","sli-issuer-links");
   sourceLink(source,r.source_url,T("Evidence","Bukti"));
   if(r.group)source.append(link("./sli-entities.html?group="+encodeURIComponent(r.group),T("View company group ↗","Lihat grup perusahaan ↗")));
   // Display only registry-attested directors and domicile, never infer beneficial ownership.
   if(r.domicile)block.append(E("small",null,T("Recorded domicile","Domisili tercatat")+": "+r.domicile));
   if(r.ownership_class)block.append(E("small",null,T("Ownership classification","Klasifikasi kepemilikan")+": "+r.ownership_class));
   if(Array.isArray(r.directors)&&r.directors.length){
     const people=E("div","sli-issuer-related-people");
     people.append(E("strong",null,T("Named officials in evidence registry","Pengurus dalam registri bukti")));
     for(const p of r.directors){
       if(!p.name)continue;
       const person=E("div","sli-issuer-related-person",p.name+" · "+(p.title_id||p.title_en||T("Role not recorded","Jabatan belum dicatat")));
       if(safe(p.source_url))person.append(document.createTextNode(" · "),link(safe(p.source_url),T("source ↗","sumber ↗"),true));
       people.append(person);
     }
     block.append(people);
   }
   block.append(source);relate.append(block);
  }
 }
 left.append(relate);
 left.append(actorSection(ticker,relations||{},assets||{},related));
 tradingview(side,ticker,name);
 historicalChart(side,ticker);
 side.append(E("p","sli-issuer-missing",T("SLI has not published a licensed, auditable IDX EOD market-cap quote for this ticker. The embedded chart belongs to the provider and is separate from SLI internal statistics.",
 "SLI belum menerbitkan kutipan kapitalisasi/harga EOD berizin yang bisa diaudit untuk emiten ini. Grafik tersemat milik penyedia dan terpisah dari statistik internal SLI.")));
 content.append(left,side);root.append(content);
}
async function load(){
 const ticker=tickerFrom(location);
 if(!ticker){$("sliIssuerStatus").textContent=T("No valid IDX ticker supplied. Return to the homepage.","Kode saham IDX tidak valid. Kembali ke beranda.");return}
 try{
  const paths=["./data/sli-idx-issuer-universe.json","./data/sli-corporate-group-registry.json","./data/sli-corporate-evidence-relationships.json","./data/sli-issuer-actor-assets.json"];
  const files=await Promise.all(paths.map(p=>fetch(p,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("HTTP "+r.status);return r.json()})));
  if(files[0].schema!=="sli-idx-issuer-universe-v1"||!Array.isArray(files[0].records)||!Array.isArray(files[1].records))throw Error("Invalid issuer sources");
  const item=files[0].records.find(x=>x.ticker===ticker&&x.exchange==="IDX");
  if(!item){$("sliIssuerStatus").textContent=T("This ticker is not in the SLI IDX register; no fictional profile is shown.","Kode ini belum ada di registri emiten SLI; tidak ada profil pengganti yang dibuat.");return}
  document.title=ticker+" · "+item.name+" | SLI Entity Intelligence";
  $("sliIssuerStatus").textContent=T("Focused company dossier · ","Profil emiten khusus · ")+"IDX:"+ticker;
  render({...item,source_as_of:files[0].as_of},ticker,files[1],files[2],files[3]);
 }catch(e){console.error("[SLI issuer]",e);$("sliIssuerStatus").textContent=T("Official source registry could not be loaded.","Sumber registri belum dapat dimuat.")}
}
document.addEventListener("sli:languagechange",()=>load());
document.addEventListener("DOMContentLoaded",load,{once:true});
window.SLIIssuerRoute={tickerFrom,historicalChartConfig,historicalChartWidget:TV_ADVANCED_CHART};
})();