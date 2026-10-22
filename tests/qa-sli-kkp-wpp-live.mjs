import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BIG_LAYER,WPP_CODES,wppCode,validateOfficialWPP,renderOfficialWPPPaths,officialWPPRasterURL,wppIdBatches,fetchOfficialWPP} from "../js/sli-kkp-wpp-live.mjs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const micro=i=>({type:"Feature",properties:{namobj:"WPP-RI "+WPP_CODES[i],kodwpp:WPP_CODES[i]},geometry:{type:"Polygon",coordinates:[[[100+i*.2,-5],[100+i*.2+0.1,-5],[100+i*.2+0.1,-4.9],[100+i*.2,-5]]]}});
test("Official BIG 11-code geoservice and inclusive geometry guards fail closed",()=>{
 assert.ok(BIG_LAYER.startsWith("https://kspservices.big.go.id/"));
 assert.equal(WPP_CODES.length,11);
 assert.equal(wppCode({namobj:"WPP-RI 571"}),"571");
 assert.equal(wppCode({kodwpp:"WPP 718"}),"718");
 assert.equal(wppCode({namobj:"WPP-RI 719"}),null);
 const fake={type:"FeatureCollection",features:WPP_CODES.map((x,i)=>micro(i))};
 assert.equal(validateOfficialWPP(fake).pass,true);
 assert.equal(renderOfficialWPPPaths(fake).length,11);
 assert.equal(validateOfficialWPP({...fake,features:fake.features.slice(1)}).pass,false);
 const malformed=structuredClone(fake);
 malformed.features[0].geometry.coordinates[0][1][0]=999;
 assert.equal(validateOfficialWPP(malformed).pass,false);
 const unclosed=structuredClone(fake);
 unclosed.features[0].geometry.coordinates[0][3][0]=110;
 assert.equal(validateOfficialWPP(unclosed).pass,false);
});
test("Official live map does not embed unreviewed WPP polygons in SLI files",()=>{
 const html=read("marine-fisheries-intelligence.html");
 const source=read("js/sli-kkp-wpp-live.mjs");
 for(const id of ["mfWPPLoad","mfWPPMap","mfWPPStatus","mfWPPSelected"])assert.equal(html.split('id="'+id+'"').length-1,1,id);
 assert.match(html,/kspservices\.big\.go\.id/);
 assert.match(html,/Tanpa poligon buatan/);
 assert.match(source,/returnGeometry:"true"/);
 assert.match(source,/mode:"cors"/);
 assert.match(source,/validateOfficialWPP\(geo\)/);
 assert.match(source,/No guessed polygon fallback/);
 assert.match(source,/addEventListener\("click"/);
 assert.ok(!source.includes("data:application/geo+json"));
});

test("Official BIG raster preview is served by same source, no locally invented boundary",()=>{
 const url=new URL(officialWPPRasterURL());
 assert.equal(url.hostname,"kspservices.big.go.id");
 assert.equal(url.pathname.endsWith("/MapServer/export"),true);
 assert.equal(url.searchParams.get("layers"),"show:21");
 assert.equal(url.searchParams.get("bboxSR"),"4326");
 assert.equal(url.searchParams.get("f"),"image");
 const html=read("marine-fisheries-intelligence.html");
 assert.equal(html.split('id="mfWPPLegend"').length-1,1);
 assert.match(read("js/sli-kkp-wpp-live.mjs"),/BIG-rendered WPP image/);
});

test("Provider returned OBJECTIDs are divided into bounded 3-feature batches",()=>{
 assert.deepEqual(wppIdBatches([9,7,3,5,4,1,10,6,2,8,11]),[[1,2,3],[4,5,6],[7,8,9],[10,11]]);
 assert.deepEqual(wppIdBatches(Array.from({length:12},(_,i)=>i+1)).at(-1),[10,11,12]);
 assert.throws(()=>wppIdBatches(Array.from({length:251},(_,i)=>i+1)),/invalid_objectIds/);
 assert.throws(()=>wppIdBatches([1,2]),/invalid_objectIds/);
 assert.throws(()=>wppIdBatches([1,1,2,3,4,5,6,7,8,9,10]),/invalid_objectIds/);
 assert.throws(()=>wppIdBatches([1,2,3,4,5,6,7,8,9,10,11],6),/batch_size/);
});
test("BIG feature fetch uses official objectIds first; a 403, missing zone or fabricated feature fails closed",async()=>{
 const calls=[],features=WPP_CODES.map((x,i)=>({...micro(i),properties:{namobj:"WPP-RI "+x,kodwpp:null}}));
 const json=x=>new Response(JSON.stringify(x),{status:200,headers:{"content-type":"application/json"}});
 const provider=async url=>{
  calls.push(url);
  const q=new URL(url).searchParams;
  if(q.get("returnIdsOnly")==="true")return json({objectIdFieldName:"objectid",objectIds:Array.from({length:11},(_,i)=>i+1)});
  const ids=q.get("objectIds")?.split(",").map(Number)||[];
  return json({type:"FeatureCollection",features:ids.map(id=>features[id-1])});
 };
 const r=await fetchOfficialWPP(provider);
 assert.equal(r.audit.pass,true);
 assert.equal(r.audit.features,11);
 assert.equal(r.strategy,"objectIds_batched");
 assert.equal(r.batches,4);
 assert.equal(calls.length,5);
 assert.equal(new URL(calls[0]).searchParams.get("returnIdsOnly"),"true");
 assert.equal(new URL(calls[1]).searchParams.get("returnGeometry"),"true");
 const sourceBlocked=async()=>new Response("Forbidden",{status:403});
 await assert.rejects(()=>fetchOfficialWPP(sourceBlocked),/BIG_batched_or_full_unavailable/);
 const incomplete=async url=>{
  const q=new URL(url).searchParams;
  if(q.get("returnIdsOnly"))return json({objectIds:Array.from({length:11},(_,i)=>i+1)});
  return json({type:"FeatureCollection",features:q.get("objectIds")?.split(",").slice(1).map(id=>features[Number(id)-1])||[]});
 };
 await assert.rejects(()=>fetchOfficialWPP(incomplete),/geometry_validation/);
});
