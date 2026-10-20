import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const code=readFileSync(new URL("../scripts/audit-ruptl-official-full-pdf.py",import.meta.url),"utf8");
test("RUPTL complete PDF requires all pages, SHA-256 and cross-parser count",()=>{
 assert.match(code,/hashlib\.sha256\(DOCUMENT\.read_bytes\(\)\)\.hexdigest\(\)/);
 assert.match(code,/for index in range\(verified_page_count\)/);
 assert.match(code,/integrity_doc\.load_page\(index\)/);
 assert.match(code,/page\.get_text\("text"\)/);
 assert.match(code,/pages!=verified_page_count/);
 assert.match(code,/"full_page_integrity_checked":True/);
 assert.match(code,/"source_sha256":pdf_sha256/);
 assert.match(code,/RUPTL_ALL_PAGES_INTEGRITY_OK/);
});
test("Never convert keyword-only page leads to commissioned assets",()=>{
 assert.match(code,/keyword_only_unverified/);
 assert.match(code,/not_approved_project_registry/);
 assert.match(code,/source_transfer_incomplete_no_project_annex_verified/);
 assert.match(code,/if not is_complete:/);
});

test("RUPTL retry includes official-domain migrated Gatrik storage candidate, never auto-accepts candidate host",()=>{
 assert.match(code,/gatrik\.esdm\.go\.id\/gatrik\/gatrik-api\/storage\/migrasi\/download_index\/files\/b967d/);
 assert.match(code,/with fitz\.open\(str\(DOCUMENT\)\) as integrity_doc/);
 assert.match(code,/if not is_complete:/);
});
