#!/usr/bin/env node
"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const registry=JSON.parse(read("data/sli-bps-agri-horti-2026-source-register.json"));
assert.equal(registry.schema,"sli-bps-agri-horti-2026-source-register-v1");
assert.equal(registry.table_count,82);
assert.equal(registry.tables.length,82);
assert.equal(registry.documents.length,2);
assert.equal(registry.coverage.agriculture_table_count,47);
assert.equal(registry.coverage.horticulture_table_count,35);
assert.equal(registry.coverage.all_verified_numeric_cells_public,0);
assert.equal(registry.coverage.nonstatistical_horticulture_directories_indexed,0);
assert.equal(registry.table_page_location_audit.table_starts_checked,82);
assert.equal(registry.table_page_location_audit.starts_matched,82);
assert.equal(registry.table_page_location_audit.multipart_tables,21);
assert.equal(registry.table_page_location_audit.additional_continuation_pages,32);
assert.equal(registry.coverage.statistical_table_pages_mapped,114);
assert.equal(registry.table_heading_discrepancies.length,4);
assert.deepEqual(registry.table_heading_discrepancies.filter(x=>x.issue==="heading_vs_contents_year").map(x=>x.id).sort(),["3.10","3.11","3.2"]);
assert.equal(registry.private_numeric_extraction_qa.watermark_affected_draft_cells,85);
assert.equal(registry.private_numeric_extraction_qa.unparseable_draft_cells,1);
assert.equal(registry.private_numeric_extraction_qa.watermark_separation_validation.independent_native_text_cells_matched,86);
assert.equal(registry.private_numeric_extraction_qa.watermark_separation_validation.independent_native_text_cells_disagreed,0);
assert.equal(registry.private_numeric_extraction_qa.watermark_separation_validation.visual_contact_sheet_cells_inspected,86);
assert.equal(registry.coverage.private_watermark_ambiguous_cells_source_checked,86);
assert.equal(registry.coverage.arithmetic_conflict_tables_unresolved,2);
assert.equal(registry.coverage.numeric_82_table_cell_qa_complete,false);
assert.equal(registry.coverage.bps_written_commercial_permission_on_file,false);
assert.ok(registry.private_numeric_extraction_qa.dash_policy.includes("distinct from numeric zero"));
assert.deepEqual(registry.private_numeric_extraction_qa.national_column_sum_difference_detected.map(x=>x.table_id),["6.1","6.2"]);
assert.equal(registry.private_numeric_extraction_qa.derived_metrics_and_maps_publication_allowed,false);
assert.equal(registry.research_records.length,16);
assert.equal(new Set(registry.tables.map(x=>x.document_id+"_"+x.id)).size,82);
assert.deepEqual(registry.documents.map(x=>x.total_pdf_pages),[154,668]);
const docs=Object.fromEntries(registry.documents.map(x=>[x.id,x]));
const counts={};for(const t of registry.tables){
 assert.ok(/^(5\.[1-7]\.|3\.|6\.)[0-9]+$/.test(t.id));
 assert.ok(docs[t.document_id]);
 assert.ok(Number.isInteger(t.pdf_page)&&t.pdf_page>0&&t.pdf_page<=docs[t.document_id].total_pdf_pages);
 assert.equal(t.pdf_page-t.printed_page,t.document_id==="agri2025"?20:16);
 assert.ok(Array.isArray(t.statistical_pdf_pages)&&t.statistical_pdf_pages[0]===t.pdf_page);
 assert.equal(t.statistical_pdf_pages.at(-1),t.pdf_page_end);
 assert.ok(t.source_locator.includes("PDF pp."));
 assert.match(t.page_locator_review,/pdf_text_table_id_matched_start/);
 assert.ok(t.status.includes("qa_pending"));
 assert.ok(t.publication_rights.includes("no_commercial_reproduction"));
 counts[t.document_id]=(counts[t.document_id]||0)+1;
}
assert.equal(counts.agri2025,47);
assert.equal(counts.horti2026,35);
for(const rec of registry.research_records){
 assert.match(rec.status,/metadata_only_rights_pending_no_numeric_claim/);
 assert.ok(rec.note.includes("Publisher search link is not original PDF"));
 assert.ok(!Object.hasOwn(rec,"value"));
 assert.match(rec.source_url,/^https:\/\/searchengine\.web\.bps\.go\.id\//);
}
const food=read("food-agriculture-intelligence.html"),js=read("js/sli-bps-agri-horti-source-panel.js"),marine=read("marine-fisheries-intelligence.html");
assert.match(food,/id="faBPS2026Catalog"/);
assert.match(food,/sli-bps-agri-horti-source-panel.js/);
assert.match(food,/sli-bps-agri-horti-source-panel.css/);
assert.match(marine,/food-agriculture-intelligence.html#fa-bps-2025-2026/);
assert.ok(!js.includes("No. Telp")&&!js.includes("source_original_pdf_url"));
class El{
 constructor(tag){this.tagName=tag;this.children=[];this.events={};this.textContent="";this.value=tag==="select"?"all":"";this.attributes={};this.style={};this.isConnected=true;}
 append(...n){this.children.push(...n)}
 replaceChildren(...n){this.children=n}
 addEventListener(event,fn){this.events[event]=fn}
 setAttribute(k,v){this.attributes[k]=v}
}
const root=new El("div");const listeners={};
const document={readyState:"loading",createElement:t=>new El(t),getElementById:id=>id==="faBPS2026Catalog"?root:null,addEventListener:(event,fn)=>listeners[event]=fn};
const window={};
vm.runInNewContext(js,{document,window,fetch:async()=>({ok:true,json:async()=>registry}),console,Number,Math,Map,Set});
assert.equal(window.SLIBPSAgriHortiCatalog.mode,"source-metadata-no-extracted-numeric-republication");
(async()=>{
 listeners.DOMContentLoaded();
 await new Promise(r=>setImmediate(r));
 const all=node=>[node,...node.children.flatMap(all)];
 let ui=all(root);assert.ok(ui.some(x=>x.textContent.includes("82")));
 assert.equal(ui.filter(x=>x.className==="fa-bps-entry").length,82);
 const selector=ui.find(x=>x.tagName==="select");
 selector.value="marine_fisheries";selector.events.change();
 ui=all(root);assert.equal(ui.filter(x=>x.className==="fa-bps-entry").length,9);
 selector.value="climate_environment";selector.events.change();
 ui=all(root);assert.equal(ui.filter(x=>x.className==="fa-bps-entry").length,1);
 const search=ui.find(x=>x.tagName==="input");search.value="notexist";search.events.input();
 ui=all(root);assert.equal(ui.filter(x=>x.className==="fa-bps-entry").length,0);
 console.log("PASS: BPS 154+668 page source catalog, 82 nonnumeric table references, Food/Marine nav, rights, search, DERGUBA anchors");
})().catch(e=>{console.error(e);process.exitCode=1});
