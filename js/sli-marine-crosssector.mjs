/* SLI KKP cross-module hub · source-safe, read-only.
 * Legal-index links are metadata, not article text. IDX thematic screen is
 * editorial grouping, not official industry reclassification.
 */
const REGISTRY="./data/sli-marine-crosssector.json";
export const checkMarineIntegration=registry=>{
 const errors=[];
 if(registry?.schema!=="sli-marine-crosssector-v1")errors.push("schema");
 if((registry?.regulations||[]).length<7)errors.push("law_reference_coverage");
 if((registry?.agencies||[]).length<5)errors.push("entity_coverage");
 if((registry?.issuer_candidates||[]).length<4)errors.push("marine_ticker_candidates");
 if((registry?.geopolitical_channels||[]).length<5)errors.push("geopolitical_risk_topics");
 if((registry?.links||[]).length<7)errors.push("module_routes");
 const links=[...(registry?.regulations||[]),...(registry?.agencies||[]),...(registry?.issuer_candidates||[]),...(registry?.geopolitical_channels||[])];
 for(const item of links)if(!/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(item.source_url||""))errors.push("missing_https_source");
 if((registry?.regulations||[]).some(x=>!["legal_index_review_required","amending_instrument","amended_parent"].includes(x.status)))errors.push("legal_status_not_source_limited");
 if(new Set(registry?.issuer_candidates?.map(x=>x.ticker)).size!==registry?.issuer_candidates?.length)errors.push("duplicate_issuer");
 return {pass:errors.length===0,errors:[...new Set(errors)]};
};
const T=(id,en)=>document.documentElement.lang?.startsWith("en")?en:id;
const element=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=String(text);return el};
const safeUrl=u=>{try{const x=new URL(u,location.href);return ["https:","http:"].includes(x.protocol)&&x.origin===location.origin||x.protocol==="https:"?x.href:null}catch{return null}};
const route=(el,to,label)=>{const a=element("a",null,label),url=safeUrl(to);if(!url)return;a.href=url;if(url.startsWith("https:")&&!url.startsWith(location.origin)){a.target="_blank";a.rel="noopener noreferrer"}el.append(a)};
function render(registry){
 const root=document.getElementById("mfConnectedIntelligence");if(!root)return;
 root.replaceChildren();
 const intro=element("p","mf-hint",T("Tautan di bawah ini menghubungkan bukti kelautan KKP ke modul SLI lainnya. Harga saham, headline, dan metadata JDIH berbeda dari statistik KKP terverifikasi.","Explore official KKP marine evidence alongside SLI stocks, monitoring, legal-index references, entities, geopolitics and owner-only DERGUBA research. News and legal metadata have different evidence levels."));root.append(intro);
 const routes=element("div","mf-connect-grid");
 for(const spec of registry.links){
  const card=element("article","mf-card mf-connect-card");
  const h=element("h3");route(h,spec.id==="stocks"?"./index.html?watchlist=marine#home":spec.url,T(spec.label_id,spec.label_en));
  card.append(h);
  if(spec.id==="research")card.append(element("p","mf-hint",T("Riset lintas sumber dalam uji pemilik. Periksa bukti primer dan periode observasi.","Owner-test research. Verify original data periods and primary evidence.")));
  routes.append(card);
 }
 root.append(routes);
 const combined=element("div","mf-two");
 const laws=element("article","mf-card");
 laws.append(element("h3",null,T("Regulasi KKP · rujukan instrumen","KKP regulation · instrument references")));
 laws.append(element("p","mf-hint",T("Judul dan identitas peraturan berasal dari indeks resmi; status kini dan teks pasal terkonsolidasi belum divalidasi penuh.","Instrument identities from official indexes. Current consolidated text and article content are not certified.")));
 const lawList=element("div","mf-links");
 for(const p of registry.regulations)route(lawList,p.source_url,p.ref+" · "+p.title+" ↗");
 laws.append(lawList);
 const people=element("article","mf-card");
 people.append(element("h3",null,T("Kelembagaan & aktor","Institutions & actors")));
 const inst=element("div","mf-links");
 for(const p of registry.agencies)route(inst,p.source_url,p.name+" ↗");
 people.append(inst,element("p","mf-hint",T("Lembaga bukan nama pejabat aktif; kewenangan spesifik proyek harus diverifikasi.","Institution names are not current official-holder claims; verify project-level authority.")));
 combined.append(laws,people);root.append(combined);
 const risks=element("article","mf-card");
 risks.append(element("h3",null,T("Jalur risiko geopolitik maritim","Marine geopolitical exposure pathways")));
 const list=element("div","mf-topic-grid");
 for(const g of registry.geopolitical_channels){
  const card=element("article","mf-topic");
  card.append(element("h3",null,T(g.title_id,g.title_en)),element("p",null,g.exposure),
    element("p","mf-hint",T("Batasan bukti: ","Evidence limit: ")+g.guard));
  route(card,g.source_url,T("Rujukan sumber ↗","Source reference ↗"));list.append(card);
 }
 risks.append(list);root.append(risks);
 const ai=element("article","mf-card");
 ai.append(element("h3",null,T("Uji analisis DERGUBA AI","Test DERGUBA AI analysis")));
 ai.append(element("p","mf-hint",T("Contoh pertanyaan memisahkan produksi historis, kebijakan, dan risiko perdagangan. DERGUBA tidak boleh mengarang realisasi 2025 atau teks pasal.","Suggested question separates historical production, law and trade exposure. Never invent 2025 actuals or unseen legal articles.")));
 const prompt="Analisis ekonomi biru dan ketahanan perikanan Indonesia berdasarkan data KKP 2019–2024 di SLI. Bedakan produksi rumput laut dan total budidaya (hindari perhitungan ganda), jumlah nelayan versus pendapatan, estimasi 2025 versus realisasi, risiko ekspor dan Laut Natuna Utara. Identifikasi UU 31/2004, UU 45/2009, UU 32/2014, UU 7/2016 dan PP 11/2023 sebagai identitas peraturan yang memerlukan pemeriksaan JDIH sebelum kutipan Pasal. Sertakan rujukan tahun, satuan, lokasi, keterbatasan, dan sumber primer; jangan mengklaim headline sebagai fakta peristiwa.";
 route(ai,"./sli-research-ai.html?prompt="+encodeURIComponent(prompt),T("Analisis bersumber dengan DERGUBA (uji pemilik) ↗","Source-led DERGUBA research (owner test) ↗"));
 root.append(ai);
}
async function init(){
 const root=document.getElementById("mfConnectedIntelligence");if(!root)return;
 try{
  const response=await fetch(REGISTRY,{cache:"no-store"});if(!response.ok)throw Error("cross-module registry not available");
  const registry=await response.json(),qa=checkMarineIntegration(registry);if(!qa.pass)throw Error("cross-module evidence incomplete: "+qa.errors.join(","));
  render(registry);document.addEventListener("sli:languagechange",()=>render(registry));
 }catch(err){root.textContent=T("Koneksi lintas-modul belum tersedia; jangan gunakan daftar tidak terverifikasi.","Cross-module evidence unavailable; unverified links are not substituted.");console.warn("[SLI KKP connections]",err)}
}
if(typeof document!=="undefined"){
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
}
