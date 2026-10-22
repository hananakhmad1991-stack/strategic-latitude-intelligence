import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the dataset ledger is runnable and does not certify missing numbers',()=>{
 execFileSync(process.execPath,['scripts/audit-sli-source-visibility.mjs'],{cwd:new URL('..',import.meta.url),stdio:'pipe'});
 const ledger=JSON.parse(read('artifacts/sli-data-visibility-ledger.json'));
 const inventory=JSON.parse(read('data/sli-user-dataset-recovery-inventory.json'));
 assert.equal(ledger.total,inventory.datasets.length);
 assert.equal(ledger.review_priorities.length,ledger.records.filter(r=>r.evidence_tier==='partial_or_reconciliation_pending'||r.unresolved_anchor_candidates.length>0||r.missing_files.length>0).length);
 assert.ok(ledger.records.every(r=>r.evidence_tier!=='verified'));
 assert.ok(ledger.records.every(r=>r.id&&r.status&&r.period));
 assert.ok(ledger.records.every(r=>r.numeric_structure&&Number.isInteger(r.numeric_structure.numeric_count)),'All families must publish numeric coverage');
 assert.ok(ledger.records.filter(r=>r.public_dataset).every(r=>r.numeric_structure.status==='structural_only_not_source_verified'),'Public JSON must parse without being mislabeled as verified');
 assert.ok(ledger.records.every(r=>r.numeric_structure.nonfinite_count===0),'Nonfinite source numerics must not silently pass');
 assert.ok(ledger.review_priorities.every(r=>/^P[01]_/.test(r.priority)));
 assert.equal(ledger.broken_file_references.length,0);
});
