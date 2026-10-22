import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {BIG_LAYER,WPP_CODES,wppCode,validateOfficialWPP,renderOfficialWPPPaths,officialWPPRasterURL} from "../js/sli-kkp-wpp-live.mjs";
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
