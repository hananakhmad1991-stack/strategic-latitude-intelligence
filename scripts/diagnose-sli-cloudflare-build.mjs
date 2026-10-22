import {existsSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const root=process.cwd();
const worker=join(root,'research-api/src/owner-test-worker.mjs');
const example=join(root,'research-api/wrangler.owner-test.toml.example');
const actual=join(root,'research-api/wrangler.toml');
const current=existsSync(actual)?readFileSync(actual,'utf8'):null;
const tpl=readFileSync(example,'utf8');
const warnings=[];
if(!existsSync(worker))throw Error('Owner Worker entrypoint missing');
if(!tpl.includes('main = "src/owner-test-worker.mjs"'))throw Error('Owner Worker template entrypoint mismatch');
if(!tpl.includes('name = "sli-research-owner-test"'))throw Error('Owner Worker template name mismatch');
if(current&&/REPLACE_WITH_|name = "sli-research-ai"/.test(current))warnings.push('research-api/wrangler.toml targets commercial template instead of Owner staging');
if(!current)warnings.push('No committed research-api/wrangler.toml; Cloudflare automatic build requires an explicit account build configuration, unlike controlled GitHub deploy which copies the Owner template.');
console.log('Owner Worker entry:',worker);
console.log('Expected Cloudflare root directory: research-api');
console.log('Expected Wrangler deployment config: wrangler.owner-test.toml.example copied into ignored wrangler.toml ONLY in controlled owner staging');
console.log('Automatic Cloudflare Git build must be separately configured or disconnected if staging uses GitHub-controlled deploy. Do not deploy public worker from template.');
warnings.forEach(x=>console.warn('CONFIG WARNING:',x));
if(process.env.GITHUB_STEP_SUMMARY){
 const {appendFileSync}=await import('node:fs');
 appendFileSync(process.env.GITHUB_STEP_SUMMARY,['### Cloudflare owner Worker build configuration','- Code entrypoint: `research-api/src/owner-test-worker.mjs`','- Template: `research-api/wrangler.owner-test.toml.example`','- Cloudflare dashboard automatic build configuration and its private logs remain unavailable to this script.','- Controlled GitHub staging deploy is a separate manual workflow; this check does not deploy.',...warnings.map(x=>'- Warning: '+x)].join('\n')+'\n');
}
