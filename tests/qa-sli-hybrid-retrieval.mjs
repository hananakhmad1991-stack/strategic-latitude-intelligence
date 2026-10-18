import {test} from "node:test";
import assert from "node:assert/strict";
import {cosineSimilarity,rerankWithEmbeddings,mergeRankedEvidence} from "../research-api/src/hybrid-retrieval.mjs";
const d=[{id:"jateng",geo:"Jawa Tengah"},{id:"jabar",geo:"Jawa Barat"}];
test("semantic cosine checks dimensions and empty vectors",()=>{
 assert.equal(cosineSimilarity([1,0,0,0,0,0,0,0],[1,0,0,0,0,0,0,0]),1);
 assert.equal(cosineSimilarity([1,0,0,0,0,0,0,0],[0,1,0,0,0,0,0,0]),0);
 assert.equal(cosineSimilarity([1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]),null);
 assert.equal(cosineSimilarity([1,2],[1,2]),null);
});
test("embedding results respect exact document IDs and score",()=>{
 const q=[1,0,0,0,0,0,0,0], index={jateng:q,jabar:[0,1,0,0,0,0,0,0],other:q};
 const ranked=rerankWithEmbeddings(d,q,index,{limit:5});
 assert.deepEqual(ranked.map(x=>x.document.id),["jateng"]);
 assert.deepEqual(mergeRankedEvidence([d[1]],ranked,2).map(x=>x.id),["jabar","jateng"]);
});
test("no invented semantic match without real vectors",()=>{
 assert.deepEqual(rerankWithEmbeddings(d,null,{}),[]);
 assert.deepEqual(rerankWithEmbeddings(d,[1,0,0,0,0,0,0,0],{}),[]);
});
