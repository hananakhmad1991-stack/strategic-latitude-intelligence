import assert from "node:assert/strict";
import {buildImportSQL,sqlQuote} from "../scripts/build-d1-catalyst-import.mjs";

const row={
 id:"sli-catalyst-111111111111111111",kind:"news_indexed",title:"Supplier's update",
 detected_at_utc:"2026-10-20T12:01:00Z",sector:"minerals",
 source_url:"https://example.com/news",ticker_links:[]
};
const ledger={
 schema_version:"sli-catalyst-history-v2",
 published_at_utc:"2026-10-20T12:01:00Z",
 events:[row]
};
const sql=buildImportSQL(ledger,"2026-10-20T12:02:00Z");
assert.ok(sql.includes("INSERT INTO source_events("));
assert.ok(sql.includes("Supplier''s update"),"SQL string quotes must be escaped");
assert.ok(sql.includes("'catalyst_source_sync'"),"Import must update source checkpoint");
assert.equal(sqlQuote("x';DROP TABLE user_profiles;--"),"'x'';DROP TABLE user_profiles;--'");
assert.equal(sql.trim().split("\n").at(-1).startsWith("INSERT INTO service_state("),true,
 "Source sync checkpoint must be last");
assert.throws(()=>buildImportSQL({...ledger,events:[row,row]}),/duplicate/);
assert.throws(()=>buildImportSQL({...ledger,events:[{...row,id:"bad"}]}),/Invalid/);
assert.throws(()=>buildImportSQL({...ledger,events:[{...row,title:"x".repeat(9000)}]}),/Invalid/);
assert.throws(()=>buildImportSQL({...ledger,events:new Array(1801).fill(row)}),/schema\/count/);
console.log("Catalyst SQL mirror generator QA passed: validity, safe quoting and checkpoint order");
