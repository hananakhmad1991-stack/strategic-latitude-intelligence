// Narrow original-text structure check; do not infer current consolidated law.
const verified={
 "uu 7 2021":{first:1,last:19,source_url:"https://pajak.go.id/index.php/id/peraturan/harmonisasi-peraturan-perpajakan"}
};
export function structuralAbsence(request,language="id"){
 const fact=verified[request?.law_key];
 const m=String(request?.article||"").match(/^Pasal (\d+)$/i);
 if(!fact||!m)return null;
 const n=Number(m[1]);
 if(n>=fact.first&&n<=fact.last)return null;
 const en=language==="en";
 const head=(en?"Article existence: ":"Keberadaan pasal: ")+request.article+" "+request.law_ref;
 const p=en?[
  "In the officially published original law, main articles are numbered 1 through 19. The requested article number does not occur as a main article in this instrument [1].",
  "This finding concerns the original enactment only. Articles of amended tax laws, later amendments and court decisions need separate verification.",
  "The system does not generate obligations or purported content for an article absent from the original law."
 ]:[
  "Pada naskah resmi undang-undang yang diundangkan, pasal utama bernomor 1 sampai 19. Nomor yang diminta tidak terdapat sebagai pasal utama instrumen ini [1].",
  "Temuan ini hanya tentang struktur naskah awal. Pasal dalam undang-undang pajak yang diubah, perubahan sesudahnya, dan putusan pengadilan harus diverifikasi tersendiri.",
  "Sistem tidak menyusun isi atau kewajiban hukum dari pasal yang tidak terdapat dalam naskah asli."
 ];
 const answer=[
  "## "+head,p[0],
  "## "+(en?"Scope of evidence":"Lingkup bukti"),p[1],
  "## "+(en?"Verification note":"Catatan verifikasi"),p[2]
 ].join("\n\n");
 const sources=[{index:1,id:"original_uu7hpp_structure",title:"UU 7/2021 · Naskah asli HPP (struktur pasal)",source_url:fact.source_url,
  source_date:"2021-10-29",publisher:"Direktorat Jenderal Pajak",geo:"Indonesia",
  source_type:"official_original_statute_structure_only"}];
 return {request,answer,sources,source_limited:true,model_called:false,
  article_text_verified:false,article_existence:"not_in_original_promulgated_instrument",
  review_scope:"verified_original_law_structure_missing_article"};
}
