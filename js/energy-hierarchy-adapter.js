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
 put("Sekretariat Jenderal DEN",minister,"administrative",govt); // DEN functionally, ESDM administratively (Perpres 26/2008).
 put("Kementerian ESDM / Minister",president,"policy",govt);
 for(const p of ["Kementerian Keuangan","Bappenas","Kementerian Investasi","Kementerian Perindustrian","Kementerian Lingkungan Hidup","Kementerian Kehutanan","Kementerian Dalam Negeri","Kementerian Perhubungan"])put(p,president,p==="Bappenas"?"planning":"policy",govt);
 put("BP BUMN",president,"policy",govt);
 for(const p of ["Ditjen Migas","Ditjen EBTKE","Ditjen Ketenagalistrikan","Ditjen Mineral dan Batubara","Ditjen Penegakan Hukum ESDM","Badan Geologi","BPSDM ESDM","LEMIGAS","Wakil Menteri ESDM","Sekretariat Jenderal ESDM","Inspektorat Jenderal ESDM"])put(p,minister,"reporting",govt);
 for(const p of ["SKK Migas","BPH Migas","BPMA"])put(p,minister,"coordination",govt); // Sector supervision; not claimed to be ministerial directorates.
 for(const p of ["BAPETEN","BRIN — Energy","BNPB","BMKG"])put(p,president,p.startsWith("BRIN")?"research":"policy",govt);
 put("Provincial governors",get("Kementerian Dalam Negeri"),"local-government",govt); // Administrative guidance only; local government remains autonomous.
 put("BP Batam",get("BP BUMN"),"zone-interface",govt); // Requested visual investment interface, NOT BP BUMN legal subordination.
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
  // Not a legal entity: keep the private EPC/developer umbrella solely in the canonical network.
  if(a.name.startsWith("Private project developers, IPPs and EPC contractors"))continue;
  const record=links.get(a.id)||{};
  const priv=marketIds.get(a.id);
  let lane=record.lane||(a.idx===3||a.idx===4?oversight:a.idx===2?state:govt);
  if(priv)lane="private";
  else if(a.idx===3||a.idx===4)lane=oversight;
  // Keep public-audit / legislative oversight out of the executive organization chart.
  if(a.name.startsWith("BPK RI"))lane=oversight;
  const person=a.person_name && !/^(Minister of|Head of|President Director|Institutional leadership|Governor|Designated local|National|Office of|Research organization|Agency leadership|Board \/)/i.test(a.person_name)?a.person_name:null;
  const node={
   id:a.id,title:a.name,person:a.name==="Kemenko Hilirisasi dan Transisi Energi"?"Bahlil Lahadalia":person,
   role:a.name.startsWith("Sekretariat Jenderal DEN")?
    a.role+" Functionally accountable to DEN; administratively accountable to the ESDM Minister under Presidential Regulation 26/2008.":
    a.name.startsWith("BP Batam")?
    a.role+" Displayed in the BP BUMN sector interface only for investment navigation: BP Batam is a separate zone authority, NOT a BP BUMN subsidiary or reporting unit.":
    a.name.startsWith("Provincial governors")?
    a.role+" Linked below Kemendagri for central-government guidance and supervision; provincial autonomy and local-government legal status remain distinct.":
    a.role,source:a.source,
   parent:lane===oversight?null:(record.parent??null),
   relation:lane===oversight?"oversight":(priv?"market":record.relation||(lane===govt?"coordination":"portfolio")),
   lane,verification:a.evidence_status||("Source "+(asOf||"undated")),
   evidence_date:asOf||null
  };
  if(priv){node.ownership_category=priv.category;node.affiliation=priv.affiliation;market.push(node);}
  else nodes.push(node);
 }
 // The unnamed private umbrella category is not a corporate entity or a joint venture.
 return {as_of:asOf||null,updated_note:"Energy hierarchy is an alternate visualization of the canonical Energy Governance actor dataset. DEN Secretariat follows DEN functionally and ESDM administratively. Provincial governments are shown through Kemendagri supervision without loss of autonomy. BP Batam is an investment-zone functional interface in the BP BUMN branch ONLY for visualization; no statutory subordinate relationship is implied. Government authority, independent DPR/DPD/BPK scrutiny, Indonesian SOE holdings and commercial investors are separate legal systems. Edges classified coordination are functional links, not statutory reporting; board offices and shareholdings are source-dated. The unnamed private-sector umbrella category remains in the canonical Power Map but is not shown as a fictitious company or JV.",sectors:{energy:{nodes,market}}};
}
window.buildSLIEnergyHierarchy=build;
})();