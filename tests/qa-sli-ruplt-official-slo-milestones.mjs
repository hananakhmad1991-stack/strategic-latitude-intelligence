import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const data=JSON.parse(read("data/sli-ruptl-official-inauguration-slo-2025.json"));
test("Official RUPTL follow-up timeline adds precisely 5 source-dated events from 4 facilities",()=>{
 assert.equal(data.schema,"sli-ruplt-primary-official-project-event-supplement-2025-v1");
 assert.equal(data.original_ruplt_sha256,"1308ee580c7c1642fe7817e000c87cb2dc87053e1fcef90606dcc1da396fd002");
 assert.equal(data.source_record_count,5);
 assert.equal(data.events.length,5);
 assert.equal(data.distinct_facilities,4);
 assert.equal(data.new_events_actual_cod_confirmed,0);
 assert.deepEqual(data.events.map(x=>x.event_type).sort(),[
 "government_inauguration_not_commercial_cod","government_inauguration_not_commercial_cod","government_inauguration_not_commercial_cod",
 "slo_certification_date_not_cod","slo_certification_month_reported_not_cod"
 ].sort());
 for(const x of data.events){
   assert.match(x.original_table,/^[ABC]\d+\.\d+$/);
   assert.ok(x.original_pdf_page>=600&&x.original_pdf_page<=1253);
   assert.match(x.event_primary_source_url,/^https:\/\/(www\.)?(esdm\.go\.id|web\.pln\.co\.id)/);
   assert.equal(x.verified_actual_cod,null);
   assert.equal(x.actual_2026_availability,null);
   if(x.event_date!==null)assert.match(x.event_date,/^\d{4}-\d{2}-\d{2}$/);
   else assert.match(x.event_period,/^\d{4}-\d{2}$/);
 }
});
test("Source distinction: IKN is 50MWac/72MWp inauguration, Ijen SLO February is NOT inferred date",()=>{
 const get=id=>data.events.find(x=>x.id===id);
 const ikn=get("ruplt-evidence-ikn-20250120-inauguration");
 assert.equal(ikn.event_date,"2025-01-20");
 assert.equal(ikn.observed_capacity_value,50);
 assert.equal(ikn.observed_capacity_unit,"MWac");
 assert.match(ikn.alternate_rating,/72 MWp/);
 assert.equal(ikn.capacity_directly_comparable_with_ruptl_mw,false);
 const asahan=get("ruplt-evidence-asahan3-20250120-inauguration");
 assert.equal(asahan.event_date,"2025-01-20");
 assert.equal(asahan.observed_capacity_value,174);
 assert.equal(asahan.planned_capacity_as_printed,"87 87 MW (two printed units)");
 const ijen=get("ruplt-evidence-ijen-202502-slo");
 assert.equal(ijen.event_date,null);
 assert.equal(ijen.event_period,"2025-02");
 assert.equal(ijen.observed_capacity_value,34);
 assert.equal(ijen.capacity_directly_comparable_with_ruptl_mw,false);
 assert.equal(data.events.filter(x=>x.site.includes("Ijen")).length,2);
 const lumut=get("ruplt-evidence-lumutbalai2-20250630-slo");
 assert.equal(lumut.event_date,"2025-06-30");
 assert.equal(lumut.event_type,"slo_certification_date_not_cod");
});
test("Existing RUPTL timeline classifies 9 events but only two unique COD facilities",()=>{
 const js=read("js/sli-ruptl-progress-event-timeline.js");
 assert.match(js,/supplement\.events\.length!==5/);
 assert.match(js,/all\.length!==9/);
 assert.match(js,/official_inauguration_not_cod/);
 assert.match(js,/slo_certificate_not_cod/);
 assert.match(js,/x\.verified_actual_cod!==null/);
 assert.match(js,/const cod=new Map/);
 assert.match(js,/sli:exportready/);
 assert.doesNotMatch(js,/innerHTML/);
});
