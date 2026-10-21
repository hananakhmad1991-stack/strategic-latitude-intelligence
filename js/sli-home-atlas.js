/* Lazy, dependency-free projected 3D atlas. Heights are normalized indicators,
   not terrain or risk scores. Source values and missingness are preserved. */
(()=>{'use strict';
const NS='http://www.w3.org/2000/svg';
const key=s=>String(s).toLowerCase().replace(/sumatera/g,'sumatra').replace(/daerah istimewa /g,'di ').replace(/[^a-z0-9]/g,'');
const metrics={grdp_current_2025_bn:['PDRB 2025','GRDP 2025','Rp miliar','IDR billion','grdp'],growth_real_2025_pct:['Pertumbuhan 2025','Growth 2025','%','%','grdp'],gini_expenditure_2026_03:['Gini Maret 2026','Gini March 2026','','','gini']};
function el(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
function svg(tag,attrs){const n=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n}
function link(text,url){const n=el('a',text);try{const u=new URL(url,location.href);if(!['https:','http:'].includes(u.protocol))return n;n.href=u.href;n.target='_blank';n.rel='noopener noreferrer'}catch{}return n}
window.initSLIHomeAtlas=()=>{
const host=document.getElementById('sliHomeAtlas');if(!host||host.dataset.ready)return;host.dataset.ready='1';
const id=document.documentElement.lang.startsWith('id'),t=(a,b)=>id?a:b;
host.dataset.sliNoTranslate='';host.replaceChildren();
const heading=el('h3',t('Jelajahi Indonesia · Atlas 3D','Explore Indonesia · 3D Atlas'));
const intro=el('p',t('38 provinsi. Indikator bertanggal, contoh proyek, dan sumber dalam satu peta.','38 provinces. Dated indicators, project examples and sources in one map.'));
const launch=el('button',t('Buka peta interaktif','Open interactive map'));launch.type='button';
host.append(heading,intro,launch);
launch.onclick=async()=>{launch.disabled=true;launch.textContent=t('Memuat…','Loading…');
try{
const [geo,data]=await Promise.all(['./data/sli-indonesia-province-38.geojson','./data/sli-research-province-preview.json'].map(async u=>{const r=await fetch(u);if(!r.ok)throw Error(r.status);return r.json()}));
if(!host.isConnected)return;
if(geo.features?.length!==38||data.provinces?.length!==38)throw Error('coverage');
const rows=new Map(data.provinces.map(p=>[key(p.name),p]));
const features=geo.features.map(f=>({name:f.properties.PROVINSI,geometry:f.geometry,row:rows.get(key(f.properties.PROVINSI))}));
const controls=el('div');controls.className='sli-atlas-controls';
const field=(text,node)=>{const l=el('label',text);l.append(node);controls.append(l)};
const metric=el('select');Object.entries(metrics).forEach(([v,m])=>{const o=el('option',m[id?0:1]);o.value=v;metric.append(o)});field(t('Indikator','Indicator'),metric);
const province=el('select');data.provinces.forEach(p=>{const o=el('option',p.name);o.value=key(p.name);province.append(o)});field(t('Provinsi','Province'),province);
const sector=el('select');[['all','Semua proyek','All projects'],['energy','Energi','Energy'],['food','Pangan','Food'],['marine','Kelautan','Marine']].forEach(([v,a,b])=>{const o=el('option',t(a,b));o.value=v;sector.append(o)});field(t('Filter contoh proyek','Project examples filter'),sector);
const mode=el('button','3D');mode.type='button';mode.setAttribute('aria-pressed','true');controls.append(mode);
const rotate=el('input');rotate.type='range';rotate.min='-45';rotate.max='45';rotate.value='0';field(t('Rotasi','Rotation'),rotate);
const zoom=el('input');zoom.type='range';zoom.min='1';zoom.max='2';zoom.step='.1';zoom.value='1';field(t('Perbesar','Zoom'),zoom);
const reset=el('button',t('Atur ulang','Reset'));reset.type='button';controls.append(reset);
const layout=el('div');layout.className='sli-atlas-layout';const frame=el('div');frame.className='sli-atlas-map';
const view=svg('svg',{viewBox:'0 0 960 430',role:'group','aria-label':t('Peta provinsi interaktif','Interactive province map')});frame.append(view);
const panel=el('aside');panel.setAttribute('aria-live','polite');layout.append(frame,panel);
const note=el('p',t('Tinggi dan warna relatif terhadap indikator terpilih, bukan elevasi atau skor risiko. Abu-abu = data tidak tersedia. Filter sektor hanya menyaring contoh proyek, bukan angka indikator.','Height and color are relative to the selected indicator, not elevation or risk. Grey = missing data. Sector filtering affects project examples only, not indicator values.'));
const attribution=link(t('Geometri: denyherianto · CC BY 4.0 · batas ilustratif','Geometry: denyherianto · CC BY 4.0 · illustrative boundaries'),'./data/sli-indonesia-province-38-ATTRIBUTION.txt');
host.replaceChildren(heading,intro,controls,layout,note,attribution);
let three=true;
function detail(){const p=rows.get(province.value),m=metrics[metric.value];panel.replaceChildren(el('h4',p.name));
const value=p[metric.value];panel.append(el('strong',Number.isFinite(value)?new Intl.NumberFormat(id?'id-ID':'en-US',{maximumFractionDigits:3}).format(value)+' '+m[id?2:3]:t('Tidak tersedia','Not available')),el('p',m[id?0:1]),link(t('Sumber indikator · BPS ↗','Indicator source · BPS ↗'),data.sources[m[4]].url));
panel.append(el('p',t('PDRB 2025 sementara; Gini Maret 2026. Periode berbeda.','2025 GRDP is preliminary; Gini is March 2026. Periods differ.')));
const projects=p.project_examples.filter(x=>sector.value==='all'||sector.value==='energy'&&/energy|geothermal|hydro|solar|wind/i.test(x.sector));
panel.append(el('h4',t('Contoh proyek dalam katalog','Project examples in catalog')));
if(!projects.length)panel.append(el('p',t('Belum ada contoh proyek untuk pilihan ini dalam dataset; bukan berarti tidak ada proyek.','No project examples for this selection in this dataset; this does not mean no projects exist.')));
projects.forEach(x=>{const a=el('article');a.append(link(x.title+' ↗',x.source_url),el('p',x.stage+' · '+x.evidence_date),el('small',t('Catatan bertanggal; bukan konfirmasi status terbaru atau realisasi investasi.','Dated record; not confirmation of current status or realized investment.')));panel.append(a)});
panel.append(link(t('Buka data sektoral ↗','Open sector data ↗'),sector.value==='food'?'./food-agriculture-intelligence.html':'./sli-sector-data-library.html'+({energy:'#power',marine:'#marine'}[sector.value]||'')));
}
function draw(){const values=features.map(f=>f.row?.[metric.value]).filter(Number.isFinite),lo=Math.min(...values),hi=Math.max(...values),a=Number(rotate.value)*Math.PI/180,z=Number(zoom.value);
const project=([lon,lat],h=0)=>{const x=(lon-118)*19,y=(lat+2)*19;const rx=x*Math.cos(a)-y*Math.sin(a),ry=x*Math.sin(a)+y*Math.cos(a);return [480+rx*z,220-ry*z*(three?.58:1)-h*z]};
const path=points=>'M'+points.map(p=>p.map(n=>n.toFixed(2)).join(',')).join('L')+'Z';
const shapes=[];
features.forEach(f=>{const v=f.row?.[metric.value],valid=Number.isFinite(v),ratio=valid?(hi>lo?(v-lo)/(hi-lo):.5):0,h=three&&valid?5+ratio*65:0;
const polys=f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates;
const color=!valid?'#64748b':province.value===key(f.name)?'#f2c879':`hsl(${185-ratio*20} 55% ${58-ratio*25}%)`;
polys.forEach(poly=>{const group=svg('g',{});if(three&&h)for(let i=0;i<poly[0].length-1;i++){const p=poly[0][i],q=poly[0][i+1];group.append(svg('path',{d:path([project(p),project(q),project(q,h),project(p,h)]),fill:'#183f50',stroke:'#244d60','stroke-width':'.3'}))}
const top=svg('path',{d:poly.map(r=>path(r.map(p=>project(p,h)))).join(' '),fill:color,stroke:'#9bcbd0','stroke-width':'.6','fill-rule':'evenodd',role:'button',tabindex:'0','aria-label':f.name+' · '+(valid?v:t('Tidak tersedia','Missing')),'aria-pressed':String(province.value===key(f.name))});
const title=svg('title',{});title.textContent=f.name+' · '+(valid?v:t('Tidak tersedia','Missing'));top.append(title);
const select=()=>{if(!f.row)return;province.value=key(f.name);draw();detail()};top.onclick=select;top.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();province.focus()}};group.append(top);shapes.push({group,y:project(poly[0][0])[1]})})});
view.replaceChildren(...shapes.sort((a,b)=>a.y-b.y).map(x=>x.group));
}
metric.onchange=province.onchange=()=>{draw();detail()};sector.onchange=detail;rotate.oninput=zoom.oninput=draw;
mode.onclick=()=>{three=!three;mode.textContent=three?'3D':'2D';mode.setAttribute('aria-pressed',String(three));draw()};
reset.onclick=()=>{rotate.value='0';zoom.value='1';draw()};draw();detail();
}catch{launch.disabled=false;launch.textContent=t('Coba muat ulang peta','Retry loading map');intro.textContent=t('Peta belum dapat dimuat. Dashboard sumber tetap tersedia.','Map could not load. Source dashboards remain available.')}};
};
document.addEventListener('sli:languagechange',()=>{const h=document.getElementById('sliHomeAtlas');if(h){delete h.dataset.ready;window.initSLIHomeAtlas()}});
})();
