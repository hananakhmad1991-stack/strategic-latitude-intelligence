/* SLI Research AI conversational client.
   Does not claim AI is active without an explicit, controlled backend configuration.
   Never embeds credentials, handles sources as untrusted text, never stores chat locally.
*/
(()=>{"use strict";
const $=id=>document.getElementById(id);
const MESSAGES={id:{
 inactive:"Layanan Research AI generatif belum diaktifkan. Ini adalah antarmuka penelitian, bukan model yang sudah terhubung. Untuk saat ini, gunakan Evidence Preview; Research AI penuh membutuhkan akun Pro/Enterprise dan backend privat.",
 missing:"Login Pro/Enterprise yang terverifikasi belum tersedia. Tidak ada permintaan yang dikirim ke layanan AI.",
 invalid:"Koneksi AI belum dikonfigurasi dengan aman. Hubungi pengelola SLI.",
 busy:"Sedang menyiapkan analisis berdasarkan dokumen terkurasi...",
 requestFail:"Permintaan AI belum berhasil. Jawaban tidak dibuat. Silakan coba lagi saat layanan tersedia.",
 ready:"Backend Research AI dikonfigurasi; akses membutuhkan login Pro/Enterprise.",
 prelaunch:"Layanan generatif belum aktif · Research AI Prototype",
 copied:"Hasil analisis disalin.", copyFail:"Salin teks tidak diizinkan browser.",
 user:"Instruksi riset", assistant:"DERGUBA AI · Analisis bersumber", system:"Status layanan", source:"Sumber",
 example:"Gunakan sebagai instruksi", noSources:"Tidak ada sumber yang diberikan oleh layanan.", caution:"Periksa fakta dan publikasi asli sebelum menggunakan hasil ini."
},en:{
 inactive:"The generative Research AI service is not active. This is a research assistant interface, not a connected AI model. The separate Evidence Preview is available; full Research AI needs Pro/Enterprise access and a private backend.",
 missing:"Verified Pro/Enterprise login is not yet available. No request was sent to an AI provider.",
 invalid:"The AI service has not been securely configured. Contact the SLI administrator.",
 busy:"Preparing source-grounded research...",
 requestFail:"The research request failed. No answer was generated. Please try again once service is available.",
 ready:"Research AI backend configured; verified Pro/Enterprise login required.",
 prelaunch:"Generative service inactive · Research AI Prototype",
 copied:"Research answer copied.", copyFail:"Browser clipboard not available.",
 user:"Research instruction",assistant:"DERGUBA AI · Sourced assessment",system:"Service status",source:"Source",
 example:"Use as research prompt",noSources:"No sources were returned by the service.",caution:"Verify important facts and primary publications."
}};
const PROMPTS={
 regulation:{mode:"executive_summary",id:"Analisis UU Nomor 16 Tahun 2016 tentang Pengesahan Paris Agreement. Bedakan tanggal berlakunya UU nasional, deposito ratifikasi ke PBB, dan tanggal perjanjian mulai berlaku bagi Indonesia. Sertakan rujukan resmi, batas evidensi, dan implikasi kebijakan transisi energi. Jangan mengarang aturan pelaksana yang belum didukung dokumen.",en:"Analyse Indonesian Law No. 16 of 2016 ratifying the Paris Agreement. Distinguish domestic commencement, deposit of ratification with the UN and when the treaty entered into force for Indonesia. Cite official sources, explain evidence limitations and discuss energy-transition implications without inventing implementing rules."},
 academic_ahp:{mode:"deep_research",id:"Saya peneliti universitas. Tolong olah hasil kuesioner AHP terlampir, hitung bobot tiap kriteria, peringkat prioritas, consistency ratio (CR) kelompok dan tiap responden. Jangan imputasi jawaban kosong. Berikan grafik, interpretasi akademik, dan rekomendasi pemeriksaan jika tidak konsisten.",en:"I am a university researcher. Please process the attached AHP questionnaire, calculate criterion weights, ranking and group and respondent consistency ratios. Do not impute missing judgments. Provide a chart, academic interpretation and methodological limitations."},
 academic_generic:{mode:"deep_research",id:"Saya peneliti universitas dan ingin dibantu menyusun metodologi riset. Bantu memilih metode paling sesuai dengan pertanyaan penelitian saya, jelaskan jenis data yang diperlukan, langkah analisis dan bagaimana menguji validitas, serta hasil laporan yang dapat dihasilkan. Jangan mengklaim perhitungan dilakukan jika datanya belum tersedia.",en:"I am a university researcher. Help design a rigorous methodology for my research question: select suitable methods, required data, analysis steps, limitations and validation. Do not claim any numerical model was run before its inputs are available."},
 refinery:{mode:"deep_research",id:"Saya memiliki anggaran investasi Rp5 triliun dan mempertimbangkan pembangunan kilang minyak bumi di Nusa Tenggara Barat (NTB). Saya investor nonteknis. Pilihkan metodologi yang paling sesuai. Susun screening investasi awal: jenis dan kapasitas kilang (jika belum diketahui tanyakan asumsi kunci), sumber dan jaminan pasokan crude, permintaan BBM, pilihan lokasi, logistik pelabuhan, energi, air, izin dan lingkungan, pembiayaan, risiko, serta peluang tenaga kerja. Jelaskan bagaimana menghitung multiplier effect dengan tabel Input-Output resmi Indonesia / IRIO jika tersedia; JANGAN mengarang angka multiplier, IRR, NPV, pekerjaan atau kelayakan proyek tanpa data input dan model numerik yang dijalankan. Berikan skenario transparan, visualisasi hanya bila angka sumber tersedia, dan rekomendasi due diligence dengan sitasi.",en:"I have an indicative IDR 5 trillion budget to develop an oil refinery in West Nusa Tenggara (NTB). I am a nontechnical investor. Choose suitable methodologies automatically. Screen refining scope/capacity and feedstock (ask for any missing critical inputs), crude supply, fuel demand, port and power infrastructure, water, permits and environmental issues, financing, project risks, sector employment. Explain how official Indonesia IO/IRIO tables would be used to calculate multipliers, but DO NOT fabricate multiplier, IRR, NPV, jobs or project feasibility values. Provide transparent scenario data requirements and source-cited due diligence recommendations."},
 energy:{mode:"executive_summary",id:"Buat executive summary komprehensif tentang ketahanan energi Indonesia berdasarkan data terbaru yang tersedia di SLI. Bahas produksi migas, kebutuhan impor, subsidi BBM dan listrik, transisi energi, risiko geopolitik jalur perdagangan, ketahanan pasokan, serta rekomendasi kebijakan dan implikasi investasi. Pisahkan data terverifikasi, analisis dan ketidakpastian. Sertakan sitasi dan tanggal data.",en:"Create a source-grounded executive summary of Indonesia's energy security. Assess oil and gas production, import dependence, fuel and electricity subsidies, energy transition, geopolitical shipping risks, supply resilience and strategic investment implications. Distinguish verified observations from inference and uncertainty, with dated citations."},
 ai:{mode:"deep_research",id:"Lakukan riset mendalam mengenai prospek pembangunan AI data center Indonesia hingga 2030. Analisis proyek investor utama, kapasitas rencana versus kapasitas beroperasi, kebutuhan listrik dan pendinginan, Batam versus Jawa Barat, insentif, tantangan regulasi, kelayakan investasi dan peluang kerja sama Korea Selatan. Buat analisis menyeluruh dengan sumber, bukan daftar berita.",en:"Conduct an in-depth research assessment of Indonesia's AI data center prospects through 2030. Analyse investor project pipeline, planned versus operational capacity, power and cooling constraints, Batam versus West Java, investment incentives, regulation and Korean cooperation. Provide an evidence-backed report, not a list of links."},
 province:{mode:"comparative_analysis",id:"Bandingkan Jawa Tengah dan Jawa Barat untuk investasi industri dan data center. Gunakan pertumbuhan PDRB, PMTB, konsumsi rumah tangga, ketimpangan pengeluaran, infrastruktur energi, bukti proyek, risiko izin dan tenaga kerja. Jelaskan perbedaan periode statistik, peluang sektoral, keterbatasan data, dan pertanyaan due diligence yang harus dijawab investor. Hindari mencampur data kedua provinsi.",en:"Compare Central Java and West Java for industrial and data center investment using GRDP growth, capital formation, household spending, expenditure inequality, energy infrastructure, project milestones and due diligence risks. Keep the regions and reporting periods strictly separate, and explain what the evidence cannot establish."},
 mineral:{mode:"risk_opportunity",id:"Susun Risk & Opportunity Assessment mengenai mineral kritis dan hilirisasi Indonesia, khususnya nikel, tembaga dan rantai nilai baterai. Evaluasi cadangan dan kapasitas, pelaksanaan smelter, pengaruh investor asing, energi, ESG, geopolitik rantai pasok, insentif, risiko regulasi, dan skenario hingga 2030. Cantumkan sumber data dan rekomendasi strategis yang bisa diuji.",en:"Prepare a risk and opportunity assessment of Indonesia's critical minerals downstreaming, focusing on nickel, copper and batteries. Evaluate project implementation, foreign investors, energy, ESG exposure, geopolitical supply chains, incentives, legal uncertainties and scenario assumptions to 2030, with evidence and verifiable recommendations."}
};
const state={language:"id",config:null,history:[],lastResult:null,busy:false,sequence:0,filesSupported:false,features:null};
const ownerConfigured=()=>state.config?.owner_test?.enabled===true&&!!safeUrl(state.config?.owner_test?.endpoint||"")&&new URL(state.config.owner_test.endpoint).pathname==="/v1/owner-research";
function tr(key){return MESSAGES[state.language][key]||key}
function node(tag,cls,text){const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x}
function safeUrl(url){try{const u=new URL(url);return u.protocol==="https:"?u.href:null}catch{return null}}
function status(text,level="warning"){$("raNotice").textContent=text;$("raNotice").dataset.level=level}
function enableControls(){const hasResult=!!state.lastResult;$("raCopy").disabled=!hasResult;$("raExport").disabled=!hasResult;$("raWord").disabled=!hasResult;$("raPdf").disabled=!hasResult;window.dispatchEvent(new Event("sli:research-export-state"));$("raSend").disabled=state.busy;$("raFollowupSend").disabled=state.busy;$("raChatFiles").disabled=state.busy}
function isConfigured(){
 const c=state.config;
 return c?.schema==="sli-research-assistant-config-v1"&&c.api_enabled===true&&c.login_enabled===true&&c.generation_status==="enabled"&&!!safeUrl(c.api_endpoint||"");
}
function selectPrompt(key){
 const prompt=PROMPTS[key];if(!prompt)return;
 $("raPrompt").value=prompt[state.language];$("raMode").value=prompt.mode;
 if(key==="academic_ahp")$("raChatMethod").value="ahp";
 else $("raChatMethod").value="auto";
 methodStatus();
 $("raPrompt").focus();$("raPrompt").scrollIntoView({behavior:"smooth",block:"center"});
}
function append(role,text){
 $("raConversation").hidden=false;
 const box=node("article","sli-ra-message");box.dataset.role=role;
 box.append(node("div","sli-ra-msg-meta",role==="user"?tr("user"):role==="assistant"?tr("assistant"):tr("system")));
 const body=node("div","sli-ra-msg-text");
 box.append(body);$("raMessages").append(box);
 if(role==="assistant"&&window.SLIResearchVisuals)window.SLIResearchVisuals.renderMarkdown(reportBody(text,state.language),body,state.lastResult?.sources||[]);else body.textContent=text;
 return body;
}
function apaEntry(s){
 const publisher=String(s.publisher||"Research institution").trim();
 const isLaw=["reviewed_primary_article_paraphrase","legal_index_metadata"].includes(String(s.source_type||""));
 // Review timestamp is NOT the original enactment year of a legal instrument.
 const title=String(s.title||"Research document").trim();
 const legalYear=title.match(/\b(?:UU|PP|Perpres|Perda|Permen|Pergub|Perbup|Perwali)\s*(?:No\.?|Nomor)?\s*\d+\s*(?:\/|-|Tahun\s+)((?:19|20)\d{2})\b/i)?.[1];
 const year=isLaw?(legalYear||"n.d."):(String(s.source_type==="official_numeric_api"?(s.period||s.source_date):s.source_type==="live_web_discovery"?(s.period==="publication_date_unverified"?"":s.period):s.publication_date||s.published_at||s.source_date||s.period||"").match(/(?:19|20)\d{2}/)?.[0]||"n.d.");
 const sourceLabel=s.source_type==="live_web_discovery"?"Temuan web belum diverifikasi: ":isLaw?(String(s.source_type)==="legal_index_metadata"?"Indeks regulasi: ":"Ringkasan pasal terkurasi: "):"";
 return publisher+". ("+year+"). "+sourceLabel+title+". "+String(s.source_url||"");
}
/* Normalise model-generated repeated "1." list markers for rendered output and
 * Markdown exports, while keeping headings, source citations and prose intact. */
function normalizeReportListNumbers(markdown,language="id"){
 let count=0,inFence=false;
 return String(markdown||"").split("\n").map(line=>{
  // Never rewrite code examples or headings inside fenced source blocks.
  if(/^\s*`{3,}/.test(line)){inFence=!inFence;return line}
  if(inFence)return line;
  const heading=/^(#{1,6}\s+)(.+)$/.exec(line.trim());
  if(heading){
   count=0;
   const title=heading[2].trim();
   const translated=language==="id"&&/^(?:verification note|legal verification note|evidence limitations note)$/i.test(title)
    ?"Catatan Verifikasi Hukum":language==="id"&&/^executive summary$/i.test(title)
    ?"Ringkasan Eksekutif":title;
   return heading[1]+translated;
  }
  const item=/^(\s*)(\d+)([.)])(\s+.+)$/.exec(line);
  if(!item||item[1].length>0)return line;
  const authored=Number(item[2]);
  const resolved=authored===1&&count>0?count+1:authored;
  if(Number.isInteger(resolved)&&resolved>=1&&resolved<=100){
   count=resolved;
   return item[1]+resolved+"."+item[4];
  }
  return line;
 }).join("\n");
}
function reportBody(answer,language="id"){
 // Remove only ancillary sections; never truncate substantive conclusions after them.
 const lines=String(answer||"").split("\n"),out=[];
 let skipping=false;
 for(const line of lines){
  const section=/^#{1,3}\s+(.+)$/.exec(line.trim());
  if(section){
   const title=section[1].replace(/\*\*/g,"").trim();
   skipping=/^(references|daftar pustaka|bibliography|keterbatasan(?: data)?|limitations|evidence limitations|batasan data|source limitations|sumber\s*\/\s*evidence panel|sources?\s*\/\s*evidence panel|model statement|source statement|source statement and provenance|pernyataan sumber)\b/i.test(title);
  }
  if(!skipping)out.push(line);
 }
 return normalizeReportListNumbers(out.join("\n").trim(),language);
}

function renderModelStatement(answer,payload={}){
 const target=$("raModelStatementBody"),panel=$("raModelStatement");
 if(!target||!panel)return;
 target.replaceChildren();
 const found=String(answer||"").match(/(?:^|\n)#{1,3}\s+(?:Keterbatasan|Limitations|Evidence limitations|Batasan data|Source limitations|Model Statement|Catatan metodologis)\b[^\n]*\n([\s\S]*?)(?=\n#{1,3}\s+|$)/i);
 const statement=found?.[1]?.trim()||"";
 const legalAudit=payload.quality_audit?.legal_article_gate;
 if(!statement&&!legalAudit?.recovered){
  panel.hidden=true;
  return;
 }
 panel.hidden=false;
 if(legalAudit?.recovered)target.append(node("p",null,
  state.language==="id"
   ?"Sebagian analisis hukum ditahan karena tidak cocok dengan bukti primer. Periksa sumber dan versi regulasi sebelum mengandalkan kesimpulan."
   :"Some legal assertions were withheld for lack of matching primary evidence. Verify the legal texts and versions before reliance."));
 if(statement)target.append(node("p",null,statement.slice(0,3500)));
}
function renderSources(sources,answer="",charts=[]){
 const cited=new Set([...String(answer).matchAll(/\[(\d+)\]/g)].map(m=>Number(m[1])));
 const graphed=new Set((Array.isArray(charts)?charts:[]).flatMap(c=>Array.isArray(c.source_refs)?c.source_refs:[]).filter(Number.isInteger));
 const list=$("raSourcesList");list.replaceChildren();
 const valid=Array.isArray(sources)?sources.slice(0,40):[];
 if(!valid.length){list.append(node("p",null,tr("noSources")));return}
 valid.forEach((s,i)=>{
  const card=node("div","sli-ra-source-card");
  const sourceLink=node("a",null,"["+(i+1)+"] "+apaEntry(s));const href=safeUrl(s.source_url||"");if(href){sourceLink.href=href;sourceLink.target="_blank";sourceLink.rel="noopener noreferrer"}card.append(sourceLink);
  const role=cited.has(i+1)?(state.language==="id"?"Dikutip dalam laporan":"Cited in report"):
   graphed.has(i+1)?(state.language==="id"?"Sumber grafik":"Chart evidence"):
   (state.language==="id"?"Konteks terpilih; belum dikutip":"Selected context; not cited");
  card.append(node("p","sli-ra-source-role",role));
  if(s.source_type==="reviewed_primary_article_paraphrase")card.append(node("p","sli-ra-source-role",state.language==="id"?"Ringkasan pasal diperiksa · bukan teks UU konsolidasi":"Reviewed article summary · not consolidated statutory text"));
  if(s.source_type==="primary_treaty_depositary_record")card.append(node("p","sli-ra-source-role",state.language==="id"?"Registri Depositary PBB · status dan tanggal berlakunya perjanjian":"UN Treaty Depositary · ratification and entry-into-force status"));
  if(s.source_type==="official_ndc_registry")card.append(node("p","sli-ra-source-role",state.language==="id"?"Registri NDC resmi UNFCCC":"Official UNFCCC NDC registry"));
  if(s.source_type==="official_policy_context_metadata")card.append(node("p","sli-ra-source-role",state.language==="id"?"Metadata regulasi resmi · cek status terkini":"Official regulation registry · check current legal status"));
  if(s.source_type==="legal_index_metadata")card.append(node("p","sli-ra-source-role",state.language==="id"?"Metadata registri · status peraturan belum dipastikan":"Legal registry metadata · current status not certified"));
  if(s.source_type==="secondary_news")card.append(node("p","sli-ra-source-role",state.language==="id"?"Berita sekunder teratribusi · laporan media, bukan otomatis fakta independen atau statistik resmi.":"Attributed secondary reporting · not automatically verified as an independent fact or official statistic."));
  if(s.source_type==="official_numeric_api")card.append(node("p","sli-ra-source-role",state.language==="id"?"API angka resmi World Bank · nasional Indonesia; periksa tahun observasi dan perbedaan metodologi dengan BPS.":"Official World Bank numerical API · Indonesia national series; check observation year and BPS methodological differences."));
  if(s.source_type==="live_web_discovery")card.append(node("p","sli-ra-source-role",state.language==="id"?"Temuan pencarian eksternal · cuplikan belum diverifikasi, BUKAN konfirmasi fakta.":"External web discovery · snippet not independently checked; NOT fact confirmation."));
  if(s.source_type==="public_dashboard_source_record_not_claim_verified")card.append(node("p","sli-ra-source-role",state.language==="id"?"Indeks dashboard publik SLI · catatan bertanggal dan tautan sumber; belum diverifikasi terhadap artikel primer.":"Public SLI dashboard index · dated source-linked record, not independently checked against the primary publication."));

  const url=safeUrl(s.source_url||"");

  list.append(card);
 });
}
function renderClaimReview(qualityAudit,report,language="id"){
 const review=qualityAudit?.claim_review;if(!review||review.scope!=="citation_and_local_excerpt_triage_only_not_claim_fact_check")return;
 const isId=language!=="en",count=Number(review.assessed_claims)||0,
       shown=Math.max(0,Number(review.shown_claims)||0),
       gaps=Number(review.quantity_excerpts_mismatch)||0,
       uncited=Number(review.unattributed_claims)||0;
 const card=node("details","sli-ra-evidence-note");
 const title=node("summary",null,(isId?"AUDIT KLAIM · ":"CLAIM REVIEW · ")+
  count+(isId?" kandidat klaim; ":" candidate claims; ")+shown+
  (isId?" ditinjau, ":" shown, ")+gaps+
  (isId?" angka perlu dibandingkan, ":" numeric comparisons pending, ")+uncited+
  (isId?" tanpa sitasi":" without local citations"));
 card.append(title);
 card.append(node("p",null,isId
  ?"Audit membandingkan klaim dengan cuplikan sumber. Pemeriksaan halaman sumber primer dibatasi dan tidak membaca PDF; kecocokan angka BUKAN pembuktian klaim. Tidak ada klaim yang dinyatakan otomatis terverifikasi."
  :"Review compares claims with cited excerpts. Original publisher HTML checks are limited and do not parse PDFs; numeric presence is NOT claim verification. No claims are automatically certified."));
 const ledger=qualityAudit?.claim_ledger?.schema==="sli-claim-evidence-ledger-v1"?qualityAudit.claim_ledger:null;
 if(ledger){
  const pending=Math.max(0,Number(ledger.not_sampled_candidates)||0);
  card.append(node("p","sli-ra-source-role",(isId?"JEJAK AUDIT · ":"EVIDENCE LEDGER · ")+
   String(Number(ledger.sampled_claims)||0)+(isId?" klaim ditelusuri; ":" sampled claims traced; ")+pending+
   (isId?" kandidat lain belum diaudit.":" additional candidates not sampled.")+
   (isId?" Seluruh klaim menunggu pemeriksaan editorial.":" Every claim still requires editorial review.")));
  card.append(node("p","sli-ra-source-role","SHA-256 · "+String(ledger.report_sha256||"").slice(0,24)+
   "… "+(isId?"Identitas perubahan laporan dan sumber, bukan sertifikat kebenaran.":"Change fingerprint of answer and sources, not a truth certificate.")));
  const exportButton=node("button",null,isId?"Unduh jejak audit (CSV)":"Export audit trail (CSV)");
  exportButton.type="button";
  exportButton.addEventListener("click",()=>{
   const cell=value=>{
    let v=String(value??"");
    if(/^[\s\u0000-\u001f]*[=+@-]/.test(v))v="'"+v;
    return '"'+v.replace(/"/g,'""')+'"';
   };
   const rows=[["claim_id","category","claim","review_status","risk_tier","issue_codes",
    "citation","source_title","source_url","source_period","source_date","source_type",
    "publisher_page_check","report_sha256"]];
   for(const r of (Array.isArray(ledger.claims)?ledger.claims:[])){
    for(const s of r.source_traces?.length?r.source_traces:[{}]){
     rows.push([r.claim_id,r.category,r.claim,r.review_status,r.risk_tier,
      (r.issues||[]).join("; "),s.citation||"",s.title||"",s.original_url||"",s.period||"",
      s.source_date||"",s.source_type||"",s.publisher_page_check||"",ledger.report_sha256]);
    }
   }
   // Local browser export only. Nothing is uploaded or auto-approved.
   const blob=new Blob(["\ufeff"+rows.map(row=>row.map(cell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
   const url=URL.createObjectURL(blob),a=node("a");
   a.href=url;a.download="sli-claim-evidence-audit.csv";
   document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  card.append(exportButton);
 }
 const probe=qualityAudit?.primary_source_probe;
 if(probe){
  card.append(node("p","sli-ra-source-role",(isId?"HALAMAN PRIMER: ":"PRIMARY PAGES: ")+
   String(Number(probe.checked)||0)+(isId?" dokumen diperiksa terbatas; URL hanya dari penerbit yang diizinkan.":" limited publisher page checks; allowlisted URLs only.")));
  for(const x of (Array.isArray(probe.results)?probe.results.slice(0,2):[])){
   const statuses={
    publisher_page_numbers_present:isId?"Angka tertulis pada halaman, belum membuktikan klaim":"Numbers present on page; claim unverified",
    publisher_page_numbers_incomplete:isId?"Sebagian angka belum ditemukan pada halaman":"Some numbers not found on page",
    publisher_page_readable_no_numeric_match:isId?"Halaman terbaca, tidak ada angka klaim untuk dicocokkan":"Page readable, no claim numbers to compare",
    pdf_requires_document_review:isId?"PDF: perlu peninjauan dokumen":"PDF: document review needed",
    publisher_unavailable_or_redirect:isId?"Halaman tidak tersedia atau dialihkan":"Publisher page unavailable or redirected",
    publisher_html_too_large:isId?"Halaman terlalu besar untuk pemeriksaan terbatas":"Page exceeds bounded HTML check",
    publisher_not_html:isId?"Sumber bukan HTML":"Source is not HTML",
    publisher_fetch_failed_or_timed_out:isId?"Gagal memuat halaman atau kedaluwarsa":"Publisher request failed or timed out"
   };
   card.append(node("p","sli-ra-source-role","["+String(x.citation||"?")+"] "+
    (statuses[String(x.status||"")]||(isId?"Belum diperiksa":"Not checked"))+
    (Array.isArray(x.claim_numbers_absent)&&x.claim_numbers_absent.length?" · "+
      (isId?"Perlu cek: ":"Review: ")+x.claim_numbers_absent.join(", "):"")));
  }
 }
 const items=Array.isArray(review.items)?review.items.slice(0,8):[];
 for(const item of items){
  const ids=Array.isArray(item.citations)?item.citations:[];
  const citation=ids.length?"["+ids.join(",")+"]":(isId?"Tanpa sitasi":"No citation");
  const types={commercial_operation:isId?"Status operasi":"Operations status",
   investment_decision:isId?"Keputusan investasi / FID":"Investment decision / FID",
   realized_investment:isId?"Nilai/realisasi investasi":"Investment amount / realization",
   law_status:isId?"Status peraturan":"Legal status",
   construction:isId?"Status pembangunan":"Construction stage",
   quantitative:isId?"Klaim kuantitatif":"Quantitative claim",
   factual:isId?"Pernyataan faktual":"Factual statement"};
  const p=node("p",null,citation+" "+(types[item.category]||String(item.category||"factual"))+
   " · "+String(item.claim||"").slice(0,260));
  card.append(p);
  if(Array.isArray(item.missing_numbers)&&item.missing_numbers.length)
   card.append(node("p","sli-ra-source-role",(isId?"Format/nilai angka belum cocok dengan cuplikan: ":"Number/format not matched in cited excerpt: ")+item.missing_numbers.join(", ")));
  if(ledger){
   const row=(Array.isArray(ledger.claims)?ledger.claims:[]).find(r=>r.claim===String(item.claim||"").slice(0,300));
   if(row){
    const issues={no_local_citation:isId?"Tanpa sitasi langsung":"No citation",
     numbers_absent_from_cited_excerpts:isId?"Angka tidak ditemukan pada cuplikan sumber":"Numbers absent from cited excerpts",
     discovery_or_dashboard_snapshot_citation:isId?"Bukti snapshot/temuan web belum ditinjau":"Unreviewed discovery/dashboard evidence",
     original_primary_document_not_established:isId?"Sumber primer belum dipastikan":"Primary document not established",
     primary_page_claim_entailment_not_checked:isId?"Dukungan klaim dalam dokumen primer belum diperiksa":"Primary source entailment not checked"};
    card.append(node("p","sli-ra-source-role",
     (isId?"Status: perlu pemeriksaan manusia · ":"Status: human review required · ")+
     (row.issues||[]).map(x=>issues[x]||x).join("; ")));
    for(const s of (row.source_traces||[]).slice(0,3)){
     const p=node("p","sli-ra-source-role",
      "["+String(s.citation)+"] "+String(s.title||s.source_id||"Source").slice(0,110)+
      " · "+String(s.source_date||s.period||"date not available"));
     const uri=safeUrl(s.original_url||"");
     if(uri){const a=node("a",null,isId?" · Buka sumber asli ↗":" · Open original ↗");
      a.href=uri;a.target="_blank";a.rel="noopener noreferrer";p.append(a);}
     p.append(node("span",null," · "+String(s.publisher_page_check||"not_checked_for_this_claim").replace(/_/g," ")));
     card.append(p);
    }
   }
  }
 }
 report.prepend(card);
}
function renderLiveDiscovery(payload,report,language="id"){
 const leads=(Array.isArray(payload?.sources)?payload.sources:[])
  .map((s,i)=>({...s,reference:i+1})).filter(s=>s.source_type==="live_web_discovery"&&safeUrl(s.source_url||"")).slice(0,6);
 if(!leads.length)return;
 const id=language!=="en";
 const section=node("section","sli-ra-live-discovery");
 const heading=node("h3",null,id?"Sumber baru yang ditemukan Tavily — belum terverifikasi":"New Tavily search leads — not yet verified");
 section.append(heading);
 section.append(node("p","sli-ra-evidence-note",id
  ?"Temuan ini berasal dari cuplikan pencarian web, bukan pemeriksaan artikel penuh. Bandingkan dengan status proyek dalam korpus SLI. Tanggal akses bukan tanggal publikasi."
  :"These are search snippets, not fully reviewed publisher articles. Compare them against SLI project baselines. Retrieval date is not publication date."));
 const cited=new Set([...String(payload.answer||"").matchAll(/\[(\d+)\]/g)].map(x=>Number(x[1])));
 const list=node("div","sli-ra-live-discovery-list");
 leads.forEach(s=>{
  const item=node("div","sli-ra-source-card");
  const a=node("a",null,"["+s.reference+"] "+String(s.title||s.publisher||"Source").slice(0,190));
  a.href=safeUrl(s.source_url);a.target="_blank";a.rel="noopener noreferrer";
  item.append(a);
  const date=String(s.period||"").trim(),pubDate=/^(?:19|20)\d{2}-\d{2}-\d{2}$/.test(date)?date:(id?"tanggal terbit belum diketahui":"publication date unknown");
  item.append(node("p","sli-ra-source-role",String(s.publisher||"")+" · "+pubDate+" · "+
   (cited.has(s.reference)?(id?"Dikutip sebagai temuan pencarian; klaim belum diverifikasi":"Cited as discovery; claims unverified"):
     (id?"Belum digunakan dalam analisis; periksa relevansi dan sumber aslinya":"Not used in analysis; review relevance and original source"))));
  list.append(item);
 });
 section.append(list);
 report.append(section);
}
function renderMonitoringSignals(payload){
 const wrap=$("raMonitoringSignals");wrap.replaceChildren();
 const signals=Array.isArray(payload?.monitoring_signals)?payload.monitoring_signals.filter(s=>s?.evidence_status==="publisher_page_matched").slice(0,8):[];
 if(!signals.length)return;
 const header=node("h3",null,"Monitoring sumber berita");
 const disclaimer=node("p","sli-ra-evidence-note","Tautan menuju halaman penerbit yang telah diperiksa; klaim peristiwa tetap harus didukung isi artikel.");
 wrap.append(header,disclaimer);
 for(const s of signals){
  if(typeof s?.title!=="string"||!safeUrl(s.url))continue;
  const card=node("div","sli-ra-source-card");
  const a=node("a",null,s.title.slice(0,260));a.href=s.url;a.target="_blank";a.rel="noopener noreferrer";
  card.append(a,node("p",null,[s.publisher,s.published_at_utc].filter(Boolean).join(" · ")));
  wrap.append(card);
 }
}

function reset(){
 state.sequence++;state.history=[];state.lastResult=null;state.busy=false;
 $("raMessages").replaceChildren();$("raSourcesList").replaceChildren();$("raMonitoringSignals").replaceChildren();$("raModelStatementBody")?.replaceChildren();$("raConversation").hidden=true;$("raPrompt").value="";
 $("raChatFiles").value="";$("raChatUploadConsent").checked=false;$("raExternalSearchConsent").checked=false;updateFileStatus();
 $("raFollowupPrompt").value="";
 enableControls();$("raPrompt").focus();
}
function externalApiDiagnostic(payload,language="id"){
 const id=language!=="en",ext=payload?.external_evidence;
 if(!ext)return id
  ?"KONEKTOR API · Backend belum melaporkan status Tavily atau World Bank. Pastikan Worker Research AI versi terbaru terpasang."
  :"API CONNECTORS · Backend did not report Tavily/World Bank status. Check the deployed Research AI Worker revision.";
 const web=String(ext.web_search||"unknown"),wb=String(ext.world_bank||"unknown");
 const count=Math.max(0,Number(ext.added_search_leads)||0);
 const official=Math.max(0,Number(ext.added_official_records)||0);
 const tavily={
  discovery_available:id?"Berhasil: "+count+" temuan web (belum diverifikasi)":"Available: "+count+" unverified web discovery leads",
  consent_not_granted:id?"Tidak dijalankan: kotak izin pencarian belum dicentang":"Not run: per-question search consent was not checked",
  not_configured:id?"Belum aktif: periksa TAVILY_ENABLED dan TAVILY_API_KEY di Worker":"Not configured: check TAVILY_ENABLED and TAVILY_API_KEY on Worker",
  files_not_sent_to_search:id?"Tidak dijalankan karena permintaan berisi lampiran; data privat tidak dikirim ke pencarian":"Not run because files are attached; private attachments were not sent to search",
  query_not_eligible:id?"Ditahan: pertanyaan mengandung indikasi informasi sensitif":"Blocked: the question appears to include sensitive information",
  no_discovery_results:id?"Pencarian selesai tetapi tidak ada cuplikan sumber yang lolos pemeriksaan awal":"Search completed without usable source snippets",
  timeout:id?"Gagal: Tavily melewati batas waktu":"Failed: Tavily timed out",
  upstream_unavailable:id?"Gagal: penyedia pencarian tidak terjangkau":"Failed: search provider unreachable"
 }[web]||(web==="provider_http_401"||web==="provider_http_403"
  ?(id?"Token Tavily ditolak (HTTP "+web.slice(-3)+")":"Tavily credential rejected (HTTP "+web.slice(-3)+")")
  :web==="provider_http_429"?(id?"Batas pemakaian Tavily tercapai (HTTP 429)":"Tavily quota or rate limit (HTTP 429)")
  :/^provider_http_[45][0-9]{2}$/.test(web)?(id?"Kesalahan API Tavily: "+web.slice(-3):"Tavily API error: "+web.slice(-3))
  :(id?"Status belum dikenal: "+web.slice(0,48):"Unknown status: "+web.slice(0,48)));
 const worldbank={
  retrieved:id?"Berhasil: "+official+" observasi nasional bertanggal":"Available: "+official+" dated national observations",
  partial:id?"Parsial: "+official+" observasi nasional, beberapa indikator tidak tersedia":"Partial: "+official+" national observations; some indicators unavailable",
  no_matching_national_indicators:id?"Tidak diperlukan untuk pertanyaan ini":"No matched indicators for this question",
  disabled:id?"Belum diaktifkan di Worker":"Not enabled on Worker",
  unavailable_or_no_numeric_observation:id?"Data tidak tersedia / permintaan API gagal":"No numeric observation or API unavailable"
 }[wb]||(id?"Status "+wb.slice(0,48):"Status "+wb.slice(0,48));
 const route=payload?.model_route==="cloudflare_ai_gateway"?"Cloudflare AI Gateway":
  payload?.model_route==="direct_openai"?"OpenAI langsung / Direct OpenAI":
  (id?"rute belum dilaporkan":"route not reported");
 return "TAVILY: "+tavily+" · WORLD BANK: "+worldbank+" · GPT: "+route+
  (id?" · Status API bukan verifikasi akurasi klaim.":" · API status is not claim-level fact verification.");
}
function makeExport(){
 if(!state.lastResult)return "";
 const last=state.lastResult,heading=state.language==="id"?"Laporan DERGUBA AI · SLI":"DERGUBA AI · SLI Research Report";
 if(last.mode==="local_ahp")return "# SLI · Academic AHP Analysis\n\n"+last.answer+"\n\n**Calculation:** Local AHP; respondent data never sent to SLI/AI server. Verify inputs and review CR.\n";
 const citations=last.sources.map((s,i)=>"["+(i+1)+"] "+apaEntry(s)).join("\n");
 const figures=(last.charts||[]).map(c=>"### "+c.title+" ("+c.period+" · "+c.unit+")\n"+c.points.map(p=>"- "+p.label+": "+p.value+" ["+p.source+"]").join("\n")+"\n"+c.note).join("\n\n");
 return "# "+heading+"\n\n"+(state.language==="id"?"**Cakupan:** Analisis bukti SLI terkurasi dan konektor API bila aktif; sumber web bukan fakta terverifikasi. Periksa periode dan rujukan asli.":"**Scope:** Curated SLI evidence plus optional API sources where enabled; web excerpts are not fact-checked. Verify dates and originals.")+"\n\n"+externalApiDiagnostic({external_evidence:last.externalEvidence,model_route:last.modelRoute},state.language)+"\n\n"+reportBody(last.answer,state.language)+"\n\n## "+(state.language==="id"?"Data grafik":"Chart data")+"\n"+(figures||"Tidak tersedia / Not available")+"\n\n## "+(state.language==="id"?"Sumber":"Sources")+"\n"+citations+
 "\n\n"+(state.language==="id"?"Dihasilkan oleh layanan AI; sumber tetap harus diverifikasi.":"AI-assisted draft; verify all original sources.")+"\n";
}
function updateFileStatus(){
 const files=[...$("raChatFiles").files];
 const el=$("raAttachmentStatus");
 if(!files.length){el.textContent=state.language==="id"?"Belum ada lampiran.":"No attachments.";return}
 if(files.length===1&&/\.(?:csv|json)$/i.test(files[0].name)){
  el.textContent=files[0].name+" · Jika berisi kuesioner AHP, dapat dihitung lokal tanpa mengirim berkas ke AI.";
  return;
 }
 try{
  if(!state.features)throw Error("Attachment validation module has not loaded");
  state.features.recognizedFiles(files);
  el.textContent=files.map(f=>f.name+" ("+Math.ceil(f.size/1024)+" KB)").join(" · ")+
   (ownerConfigured()&&state.config?.owner_test?.attachments_enabled===true?" · Uji privat: akan dikirim HANYA jika Anda menyetujui dan mengirim pertanyaan.":" · Belum dapat dikirim: pemrosesan lampiran menunggu aktivasi Worker privat.");
 }catch(e){el.textContent="Lampiran belum bisa digunakan: "+String(e.message||e)}
}
function methodStatus(){
 const select=$("raChatMethod"),el=$("raChatMethodStatus");
 if(select.value==="auto"){
  el.textContent=state.language==="id"?"AI memilih rancangan metodologi sesuai tujuan dan bukti. Model numerik hanya dijalankan jika mesin dan inputnya tersedia.":"AI recommends methodology based on objective and evidence. Numeric execution requires an available engine and valid inputs.";
  return;
 }
 const m=state.features?.METHODS?.find(x=>x.id===select.value);
 el.textContent=m?.status==="local"?
  "Mesin lokal tersedia bila data yang memenuhi syarat diberikan. Memilih nama metode dalam chat tidak otomatis menjalankan perhitungan.":
  "Metode tersedia sebagai panduan desain riset; kalkulasi numeriknya BELUM tersedia. AI tidak boleh mengklaim telah menjalankannya.";
}

async function tryLocalAhp(files,question,requestedMethod){
 if(files.length!==1||!/\.(?:csv|json)$/i.test(files[0].name))return false;
 if(!state.features)state.features=await import("./sli-investor-chat.mjs?v=20261018-chatfirst1");
 const module=await import("./sli-research-questionnaire.mjs?v=20261018-ahp2");
 const selected=requestedMethod==="ahp"||module.isAhpQuestion(question);
 const f=files[0];
 if(f.size>600000||!f.size){if(selected)throw Error("AHP local: file must be 1–600 KB");return false}
 const raw=await f.text();
 if(!selected){
  try{
   if(/\.csv$/i.test(f.name)){
    const parsed=(await import("./sli-analytical-core.mjs")).parseCsv(raw);
    if(!module.isAhpTable(parsed))return false;
   }else{
    const parsed=JSON.parse(raw);
    if(!(parsed?.pairwise&&parsed?.criteria)&&!module.isAhpTable(parsed?.rows||parsed))return false;
   }
  }catch{return false}
 }
 const output=module.analyseAhpText(raw,f.name);
 let markdown=module.ahpResultMarkdown(output,state.language);
 // Optional public SLI background: never used to alter respondent weights.
 try{
  const r=await fetch("./data/sli-research-province-preview.json",{cache:"no-store"});
  if(r.ok){
   const evidence=module.supplementarySliContext(question,await r.json());
   if(evidence)markdown+="\n\n"+evidence.markdown;
  }
 }catch{}
 const currentQuestion=question;append("user",question+" · File: "+f.name);
 const card=append("assistant",markdown);
 const plot=node("div","sli-ra-local-ahp-chart");
 plot.append(node("strong",null,state.language==="id"?"Visualisasi bobot kriteria · AHP lokal":"Criterion weights · local AHP"));
 for(const c of output.ranking){
  const row=node("div","sli-ra-local-ahp-row");
  const caption=node("span",null,c.name);
  const track=node("div","sli-ra-local-ahp-track");
  const bar=node("div","sli-ra-local-ahp-bar");bar.style.width=(100*c.weight).toFixed(2)+"%";track.append(bar);
  row.append(caption,track,node("span",null,(100*c.weight).toFixed(2)+"%"));plot.append(row);
 }
 card.append(plot);
 const explanation=node("p","sli-ra-evidence-note",
  state.language==="id"?
   "DIHITUNG DI BROWSER · Tidak ada berkas dikirim ke layanan AI. Hasil berasal dari kuesioner pengguna dan bukan verifikasi sumber resmi SLI; konsistensi AHP bukan validitas empiris.":
   "COMPUTED IN YOUR BROWSER · No files sent to an AI service. These are unverified questionnaire judgments, not validated SLI statistics; AHP consistency is not empirical validity.");
 card.prepend(explanation);
 state.lastResult={answer:markdown,question:currentQuestion,mode:"local_ahp",sources:[],charts:[]};
 renderSources([],markdown,[]);
 state.history.push({role:"user",content:question},{role:"assistant",content:markdown.slice(0,4500)});
 state.history=state.history.slice(-8);
 $("raChatFiles").value="";$("raChatUploadConsent").checked=false;updateFileStatus();
 enableControls();status(state.language==="id"?"AHP berhasil dihitung secara lokal. Laporan tersedia untuk diekspor.":"AHP computed locally. Report available for export.","ready");
 return true;
}

async function submit(){
 const question=$("raPrompt").value.trim(),mode=$("raMode").value;
 if(question.length<6||question.length>5000){status(state.language==="id"?"Tuliskan instruksi 6–5000 karakter.":"Enter an instruction with 6–5000 characters.");return}
 if(state.busy)return;
 const files=[...$("raChatFiles").files];
 const methodValue=$("raChatMethod").value||"auto";
 if(files.length===1&&/\.(?:csv|json)$/i.test(files[0].name)){
  try{if(await tryLocalAhp(files,question,methodValue)){$("raPrompt").value="";return}}
  catch(e){status("Kuesioner AHP belum dapat dihitung: "+String(e.message||e).slice(0,210));return}
 }
 if(files.length){
  if(!ownerConfigured()||state.config?.owner_test?.attachments_enabled!==true){status("Unggah PDF/gambar/office BELUM aktif sampai Cloudflare Owner Worker baru terpasang dan diverifikasi. Silakan kirim pertanyaan tanpa file.");return;}
  if(!$("raChatUploadConsent").checked){status("Setujui pengiriman lampiran ke penyedia AI atau kosongkan unggahan file.");return;}
  try{if(!state.features)state.features=await import("./sli-investor-chat.mjs?v=20261018-chatfirst1");state.features.recognizedFiles(files)}
  catch(e){status("Lampiran ditolak: "+String(e.message||e).slice(0,150));return}
 }
 const id=++state.sequence;
 append("user",question);$("raPrompt").value="";
 if(!isConfigured()&&!ownerConfigured()){append("system",tr("inactive"));status(tr("prelaunch"));return}
 const usingOwner=ownerConfigured();
 let bearer;
 if(usingOwner){bearer=$("raOwnerToken").value.trim();
  if(bearer.length<48){append("system",state.language==="id"?"Masukkan token Owner Test dari Cloudflare (bukan OpenAI API key).":"Enter the Cloudflare Owner Test token (not your OpenAI API key).");return;}
 }else{
  try{bearer=await window.SLIResearchAuth?.getAccessToken?.()}catch{bearer=null}
  if(!bearer||typeof bearer!=="string"){append("system",tr("missing"));status(tr("missing"));return}
 }
 state.busy=true;enableControls();
 const loading=append("system",tr("busy"));
 let workbenchAddon={methodology:"auto"};
 try{workbenchAddon=window.SLIAnalyticalWorkbench?.getRequestAddon?.()||workbenchAddon}
 catch(e){loading.parentNode?.remove();state.busy=false;enableControls();append("system",String(e.message||"Invalid uploaded data context"));return}
 const requestedMethod=$("raChatMethod").value||"auto";
 const requestBody={question,mode,language:state.language,history:state.history.slice(-8),...workbenchAddon,methodology:requestedMethod,
  external_search:usingOwner&&$("raExternalSearchConsent")?.checked===true};
 $("raExternalSearchConsent").checked=false; // One-question consent; no automatic subsequent disclosure.
 if(files.length){
  try{
   requestBody.attachments=await state.features.encodeAttachments(files);
   requestBody.upload_consent=true;
  }catch(e){loading.parentNode?.remove();state.busy=false;enableControls();status("Lampiran belum dikirim: "+String(e.message||e).slice(0,180));return}
 }
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),60000);
 try{
  const endpoint=usingOwner?state.config.owner_test.endpoint:state.config.api_endpoint;
  const headers=usingOwner?{"content-type":"application/json","x-sli-owner-test-token":bearer}:{"content-type":"application/json","authorization":"Bearer "+bearer};
  const response=await fetch(endpoint,{method:"POST",headers,body:JSON.stringify(requestBody),cache:"no-store",signal:controller.signal});
  const payload=await response.json().catch(()=>null);
  if(id!==state.sequence)return;
  if(!response.ok){const code=String(payload?.error||"http_"+response.status),detail=String(payload?.reason||"").slice(0,90);throw Error(code+(detail?" · "+detail:"")+" · HTTP "+response.status)}
  if(!payload||typeof payload.answer!=="string"||payload.mode!=="generative_rag"||!Array.isArray(payload.sources))throw Error("invalid_response");
   // Older deployed Workers silently sliced model output at exactly 9,000 characters.
   // Do not label such an unfinished report successful or allow it to be exported.
   if(payload.answer.length===9000)throw Error(state.language==="id"?"Backend Cloudflare masih versi lama: laporan terpotong pada 9.000 karakter. Deploy ulang Worker riset SLI.":"Cloudflare backend is outdated: report truncated at 9,000 characters. Redeploy the SLI research Worker.");
  loading.parentNode?.remove();
  state.lastResult={answer:payload.answer,sources:payload.sources,charts:Array.isArray(payload.charts)?payload.charts:[],qualityAudit:payload.quality_audit||null,evidenceStatus:String(payload.evidence_status||""),externalEvidence:payload.external_evidence||null,dashboardEvidence:payload.dashboard_evidence||null,modelRoute:String(payload.model_route||""),question,mode};
  const report=append("assistant",payload.answer);
  const articleReading=String(payload.evidence_status||"").includes("legal")||!!payload.quality_audit?.legal_article_gate;
  const legalLabels={detail:"Telusuri aturan & sumber",correct:"Koreksi analisis hukum",compare:"Bandingkan perubahan aturan",gaps:"Periksa kekurangan bukti"};
  const regularLabels={detail:"Perdalam dengan angka & sumber",correct:"Koreksi jawaban sebelumnya",compare:"Bandingkan skenario / wilayah",gaps:"Periksa kekurangan data"};
  document.querySelectorAll("[data-followup]").forEach(b=>{
   if(state.language==="id")b.textContent=(articleReading?legalLabels:regularLabels)[b.dataset.followup]||b.textContent;
  });
  if(!articleReading||state.lastResult.charts.length){
   window.SLIResearchVisuals?.renderCharts(state.lastResult.charts,report,state.lastResult.sources,state.language);
  }
  const statusCode=String(payload.evidence_status||"");
  const modernBackend=[
   "owner_staging_source_dated_corpus",
   "owner_staging_source_dated_energy_corpus",
   "owner_staging_legal_articles_and_index_metadata_status_not_certified",
   "owner_staging_source_limited_legal_review"
  ].includes(statusCode);
  const legalLimited=payload.quality_audit?.legal_article_gate?.source_limited===true;
  const legalRecovered=payload.quality_audit?.legal_article_gate?.recovered===true;
  const legalResult=statusCode.includes("legal")||legalRecovered;
  const summaryText=legalLimited?
   (state.language==="id"?"HASIL TERBATAS · AI menemukan rujukan pasal yang tidak cocok dengan dokumen primer tersedia. Interpretasi hukum tidak ditampilkan; hanya sumber dan langkah pemeriksaan yang dapat disajikan.":"SOURCE-LIMITED RESULT · Unsupported article claims were withheld. Only source references and verification steps are shown."):
   legalRecovered?
   (state.language==="id"?"PERLU VERIFIKASI · Sebagian analisis pasal dihilangkan karena bukti primer belum memadai. Tinjau naskah hukum resmi sebelum menggunakan hasil.":"NEEDS LEGAL REVIEW · Unsupported article paragraphs were removed. Review primary statute text before relying on the result."):
   legalResult?
   (state.language==="id"?"SLI REGULATORY AI · Rujukan hukum tersedia dalam corpus terbatas. Status berlaku, perubahan, dan isi pasal di luar bukti tetap harus diperiksa melalui JDIH.":"SLI REGULATORY AI · Limited legal evidence available. Verify legal status and unreviewed articles through the issuing JDIH."):
   modernBackend?
   ((Number(payload.external_evidence?.added_official_records)||0)+(Number(payload.external_evidence?.added_search_leads)||0)>0
    ?(state.language==="id"?"SUMBER SLI + API · Sumber eksternal memiliki status bukti berbeda; sumber web masih perlu diverifikasi.":"SLI + EXTERNAL API EVIDENCE · Sources have different verification levels; web discovery still needs review.")
    :(state.language==="id"?"SUMBER SLI TERKURASI · Gunakan tanggal dan periode sumber; catatan indeks bukan pemantauan real-time.":"CURATED SLI EVIDENCE · Check original publication dates; this is not live retrieval.")):
   (state.language==="id"?"OWNER TEST · Periksa sumber asli dan tanggal sebelum menggunakan analisis.":"OWNER TEST · Verify source documents and dates before relying on the analysis.");
  const note=node("div","sli-ra-evidence-note",summaryText);
  report.prepend(note);
  // Always show provider status — including disabled, missing consent and failed API calls.
  // A model answer can succeed solely on cached/curated SLI evidence while web discovery fails.
  report.prepend(node("p","sli-ra-evidence-note",externalApiDiagnostic(payload,state.language)));
  if(payload.dashboard_evidence){
   const d=payload.dashboard_evidence,used=Math.max(0,Number(d.selected_records)||0);
   const coverage=Math.max(0,Number(d.indexed_datasets)||0),status=String(d.status||"unknown");
   const label=status==="matched"?(state.language==="id"
      ?"DASHBOARD SLI · "+used+" bukti terkait dipilih dari "+coverage+" dataset bersumber; catatan bukan verifikasi independen."
      :"SLI DASHBOARDS · "+used+" relevant records retrieved across an index of "+coverage+" sourced datasets; not independently fact-checked.")
     :(state.language==="id"?"DASHBOARD SLI · Indeks belum menyediakan bukti tambahan ("+status+"); analisis memakai bukti lain yang tersedia."
       :"SLI DASHBOARDS · Index did not supply additional evidence ("+status+"); other available evidence used.");
   report.prepend(node("p","sli-ra-evidence-note",label));
  }
  if(!articleReading&&Number.isInteger(payload.secondary_news_index_count)&&payload.secondary_news_index_count>0){
   const count=payload.secondary_news_index_count,used=Number(payload.attributed_secondary_sources)||0;
   const description=state.language==="id"?
    "INDEKS BERITA SEKUNDER SLI · "+count+" catatan monitoring teratribusi, "+used+" dipakai sebagai bahan laporan. Dibandingkan dengan data resmi dan OSINT; atribusi media bukan otomatis verifikasi semua klaimnya.":
    "SLI SECONDARY NEWS INDEX · "+count+" attributed monitoring records, "+used+" used in this report. Compared with official data and OSINT; attribution alone does not verify every factual claim.";
   report.prepend(node("p","sli-ra-evidence-note",description));
  }
  const audit=payload.quality_audit;
  if(audit?.review_scope==="structural_only_not_factual_verification"&&!legalRecovered){
   const warning=audit.structural_status!=="complete_structure";
   const title=state.language==="id"?(warning?"Perlu tinjauan struktur laporan":"Struktur laporan lolos pemeriksaan awal"):(warning?"Report structure needs review":"Report structure passed initial checks");
   const issueNames={
    too_short:state.language==="id"?"teks terlalu pendek":"too short",
    too_few_sections:state.language==="id"?"bagian laporan kurang":"too few sections",
    missing_citations:state.language==="id"?"sitasi belum ada":"no citations",
    invalid_citation_indices:state.language==="id"?"nomor sitasi tidak sesuai":"invalid citation index",
    requested_geography_missing:state.language==="id"?"wilayah belum disebut":"requested geography missing",
    conclusion_heading_missing:state.language==="id"?"bagian kesimpulan belum teridentifikasi":"no conclusion section",
    possibly_truncated_ending:state.language==="id"?"bagian akhir mungkin terpotong":"ending may be truncated"
   };
   const names=(Array.isArray(audit.issues)?audit.issues:[]).map(s=>issueNames[s]||s).join(", ");
   const caveat=state.language==="id"?"Ini BUKAN verifikasi fakta, kecocokan sitasi, angka atau metode.":"This is NOT verification of factual claims, citation accuracy, numbers or methods.";
   report.prepend(node("p","sli-ra-evidence-note",title+(warning&&names?" · "+names:"")+" · "+caveat));
  }
  renderSources(payload.sources,payload.answer,state.lastResult.charts);
  renderClaimReview(payload.quality_audit,report,state.language);
  renderLiveDiscovery(payload,report,state.language);
  renderModelStatement(payload.answer,payload);
  renderMonitoringSignals(payload);
  state.history.push({role:"user",content:question},{role:"assistant",content:payload.answer.slice(0,5000)});
  state.history=state.history.slice(-8);
  $("raChatFiles").value="";$("raChatUploadConsent").checked=false;delete requestBody.attachments;updateFileStatus();
  $("raFollowupPrompt").value="";
  status(usingOwner?(state.language==="id"?"Laporan Owner Test selesai; verifikasi sitasi dan grafik sebelum digunakan.":"Owner Test report completed; verify citations and figures before use."):tr("ready"),"ready");
 }catch(err){
  if(id===state.sequence){loading.parentNode?.remove();const detail=String(err?.name==="AbortError"?"request_timeout_60s":err?.message||"network_unavailable").slice(0,190);append("system",tr("requestFail")+"\nDiagnosis: "+detail+"\nCatatan: backend Cloudflare Owner Test memerlukan deployment terpisah dari GitHub Pages.");status("Permintaan gagal · "+detail)}
 }finally{
  clearTimeout(timeout);if(id===state.sequence){state.busy=false;enableControls();}
 }
}
function setResearchLanguage(language){
 if(language!=="en"&&language!=="id")return;
 state.language=language;document.documentElement.lang=language;
 document.querySelectorAll("[data-id][data-en]").forEach(el=>el.textContent=el.getAttribute("data-"+language));
 document.querySelectorAll("[data-ra-lang]").forEach(button=>{
  const active=button.dataset.raLang===language;
  button.classList.toggle("active",active);
  button.setAttribute("aria-pressed",String(active));
 });
 $("raPrompt").placeholder=language==="id"?"Tanyakan tentang Indonesia, misalnya: bandingkan ketahanan energi dan sertakan sumber resmi.":"Ask about Indonesia, for example: compare energy security with official sources.";
 $("raFollowupPrompt").placeholder=language==="id"?"Contoh: jelaskan aturan pelaksana, cek perubahan terbaru, atau lengkapi sumber resmi yang belum tersedia.":"Example: explain the implementing rules, check recent amendments, or identify missing primary sources.";
 if(state.config&&!isConfigured()&&!ownerConfigured())status(language==="id"?(state.config.published_notice_id||tr("prelaunch")):(state.config.published_notice_en||tr("prelaunch")));
}
async function init(){
 try{
  state.features=await import("./sli-investor-chat.mjs?v=20261018-chatfirst1");
  state.features.fillChatMethods($("raChatMethod"));
 }catch(e){status("Library metodologi belum bisa dimuat; mode otomatis tetap tersedia.");}
 // Prefill a cross-sector dashboard research request; never auto-execute it.
 try{
  const prompt=new URLSearchParams(location.search).get("prompt");
  if(prompt&&prompt.length>=8&&prompt.length<=1600){
   $("raPrompt").value=prompt;
   const hint=document.createElement("p");hint.setAttribute("role","status");hint.className="sli-policy-handoff-note";
   hint.textContent=state.language==="id"?"Instruksi dari dashboard SLI dimuat. Periksa kembali sumber sebelum mengirim.":"SLI dashboard research request is ready. Review its evidence before submitting.";
   hint.style.cssText="border-left:3px solid #d7b678;padding:9px 12px;color:#dfcda7;background:#163146;border-radius:7px;font-size:12px;";
   $("raPrompt").insertAdjacentElement("beforebegin",hint);
  }
 }catch(_){}
 $("raChatMethod").addEventListener("change",methodStatus);
 $("raChatFiles").addEventListener("change",updateFileStatus);
 $("raAssistantForm").addEventListener("submit",e=>{e.preventDefault();submit()});
 $("raFollowupForm").addEventListener("submit",e=>{
  e.preventDefault();
  if(state.busy)return;
  const next=$("raFollowupPrompt").value.trim();
  if(next.length<6){status("Tuliskan pertanyaan lanjutan minimal enam karakter.");return;}
  $("raPrompt").value=next;
  submit();
 });
 const templates={
  detail:"Perdalam laporan terakhir dengan angka resmi SLI yang konkret dan sitasi lengkap. Jelaskan minimal 4 dimensi relevan dengan angka, periode, unit, serta batasannya; jangan mengulang kesimpulan umum.",
  correct:"Audit jawaban Anda sebelumnya. Identifikasi klaim tidak didukung sumber atau keliru, koreksi dengan angka dan sitasi SLI yang tersedia, jelaskan perubahan dan bagian yang belum bisa diverifikasi.",
  compare:"Lanjutkan topik tadi dengan perbandingan skenario atau wilayah yang paling relevan. Susun tabel data sebanding, asumsi, risiko, dan hal yang perlu diverifikasi.",
  gaps:"Jelaskan secara spesifik data penting yang tersedia dan belum tersedia di corpus SLI untuk menjawab pertanyaan tadi. Usulkan sumber resmi dan metode tambahan tanpa mengarang angka."
 };
 const legalTemplates={
  detail:"Telusuri aturan pelaksana yang relevan dengan analisis hukum tadi. Pisahkan teks primer yang tersedia, aturan turunan yang belum diverifikasi, relasi perubahan dan sitasi yang benar; jangan mengarang pasal.",
  correct:"Periksa setiap pernyataan hukum dalam jawaban sebelumnya. Koreksi jika sumber yang dikutip tidak mendukung klaim, bedakan ringkasan pasal dari naskah asli, serta sebutkan status hukum yang masih harus diperiksa.",
  compare:"Bandingkan instrumen hukum dan perubahannya yang benar-benar tercatat dalam corpus SLI. Jelaskan kewenangan, hubungan regulasi, dan celah bukti tanpa menyatakan aturan yang belum diverifikasi sebagai berlaku.",
  gaps:"Sebutkan dokumen, pasal, ketentuan peralihan, aturan pelaksana, dan data status JDIH yang masih belum tersedia untuk melengkapi analisis ini. Buat daftar verifikasi, bukan kesimpulan hukum tanpa bukti."
 };
 document.querySelectorAll("[data-followup]").forEach(button=>button.addEventListener("click",()=>{
  const key=button.dataset.followup;
  if(!state.lastResult)return;
  const legal=String(state.lastResult.evidenceStatus||"").includes("legal")||!!state.lastResult.qualityAudit?.legal_article_gate;
  $("raFollowupPrompt").value=(legal?legalTemplates[key]:templates[key])||"Mohon lanjutkan analisis dengan sumber yang relevan.";
  $("raFollowupPrompt").focus();
  $("raFollowupPrompt").scrollIntoView?.({block:"center",behavior:"smooth"});
 }));

 document.querySelectorAll("[data-ra-lang]").forEach(button=>button.addEventListener("click",()=>setResearchLanguage(button.dataset.raLang)));
 setResearchLanguage(state.language);methodStatus();updateFileStatus();
 // One-time same-tab Policy & Regulation handoff. Never auto-submit a legal question.
 // The prompt is a search lead only: the Worker must retrieve and verify its own evidence.
 try{
  const raw=sessionStorage.getItem("sli-policy-research-handoff");
  sessionStorage.removeItem("sli-policy-research-handoff");
  if(raw){
   const handoff=JSON.parse(raw);
   if(handoff.version===1&&Number.isFinite(handoff.created)&&Date.now()-handoff.created<10*60*1000&&typeof handoff.prompt==="string"&&handoff.prompt.length>=8&&handoff.prompt.length<=5000){
    $("raPrompt").value=handoff.prompt;
    $("raMode").value="deep_research";
    const note=document.createElement("p");
    note.className="sli-policy-handoff-note";
    note.setAttribute("role","status");
    note.textContent="Pertanyaan regulasi dari Policy Explorer telah disalin ke instruksi riset. Periksa kembali sebelum mengirim; rujukan dalam prompt belum menjadi bukti yang diverifikasi model.";
    note.style.cssText="border-left:3px solid #d7b678;padding:11px 13px;color:#dfcda7;background:#163146;border-radius:7px;font-size:12px;";
    $("raPrompt").insertAdjacentElement("beforebegin",note);
   }
  }
 }catch(_){/* storage unavailable or expired handoff — use the normal research form */}
 $("raNew").addEventListener("click",reset);
 $("raCopy").addEventListener("click",async()=>{if(!state.lastResult)return;try{await navigator.clipboard.writeText(makeExport());status(tr("copied"),"ready")}catch{status(tr("copyFail"))}});
 $("raExport").addEventListener("click",()=>{if(!state.lastResult)return;const file=new Blob([makeExport()],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(file);const a=node("a");a.href=url;a.download="SLI-research-brief.md";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url)});
 document.querySelectorAll("[data-template]").forEach(b=>b.addEventListener("click",()=>selectPrompt(b.dataset.template)));
 enableControls();
 try{
  const r=await fetch("./data/sli-research-assistant-config.json",{cache:"no-store"});
  if(!r.ok)throw Error("config_http");
  state.config=await r.json();
  if(ownerConfigured()){
   $("raOwnerInputRow").hidden=false;
   // Keep owner diagnostics opt-in; availability does not auto-expand the private panel.
   $("raOwnerState").textContent="Ready for owner-token test";
   $("raAccessLabel").textContent="DERGUBA AI · Owner Test";
   status(state.language==="id"?"Backend Owner Test tersedia. Masukkan token pribadi pada panel, lalu tulis prompt riset.":"Owner test backend available. Enter the private token and send a research prompt.","ready");
  }else if(isConfigured()){
   $("raAccessLabel").textContent="DERGUBA AI · Pro / Enterprise";
   $("raOwnerState").textContent="Pro / Enterprise";
   status(tr("ready"),"ready");
  }else{
   $("raAccessLabel").textContent="DERGUBA AI · Pre-launch";
   $("raOwnerState").textContent=state.language==="id"?"Belum terhubung":"Not connected";
   status(state.language==="id"?(state.config.published_notice_id||tr("prelaunch")):(state.config.published_notice_en||tr("prelaunch")));
  }
 }catch{status(tr("invalid"))}
}
document.addEventListener("DOMContentLoaded",init);
window.SLIResearchAssistant=Object.freeze({version:"2026-10-20-professional-report-exports",generation_requires_backend:true,method_catalog_count:49,follow_up_chat:true,owner_attachment_staging:true,
 getExportData:()=>state.lastResult?{answer:reportBody(state.lastResult.answer,state.language),sources:state.lastResult.sources||[],
  charts:state.lastResult.charts||[],language:state.language,
  question:state.lastResult.question||"",mode:state.lastResult.mode||"",
  title:(()=>{
   const heading=String(state.lastResult.answer||"").match(/^#{1,2}\s+(.+)$/m)?.[1]?.replace(/\*\*/g,"").trim()||"";
   const generic=/^(?:executive summary|ringkasan eksekutif|analisis|analysis|introduction|pendahuluan)$/i.test(heading);
   const fromQuestion=String(state.lastResult.question||"").replace(/^(?:jelaskan|explain|analisis|analyze|analyse)\s+/i,"")
    .split(/\b(?:sertakan|include|beserta referensi|dengan rujukan)\b/i)[0].replace(/[.,;:\s]+$/,"").trim();
   return (heading&&!generic?heading:fromQuestion||heading||"Laporan Riset SLI").slice(0,145);
  })()}:null});
})();