/* Energy Security unique context; reusable abbreviations now have one canonical entry. */
(function(){
'use strict';
const ROOT_ID='energyAppendixRoot';
const T=(en,id)=>window.SLIi18n?.language==='id'?id:en;
const text=(tag,label,cls)=>{const n=document.createElement(tag);if(cls)n.className=cls;n.textContent=label;return n};
function render(){
 const root=document.getElementById(ROOT_ID);if(!root)return;
 root.setAttribute('data-sli-no-translate','');
 root.replaceChildren();
 root.append(text('p',T(
   'Energy Security keeps only sector-specific evidence and measurement cautions here. General abbreviations, unit definitions and cross-sector methodology live in the unified appendix.',
   'Energy Security hanya menampilkan catatan bukti dan kehati-hatian pengukuran khusus sektor. Singkatan umum, definisi satuan dan metodologi lintas sektor disatukan dalam lampiran utama.'
 ),'esa-intro'));
 const dl=text('dl','', 'esa-list');
 const rows=[
  [T('Grid capability','Kemampuan jaringan'),T('MW of nameplate generation, MVA of transformer capacity, reliable local headroom and annual electricity output (GWh) must be checked separately.','MW kapasitas pembangkit, MVA trafo, cadangan daya andal setempat, serta produksi GWh tahunan harus diperiksa secara terpisah.')],
  [T('RUPTL implementation','Realisasi RUPTL'),T('Approved construction targets are plans, not operating new assets. PLN Batam and Java–Bali network boundaries must not be mixed.','Target pembangunan yang disetujui adalah rencana, bukan aset baru yang beroperasi. Sistem PLN Batam dan Jawa–Bali tidak boleh dicampur.')],
  [T('Fuel and minerals','BBM, gas dan mineral'),T('Oil lifting, refinery output, mine production, smelter feedstock, reserve estimates and actual sales each require a different denominator.','Lifting migas, hasil kilang, produksi tambang, bahan baku smelter, cadangan dan penjualan memiliki penyebut berbeda.')],
  [T('Energy security index','Indeks ketahanan energi'),T('The official 4A weighting and SLI sustainability lens are separated. The extra S is not a fifth official IKE score.','Pembobotan resmi 4A dipisahkan dari lensa keberlanjutan SLI. Unsur S tambahan bukan nilai IKE kelima yang resmi.')],
  [T('Source editions','Edisi sumber'),T('Historical statistical reports retain their stated reference years. A new edition is a review lead until its tables and denominators are verified.','Laporan statistik historis tetap menggunakan tahun acuannya. Edisi baru menjadi kandidat tinjauan sampai tabel dan definisinya diverifikasi.')]
 ];
 rows.forEach(([term,meaning])=>{
  const entry=text('div','','esa-entry');
  entry.append(text('dt',term,'esa-term'),text('dd',meaning,'esa-meaning'));
  dl.append(entry)
 });
 root.append(dl);
 const p=text('p','', 'esa-footnote');
 const a=document.createElement('a');a.href='./sli-glossary-methodology.html?domain=energy';a.textContent=T('Browse the complete, deduplicated SLI glossary and methodology →','Buka glosarium dan metodologi SLI lengkap tanpa duplikasi →');
 p.append(a,document.createTextNode(' · '));
 const b=document.createElement('a');b.href='./data/energy-appendix.json';b.textContent=T('Original energy terminology dataset','Dataset terminologi energi asli');
 p.append(b);
 root.append(p);
}
window.initSLIEnergyAppendix=render;
document.addEventListener('sli:languagechange',render);
})();