/* Investment Evidence Health: provenance, recency, ownership and CAPEX completeness. */
(function(){"use strict";
const E=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined&&txt!==null)n.textContent=String(txt);return n};
const intDate=(s)=>{if(typeof s!=="string"||!/^\d{4}-\d{2}(-\d{2})?$/.test(s))return null;const n=new Date(s.length===7?s+"-01T12:00:00Z":s+"T12:00:00Z");return Number.isFinite(n.getTime())?n:null};
const fmtRatio=(x,n)=>n?Math.round(100*x/n)+"%":"Not available";
window.renderSLIInvestmentQuality=async function(root,source){
 if(!root)return;root.replaceChildren();
 const projects=Array.isArray(source.projects)?source.projects:[];
 const asOf=intDate(source.as_of)||new Date();
 const links=projects.filter(x=>x.ownership_ref).length;
 const actual=projects.filter(x=>x.capex_realized!==null&&x.capex_realized!==undefined&&/^https:\/\//.test(x.capex_realized_source||"")).length;
 const older=projects.filter(x=>{const d=intDate(x.evidence_date);return d&&(asOf-d)>365*86400000}).length;
 const undated=projects.filter(x=>!intDate(x.evidence_date)).length;
 const scopes=[["Company / project records",String(projects.length),"Includes multi-project portfolios and historical operational milestones."],["Project-level actual capex",actual+"/"+projects.length,"Missing audited realization is unknown, not zero."],["Linked ownership dossiers",links+"/"+projects.length,"An entity-level chain does not prove any natural-person BO."],["Historical evidence (>12 months)",String(older),"Older source dates may describe valid operations; recheck for current changes."]];
 const grid=E("div","inv-quality-grid");
 for(const [name,value,detail] of scopes){const c=E("div","inv-quality-card");c.append(E("span",null,name),E("strong",null,value),E("small",null,detail));grid.append(c)}
 root.append(grid);
 const p=E("p","tr-detail","Dataset reviewed as of "+(source.as_of||"unknown")+" · "+undated+" records without a parseable evidence month/date · "+fmtRatio(links,projects.length)+" mapped to legal-entity ownership profiles. These metrics assess data coverage, NOT certainty that each source claim is true.");root.append(p);
 const checks=E("details","inv-quality-checklist");checks.append(E("summary",null,"Research limitations & due-diligence checklist"));
 const ul=E("ul");
 const content=[
 "Never add PMA/PMDN realized investment to project-level announcements, conditional equity, loan facilities or company capex.",
 "Track whether direct shareholder lists have changed since their source-dated reference dates; corporate entities, PSC participating interests and natural-person beneficial owners differ.",
 "For each project, obtain the legal SPV name, primary project source, authorization, financing close, physical evidence, commissioning and audited project disbursement.",
 "Verify Indonesian geographic scope before assigning listed-parent group capex to an Indonesian investment.",
 ...((Array.isArray(source.limitations)?source.limitations:[]).slice(0,8))
 ];
 content.forEach(t=>ul.append(E("li",null,t)));checks.append(ul);root.append(checks);
 const after=E("p","tr-detail","Updated automatically when SLI's reviewed JSON dataset changes. The underlying disclosures and source verification do not update themselves in real time.");root.append(after);
};
})();