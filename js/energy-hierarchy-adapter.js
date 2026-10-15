/* Energy Security government / Danantara / private hierarchy derived from canonical governance data.
   No parallel list of officials: read people, mandates and original URLs from energy-governance-ccs.json. */
(function(){"use strict";
function build(governance,asOf){
 const layers=governance?.layers||[];
 if(layers.length!==6)throw Error("Energy governance requires its six source layers");
 const all=layers.flatMap((l,i)=>l.actors.map((actor,j)=>({...actor,idx:i,index:j,id:"en-"+i+"-"+j})));
 const get=(part)=>all.find(a=>a.name.includes(part));
 const president=get("Presidency / National Energy Council");
 const minister=get("Kementerian ESDM / Minister");
 const danantara=get("Danantara Indonesia (BPI)");
 const dam=get("PT Danantara Asset Management");
 const pertamina=get("PT Pertamina (Persero)");
 const pln=get("PT PLN (Persero)");
 const phe=get("PT Pertamina Hulu Energi");
 if(!president||!minister||!danantara||!dam||!pertamina||!pln||!phe)throw Error("Energy governance missing required anchor actors");
 const links=new Map();
 const put=(part,parent,relation,lane)=>{const actor=get(part);if(actor)links.set(actor.id,{parent:parent?.id??null,relation,lane})};
 const govt="government",state="state",oversight="oversight";
 put("Presidency / National Energy Council",null,"root",govt);
 put("Kemenko Hilirisasi",president,"coordination",govt);
 put("Penasihat Khusus Presiden",president,"advisory",govt);
 put("Sekretariat Jenderal DEN",president,"coordination",govt);
 put("Kementerian ESDM / Minister",president,"policy",govt);
 for(const p of ["Kementerian Keuangan","Bappenas","Kementerian Investasi","Kementerian Perindustrian","Kementerian Lingkungan Hidup","Kementerian Kehutanan","Kementerian Dalam Negeri","Kementerian Perhubungan"])put(p,president,p==="Bappenas"?"planning":"policy",govt);
 put("BP BUMN",president,"policy",govt);
 for(const p of ["Ditjen Migas","Ditjen EBTKE","Ditjen Ketenagalistrikan","Ditjen Mineral dan Batubara","Badan Geologi","LEMIGAS"])put(p,minister,"reporting",govt);
 for(const p of ["SKK Migas","BPH Migas","BPMA"])put(p,minister,"coordination",govt); // Sector supervision; not claimed to be ministerial directorates.
 for(const p of ["BAPETEN","BRIN — Energy","BNPB","BMKG"])put(p,president,p.startsWith("BRIN")?"research":"policy",govt);
 for(const p of ["Provincial governors","BP Batam"])put(p,null,"coordination",govt); // Local autonomy / separate statutory zone remit.
 put("Danantara Indonesia (BPI)",president,"portfolio",state);
 put("PT Danantara Asset Management",danantara,"portfolio",state);
 put("Danantara Investment Management",danantara,"portfolio",state);
 put("PT Danantara Sumberdaya Indonesia",danantara,"portfolio",state);
 put("PT PLN (Persero)",dam,"portfolio",state);
 put("PT Pertamina (Persero)",dam,"portfolio",state);
 put("PT Pertamina Patra Niaga",pertamina,"equity",state);
 put("PT Pertamina Hulu Energi",pertamina,"equity",state);
 put("PT Pertamina Hulu Indonesia",phe,"equity",state);
 put("PT Pertamina Geothermal Energy",pertamina,"equity",state);
 put("PT PGN Tbk",pertamina,"equity",state);
 put("PT PLN Indonesia Power",pln,"equity",state);
 put("PT PLN Energi Primer Indonesia",pln,"equity",state);
 put("Regional PLN units",pln,"reporting",state);
 put("PT Geo Dipa Energi",null,"portfolio",state); // State-linked: not inferred as Danantara subsidiary.
 put("PT SMI",null,"portfolio",state); // Public financing: no invented equity.
 const privateKeys=[
 ["PT Medco Energi","domestic","Indonesia"],
 ["ExxonMobil Cepu","foreign","United States"],
 ["bp Indonesia","foreign","United Kingdom"],
 ["INPEX Masela","foreign","Japan"],
 ["Searah (Eni","joint","Italy / Malaysia JV"],
 ["PT Rukun Raharja","domestic","Indonesia"],
 ["Harbour Energy","foreign","United Kingdom"],
 ["Mubadala Energy","foreign","United Arab Emirates (foreign state-owned)"],
 ["Private project developers","joint","Operator category; entity must be resolved by project"]
 ];
 const marketIds=new Map(privateKeys.map(([part,category,affiliation])=>[get(part)?.id,{category,affiliation}]).filter(([id])=>id));
 const nodes=[],market=[];
 for(const a of all){
  const record=links.get(a.id)||{};
  const priv=marketIds.get(a.id);
  let lane=record.lane||(a.idx===3||a.idx===4?oversight:a.idx===2?state:govt);
  if(priv)lane="private";
  else if(a.idx===3||a.idx===4)lane=oversight;
  // Keep public-audit / legislative oversight out of the executive organization chart.
  if(a.name.startsWith("BPK RI"))lane=oversight;
  const person=a.person_name && !/^(Minister of|Head of|President Director|Institutional leadership|Governor|National|Office of|Research organization|Agency leadership|Board \/)/i.test(a.person_name)?a.person_name:null;
  const node={
   id:a.id,title:a.name,person,role:a.role,source:a.source,
   parent:lane===oversight?null:(record.parent??null),
   relation:lane===oversight?"oversight":(priv?"market":record.relation||(lane===govt?"coordination":"portfolio")),
   lane,verification:a.evidence_status||("Source "+(asOf||"undated")),
   evidence_date:asOf||null
  };
  if(priv){node.ownership_category=priv.category;node.affiliation=priv.affiliation;market.push(node);}
  else nodes.push(node);
 }
 // Do not hide the existence of the private umbrella category, but distinguish it from a named company.
 return {as_of:asOf||null,updated_note:"Energy hierarchy is an alternate visualization of the canonical Energy Governance actor dataset. Government authority, independent DPR/DPD/BPK scrutiny, Indonesian SOE holdings and commercial investors are separate legal systems. Edges classified coordination are functional links, not statutory reporting; board offices and shareholdings are source-dated.",sectors:{energy:{nodes,market}}};
}
window.buildSLIEnergyHierarchy=build;
})();