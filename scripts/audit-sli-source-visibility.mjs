import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const inventory=JSON.parse(readFileSync(resolve(root,'data/sli-user-dataset-recovery-inventory.json'),'utf8'));
const sourceStatuses=new Set(['numeric_in_repository_now_visible','numeric_in_repository_already','full_user_normalized_upload_restored_to_repository']);
const records=inventory.datasets.map(d=>{
 const files=[d.public_dataset,d.main_dashboard?.split('#')[0],d.detail_dashboard?.split('#')[0]].filter(Boolean);
 const missing=files.filter(p=>!existsSync(resolve(root,p)));
 const anchors=[d.main_dashboard,d.detail_dashboard].filter(v=>v?.includes('#')).map(v=>({page:v.split('#')[0],anchor:v.split('#')[1]}));
 const anchorWarnings=anchors.filter(({page,anchor})=>{const f=resolve(root,page);return existsSync(f)&&!readFileSync(f,'utf8').includes('id="'+anchor+'"')&&!readFileSync(f,'utf8').includes("'"+anchor+"'");});
 const tier=missing.length?'broken_reference':!sourceStatuses.has(d.status)?'partial_or_reconciliation_pending':'file_present_not_fully_verified';
 const needsReview=!sourceStatuses.has(d.status)||Boolean(d.caution)||Boolean(missing.length)||Boolean(anchorWarnings.length);
 return {id:d.id,domain:d.domain,status:d.status,source_agency:d.source_agency,period:d.observation_period,dashboard:d.main_dashboard,detail:d.detail_dashboard,public_dataset:d.public_dataset||null,missing_files:missing,unresolved_anchor_candidates:anchorWarnings,evidence_tier:tier,needs_review:needsReview};
});
const priorities=records.filter(r=>r.evidence_tier!=='file_present_not_fully_verified'||r.unresolved_anchor_candidates.length).map(r=>({id:r.id,priority:r.missing_files.length?'P0_BROKEN_REFERENCE':r.unresolved_anchor_candidates.length?'P1_ANCHOR_REVIEW':'P1_PARTIAL_OR_RECONCILIATION',reason:r.status,missing_files:r.missing_files,anchor_candidates:r.unresolved_anchor_candidates}));
const report={schema:'sli-data-visibility-ledger-v1',scope:'Only 13 inventoried source families, not all user uploads or all SLI data',source_reviewed_at:inventory.reviewed_at,total:records.length,source_status_counts:Object.fromEntries([...new Set(records.map(r=>r.status))].map(s=>[s,records.filter(r=>r.status===s).length])),broken_file_references:records.filter(r=>r.missing_files.length),unresolved_anchor_candidates:records.filter(r=>r.unresolved_anchor_candidates.length).map(r=>({id:r.id,anchors:r.unresolved_anchor_candidates})),evidence_tier_counts:Object.fromEntries([...new Set(records.map(r=>r.evidence_tier))].map(t=>[t,records.filter(r=>r.evidence_tier===t).length])),review_priorities:priorities,records};
const dest=resolve(root,'artifacts/sli-data-visibility-ledger.json');mkdirSync(dirname(dest),{recursive:true});writeFileSync(dest,JSON.stringify(report,null,2)+'\n');console.log('Audited source-family inventory:',report.total,'missing file groups:',report.broken_file_references.length,'output:',dest);
console.log('Review priorities:',priorities.length);
for(const item of priorities)console.log('REVIEW',item.priority,item.id,'source-status='+item.reason);
if(process.env.GITHUB_STEP_SUMMARY){
 const markdown=[
  '## SLI audited dataset coverage — inventory only',
  '- Dataset groups inventoried: **'+report.total+'**',
  '- File-present, not fully verified: **'+(report.evidence_tier_counts.file_present_not_fully_verified||0)+'**',
  '- Partial / reconciliation pending: **'+(report.evidence_tier_counts.partial_or_reconciliation_pending||0)+'**',
  '- Broken references: **'+report.broken_file_references.length+'**',
  '- Candidate missing anchors: **'+report.unresolved_anchor_candidates.length+'**',
  '',
  '| Priority | Dataset | Recorded status |',
  '|---|---|---|',
  ...priorities.map(r=>'| '+r.priority+' | '+r.id+' | '+r.reason+' |'),
  '',
  'File presence or an audit PASS is not certification of every source number, copyright permission, or user-upload completeness.'
 ];
 const {appendFileSync}=await import('node:fs');
 appendFileSync(process.env.GITHUB_STEP_SUMMARY,markdown.join('\\n')+'\\n');
}
console.log('Evidence tiers:',JSON.stringify(report.evidence_tier_counts),'anchor candidates:',report.unresolved_anchor_candidates.length);
for(const r of report.broken_file_references)console.error(r.id,r.missing_files.join(', '));
if(report.broken_file_references.length)process.exitCode=1;
