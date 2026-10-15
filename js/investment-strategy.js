/* SLI Investment Strategy: sourced market snapshots, 13-sector SWOT and unconfirmed deal watch. */
(function(){"use strict";
const N=(tag,cls,txt)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x};
const url=(u,label)=>{if(!/^https:\/\//.test(u||""))return N("span","tr-detail","Original source unavailable");const a=N("a",null,label+" ↗");a.href=u;a.target="_blank";a.rel="noopener noreferrer";return a};
const read=async path=>{const r=await fetch(path,{cache:"no-store"});if(!r.ok)throw Error(path+" not available");return await r.json()};
const number=v=>Number(v).toLocaleString("id-ID",{maximumFractionDigits:2});
const isoDate=v=>typeof v==="string"?v.slice(0,10):"unknown";
const daysOld=(date)=>{const ts=Date.parse(isoDate(date)+"T12:00:00Z");return Number.isFinite(ts)?(Date.now()-ts)/86400000:Infinity};
const newsCategories={
"Oil & Gas":/migas|skk|pertamina|inpex|tangguh|cepu|rokan|mahakam/i,
"Coal":/batubara|coal|ptba|adaro|bayan/i,
"Minerals":/nikel|nickel|mineral|vale|freeport|emas|tembaga/i,
"Smelters & Processing":/smelter|hpal|hilirisasi|copper|tembaga|refinery/i,
"Biofuels & Bioenergy":/biodiesel|biofuel|b50|bioenergi|saf\b|biogas/i,
"Palm Oil & Downstreaming":/sawit|palm oil|kelapa sawit|cpo\b|pk[o\b]|bpdp|pungutan ekspor|pabrik kelapa sawit/i,
"Geothermal":/panas bumi|geothermal|pge|pltp/i,
"Solar PV":/plts|surya|solar|photovoltaic/i,
"Hydropower & Storage":/plta|pltm|hidro|hydro|cisokan|pumped storage/i,
"Wind":/pltb|angin|wind power|wind farm/i,
"Nuclear (New Energy)":/pltn|nuclear|thorcon|khnp|bapeten|smr\b/i,
"Electric Vehicles":/ev\b|kendaraan listrik|mobil listrik|byd|wuling|chery|battery|baterai/i,
"AI / Data Center":/data center|pusat data|cloud|hyperscale|ai\b|neutradc/i
};
const newsRelevant=(row,sector)=>newsCategories[sector]?.test(row.title||"")||row.topic===sector;
function marketCard(holder,label,value,details,sourceUrl){
 const card=N("div","inv-market-card");
 card.append(N("span",null,label),N("strong",null,value),N("small",null,details));card.append(url(sourceUrl,"Original source"));
 holder.append(card);
}
window.initSLIInvestmentStrategy=async function(){
 const markets=document.getElementById("investmentMarketsRoot");
 const swot=document.getElementById("investmentSWOTRoot");
 const rumors=document.getElementById("investmentRumorsRoot");
 const results=await Promise.allSettled(["data/investment-market.json","data/investment-swot.json","data/investment-operator-assets.json","data/investment-news.json","data/investment-reported-scenarios.json"].map(read));
 const loaded=results.map(x=>x.status==="fulfilled"?x.value:null);
 const [market,model,assets,news,curated]=loaded;
 if(markets){
  markets.replaceChildren();
  if(!market)markets.append(N("p","tr-detail","Bank Indonesia and IHSG snapshots unavailable. No live number inferred."));
  else{
   const cards=N("div","inv-market-grid");
   for(const item of [{label:"USD / IDR · Bank Indonesia",value:"Rp"+number(market.fx.value),date:market.fx.observed_date,detail:market.fx.reference,ref:market.fx.source},{label:"IHSG / IDX Composite",value:number(market.ihsg.value),date:market.ihsg.observed_date,detail:market.ihsg.quote_status+(market.ihsg.change_pct!=null?" · "+number(market.ihsg.change_pct)+"% reported change":""),ref:market.ihsg.source}]){
    marketCard(cards,item.label,item.value,"Observation: "+item.date+" · "+item.detail+(daysOld(item.date)>3?" · STALE":" · Date-labelled snapshot"),item.ref);
   }
   for(const index of market.global_indicators||[]){
    const v=index.denominator?"#"+index.value+" / "+index.denominator:index.value+" "+index.unit;
    marketCard(cards,index.name,v,index.period+" · "+index.classification,index.source)
   }
   markets.append(cards);
   markets.append(N("p","tr-detail",market.market_data_policy));
  }
 }
 if(swot){
  swot.replaceChildren();
  if(!model)swot.append(N("p","tr-detail","The reviewed SWOT baseline is unavailable. Headlines alone are not treated as validated conclusions."));
  else{
   const lead=N("p","tr-detail",model.methodology);swot.append(lead);
   const filter=N("select","tr-select"),note=N("p","tr-detail"),body=N("div","inv-swot-body");
   filter.setAttribute("aria-label","Choose investment sector SWOT");
   model.sectors.forEach((x,i)=>{const op=N("option",null,x.sector);op.value=String(i);filter.append(op)});
   swot.append(filter,note,body);
   function draw(){
    const record=model.sectors[Number(filter.value)||0];body.replaceChildren();if(!record)return;
    const related=(assets?.records||[]).filter(x=>x.sector===record.sector);
    const operating=related.filter(x=>x.stage==="Operational").length;
    note.textContent=record.sector+" · "+related.length+" sourced asset/permit records · "+operating+" labelled operational · SWOT baseline reviewed "+model.as_of;
    const quadrants=N("div","inv-swot-grid");
    for(const [name,field,kind] of [["Strength","strength","strength"],["Weakness","weakness","weakness"],["Opportunity","opportunity","opportunity"],["Threat","threat","threat"]]){
      const c=N("article","inv-swot-quadrant inv-swot-"+kind);
      c.append(N("strong",null,name),N("p",null,record[field]));quadrants.append(c)
    }
    body.append(quadrants);
    const sourceBox=N("div","inv-swot-links");
    const selected=(assets?.records||[]).filter(x=>record.asset_ids.includes(x.id)).slice(0,4);
    for(const a of selected)sourceBox.append(url(a.source_url,a.asset));
    body.append(sourceBox);
    const relevant=(news?.reports||[]).filter(x=>newsRelevant(x,record.sector)).slice(0,3);
    const newsBlock=N("div","inv-swot-news"),t=N("h4",null,"Latest media signals (context only; not verified SWOT revisions)");newsBlock.append(t);
    if(relevant.length)for(const n of relevant){const line=N("div","inv-swot-newsrow");line.append(url(n.url,n.title),N("small",null,(n.published_at_utc||"Date unknown")+" · "+(n.publisher||"Unknown publisher")+" · unverified lead"));newsBlock.append(line)}
    else newsBlock.append(N("p","tr-detail","No sector-specific headlines currently available in the dated investment media snapshot."));
    body.append(newsBlock);
    body.append(N("p","tr-detail","Automatic update: asset counts and dated media context are recomputed when the source snapshots change. The SWOT judgments remain a reviewed editorial baseline until primary sources warrant revision."));
   }
   filter.addEventListener("change",draw);draw();
  }
 }
 if(rumors){
  rumors.replaceChildren();
  rumors.append(N("p","tr-detail","Public-report speculation only. No anonymous tips or claims of illegal behaviour. 'Unverified' means the report is NOT established as a corporate action, financing close, or market-moving event. A disclaimer does not make unsubstantiated claims reliable."));
  const verifiedEditorial=(curated?.reports||[]).filter(x=>/^https:\/\//.test(x.url||""));
  if(verifiedEditorial.length){
    const title=N("h4",null,"Publicly sourced prospective scenarios — not confirmed outcomes");
    rumors.append(title);
    for(const x of verifiedEditorial){
      const block=N("details","inv-rumor-card"),summary=N("summary",null,x.date+" · "+x.headline);
      block.append(summary,N("small",null,x.source_name+" · "+x.topic));
      const paragraph=(k,v)=>{const p=N("p","tr-detail");p.append(N("strong",null,k+": "),document.createTextNode(v));block.append(p)};
      paragraph("What the source actually reported",x.reported_basis);
      paragraph("Unverified future development",x.unconfirmed_element);
      paragraph("Conditional investment relevance",x.implication);
      paragraph("Evidence needed",x.verify_next);
      block.append(url(x.url,"Read attributed original"));
      rumors.append(block)
    }
  }
  const report=(news?.reports||[]).filter(x=>x.topic==="Rumor & deal watch"&&/^https:\/\//.test(x.url||"")).slice(0,12);
  const age=news?.checked_at_utc?"Investment RSS scan: "+news.checked_at_utc:"No completed new investment-RSS scan";
  rumors.append(N("p","tr-detail",age));
  if(!report.length)rumors.append(N("p","tr-detail","No additional eligible RSS speculation found. Existing curated reports above remain individually attributed and date-scoped."));
  for(const item of report){
   const p=N("article","inv-rumor-card");
   p.append(N("div","eyebrow","UNCONFIRMED PUBLIC-REPORT WATCH"),url(item.url,item.title),N("small",null,item.publisher+" · "+(item.published_at_utc||"Date unknown")));
   p.append(N("p","tr-detail","Open the original report and cross-check IDX announcements or company statements before any investment inference."));
   rumors.append(p)
  }
 }
};
})();