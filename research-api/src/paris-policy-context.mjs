/* SLI official policy-context bridge for Paris Agreement questions.
 * Metadata and NDC registry notices are not a substitute for enacted article text.
 */
import catalogue from "../../data/sli-paris-policy-context.json";
const norm=x=>String(x||"");
const contextQuery=/(?:paris|persetujuan iklim|unfccc|uu\s*(?:no\.?|nomor)?\s*16\s*(?:\/|tahun\s+)2016)/i;
const implementationQuery=/(?:transisi energi|kebijakan energi|emisi|ndc|kontribusi nasional|net.zero|implementasi|carbon|karbon|energy transition|policy implication|sectoral|sektoral)/i;
export function parisImplementationContextEvidence(question){
 const q=norm(question);
 if(!contextQuery.test(q)||!implementationQuery.test(q))return [];
 if(catalogue.schema!=="sli-paris-policy-context-v1"||!Array.isArray(catalogue.records))return [];
 return catalogue.records.filter(x=>/^https:\/\//.test(x.source_url)&&
  ["official_ndc_registry","official_regulatory_register"].includes(x.source_kind))
  .slice(0,3).map(x=>({
   id:x.id,title:x.title,publisher:x.publisher,source_url:x.source_url,source_date:x.document_date,
   period:"Document dated "+x.document_date+"; SLI metadata review "+catalogue.reviewed_at,
   text:"SOURCE-LINKED IMPLEMENTATION POLICY CONTEXT, not ratification law or verified clause text. "+
    x.summary+" LIMITATION: "+x.limitation+" General caveat: "+catalogue.caveat+
    " Full document reference: "+x.document_url,
   topic:"Indonesia Paris Agreement implementation energy emissions NDC governance",
   geo:"Indonesia",access:"pro"
  }));
}