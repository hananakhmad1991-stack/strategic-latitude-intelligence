/* SLI Expert Connect: local-only project brief generator. Never silently send or store client data. */
(()=>{"use strict";
  const form=document.getElementById("sliExpertForm");
  if(!form)return;
  const $=id=>document.getElementById(id);
  const MAILBOX="hananakhmad1991@gmail.com"; // Published on SLI homepage; do not add a new private contact.
  const allowedService=new Set(["expert_sourcing","consultation","custom_research","advisory"]);
  const messages={
    en:{subject:"SLI research & expert request",copy:"Brief copied. No request has been sent.",failed:"Clipboard unavailable; please select and copy the editable brief.",edit:"Review this draft before opening email. No request has been submitted.",email:"Email draft opened; you must review and send it yourself.",fallback:"If your email app does not open, copy the brief and email the SLI contact shown below."},
    id:{subject:"Permintaan riset & pakar SLI",copy:"Ringkasan disalin. Belum ada permintaan yang dikirim.",failed:"Clipboard tidak tersedia; silakan pilih dan salin ringkasan.",edit:"Periksa draf sebelum membuka email. Belum ada permintaan yang dikirim.",email:"Draf email dibuka; Anda perlu memeriksa dan mengirimnya sendiri.",fallback:"Jika aplikasi email tidak terbuka, salin ringkasan dan kirim ke kontak SLI yang ditampilkan."}
  };
  let language="en";
  try{const saved=localStorage.getItem("sli-ui-language");if(saved==="en"||saved==="id")language=saved}catch(_){}
  function updateLanguage(next){
    language=next==="id"?"id":"en";
    document.documentElement.lang=language;
    document.querySelectorAll("[data-en][data-id]").forEach(node=>{
      const translated=node.getAttribute("data-"+language);
      if(node.matches("input,textarea"))node.placeholder=translated;else node.textContent=translated;
    });
    document.querySelectorAll("[data-expert-lang]").forEach(node=>node.setAttribute("aria-pressed",String(node.dataset.expertLang===language)));
    try{localStorage.setItem("sli-ui-language",language)}catch(_){}
  }
  function value(id){return $(id).value.trim().replace(/[\u0000-\u001f\u007f]/g," ").slice(0,1000)}
  function chosenText(id){const select=$(id);return select.selectedOptions[0]?.textContent?.trim()||""}
  function buildBrief(){
    const fields=[
      ["Service / Layanan",chosenText("expertService")],
      ["Sector / Sektor",chosenText("expertSector")],
      ["Research question / Tujuan",value("expertObjective")],
      ["Expert expectations / Profil pakar",value("expertProfile")],
      ["Deliverable / Hasil",chosenText("expertDeliverable")],
      ["Timeline / Tenggat",chosenText("expertTimeline")],
      ["Organization / Organisasi",value("expertOrganization")||"Not specified"],
      ["Budget / Anggaran",chosenText("expertBudget")]
    ];
    return "SLI RESEARCH & EXPERT CONNECT — CLIENT PROJECT BRIEF\n\n"+
      fields.map(([title,val])=>title+":\n"+val).join("\n\n")+
      "\n\nRequest: Please review this brief and advise next steps, feasibility and quotation. Expert participation is subject to consent, screening, availability and client approval.\n\n"+
      "This is an initial inquiry, not an expert booking or engagement contract.";
  }
  function syncMailto(){
    // Keep mailto intentionally compact: several email clients reject long mailto URIs.
    // The complete brief stays in the editable textarea and can be copied manually.
    const brief=$("sliExpertDraft").value;
    const excerpt=brief.length>900?brief.slice(0,900)+"\n\n[Brief truncated for email-link compatibility: paste full copied brief here.]":brief;
    const subject=messages[language].subject;
    $("sliExpertEmail").href="mailto:"+MAILBOX+"?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(excerpt);
  }
  document.querySelectorAll("[data-expert-lang]").forEach(btn=>btn.addEventListener("click",()=>updateLanguage(btn.dataset.expertLang)));
  form.addEventListener("submit",event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    if(!allowedService.has($("expertService").value))return;
    const draft=buildBrief();
    $("sliExpertDraft").value=draft.slice(0,3200);
    $("sliExpertResult").hidden=false;
    $("sliExpertFeedback").textContent=messages[language].edit;
    syncMailto();
    $("sliExpertResultTitle").scrollIntoView({block:"start",behavior:"auto"});
    $("sliExpertDraft").focus();
  });
  $("sliExpertDraft").addEventListener("input",syncMailto);
  $("sliExpertCopy").addEventListener("click",async()=>{
    const text=$("sliExpertDraft").value;
    try{if(!navigator.clipboard?.writeText)throw Error("Clipboard API unavailable");await navigator.clipboard.writeText(text);$("sliExpertFeedback").textContent=messages[language].copy}
    catch(_){$("sliExpertFeedback").textContent=messages[language].failed;$("sliExpertDraft").focus();$("sliExpertDraft").select()}
  });
  $("sliExpertEmail").addEventListener("click",()=>{$("sliExpertFeedback").textContent=messages[language].email+" "+messages[language].fallback});
  const kind=new URLSearchParams(location.search).get("service");
  if(kind&&allowedService.has(kind))$("expertService").value=kind;
  updateLanguage(language);
})();
