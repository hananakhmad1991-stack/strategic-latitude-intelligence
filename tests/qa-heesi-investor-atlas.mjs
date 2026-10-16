import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync('data/heesi-2025-investor-atlas.json','utf8'));
const core=JSON.parse(fs.readFileSync('data/heesi-2025-integrated.json','utf8'));
const geo=JSON.parse(fs.readFileSync('data/indonesia-provinces.geojson','utf8'));
const page=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('js/heesi-2025-investor-atlas.js','utf8');
assert.equal(d.id,'HEESI-2025-INVESTOR-ATLAS');
assert.equal(geo.features.length,38);
assert.equal(d.maps.length,7);
assert.equal(d.series.length,22);
const names=new Set(geo.features.map(x=>x.properties.name));
for(const p of d.maps){
 assert.ok(/^https:\/\//.test(d.source_url));
 assert.equal(new Set(p.values.map(x=>x.province)).size,p.values.length,'duplicate province '+p.id);
 assert.ok(p.values.every(x=>names.has(x.province)&&Number.isFinite(x.value)&&x.value>=0),'unmapped province '+p.id);
 assert.ok(Number.isInteger(p.pdf_page)&&p.unit&&p.coverage);
 const sum=p.values.reduce((s,x)=>s+x.value,0);
 assert.ok(Math.abs(sum-p.national_total)<=.021,'Reported national totals not reconciled '+p.id+': '+sum+' vs '+p.national_total);
}
for(const [id,n,rows,pg] of [
 ['spklu',4778,38,131],['spbklu',1936,38,131],['coal_resources',97836.2,26,86],['coal_reserves',33250.1,26,86],
 ['coal_inventory',32550.3,26,86],['biodiesel_capacity',22018189,13,144],['bioethanol_capacity',60000,13,144]
]){const m=d.maps.find(x=>x.id===id);assert.ok(m,id);assert.equal(m.values.length,rows);assert.equal(m.national_total,n);assert.equal(m.pdf_page,pg)}
const sp=d.maps.find(x=>x.id==='spklu');
assert.equal(sp.values.find(x=>x.province==='DKI Jakarta').value,1438);
assert.equal(sp.values.find(x=>x.province==='Papua Pegunungan').value,0,'source-reported zero distinct from no-data');
assert.equal(d.maps.find(x=>x.id==='biodiesel_capacity').values.find(x=>x.province==='Riau').value,4810345);
const coal=d.maps.find(x=>x.id==='coal_reserves');assert.equal(coal.values.find(x=>x.province==='Kalimantan Timur').value,15688.57);
const spenergy=d.series.find(x=>x.id==='spklu_gwh');assert.deepEqual(spenergy.years,[2020,2021,2022,2023,2024,2025]);
assert.deepEqual(spenergy.values,[.02,.07,.37,2.21,8.35,46.69]);
for(const s of d.series){
 assert.ok(s.years.length===s.values.length,'series year alignment '+s.id);
 assert.ok(s.values.every(x=>Number.isFinite(x)),'finite sourced values '+s.id);
 assert.ok([26,28,71,72,74,114,129].includes(s.printed_page),'unsupported PDF reference '+s.id);
}
assert.equal(core.provincial.locations.length,38,'legacy 38 province generation layers merged on map');
assert.equal(core.geothermal_provincial.locations.length,32,'geothermal 32 province source rows should carry over');
assert.ok(page.includes('id="he25InvestorAtlasEnergyRoot"'));
assert.ok(page.includes('id="he25InvestorAtlasInvestmentRoot"'));
assert.ok(page.includes("initSLIHEESIInvestorAtlas?.('he25InvestorAtlasEnergyRoot'"));
assert.ok(page.includes("initSLIHEESIInvestorAtlas('he25InvestorAtlasInvestmentRoot'"));
assert.ok(page.includes('js/heesi-2025-investor-atlas.js?v='));
assert.ok(page.includes('css/heesi-2025-investor-atlas.css?v='));
assert.ok(/fetch\(D,\{cache:"no-store"\}\)/.test(js));
assert.ok(js.includes('not provided by the source tables and is not fabricated'),'no manufactured coal province production');
const ctx={window:{},document:{},console};
vm.runInNewContext(js,ctx,{filename:'heesi-2025-investor-atlas.js'});
assert.equal(typeof ctx.window.initSLIHEESIInvestorAtlas,'function');
console.log('PASS: 9 interactive provincial layers, 7 source-extracted new province tables, 22 annual series, SPKLU 4,778 & SPBKLU 1,936, coal totals, kL biofuel reconciliation, no fake province consumption, two investor/energy mounts');
