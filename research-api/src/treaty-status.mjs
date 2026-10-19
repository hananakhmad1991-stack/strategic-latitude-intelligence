/* Verified treaty chronology from UN Treaty Collection depositary status.
 * Dates of national ratifying law and international treaty effect are distinct.
 */
import registry from "../../data/sli-paris-treaty-status.json";
const relevant=/paris|persetujuan iklim|unfccc|uu\s*(?:no\.?\s*)?16\s*[/\-]\s*2016/i;
export function parisTreatyTimelineEvidence(question){
 if(!relevant.test(String(question||"")))return [];
 if(registry.schema!=="sli-paris-treaty-status-v1"||!Array.isArray(registry.records))return [];
 return registry.records.filter(x=>x.retrieval_kind==="official_treaty_depositary_register"&&/^https:\/\//i.test(x.source_url))
  .map(x=>({
    id:x.id,title:x.title,
    text:"UN TREATY DEPOSITARY REGISTER, original treaty status evidence. "+x.summary+
      " Event: "+x.event+". Exact event date: "+x.date+". "+registry.legal_guardrail+
      " No sector-specific project permissions or NDC commitments are established by this treaty-status entry.",
    publisher:x.publisher,source_url:x.source_url,source_date:x.date,period:"2016 treaty-status event; registry checked "+registry.checked_at,
    topic:"international legal ratification status Paris Agreement Indonesia",geo:"Indonesia",access:"pro"
  }));
}