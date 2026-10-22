/* Offline, zero-dependency SLI page/asset census. No external requests or provider keys. */
import {readdirSync,readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,dirname,relative,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const rootPages=readdirSync(root).filter(n=>n.endsWith('.html')).sort();
const errors=[],warnings=[],pages=[];
const ignore=v=>/^(?:https?:|mailto:|tel:|data:|javascript:|#|\/\/|\{)/i.test(v);
for(const page of rootPages){
 const html=readFileSync(resolve(root,page),'utf8');
 const refs=[...html.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)].map(m=>m[2].trim());
 const broken=[];
 for(const raw of refs){
  if(!raw||ignore(raw))continue;
  const clean=raw.split(/[?#]/)[0];
  if(!clean||clean.startsWith('/')||clean.includes('<')||clean.includes('${'))continue;
  const target=resolve(root,clean.replace(/^\.\//,''));
  if(!target.startsWith(root+'/')){warnings.push({page,ref:raw,reason:'outside_root'});continue;}
  if(!existsSync(target)){broken.push(raw);warnings.push({page,ref:raw,reason:'missing_local_target'});}
 }
 const hasViewport=/<meta\s+[^>]*name=["']viewport["']/i.test(html);
 const hasTitle=/<title[\s>]/i.test(html);
 const hasSharedNav=/js\/sli-navigation\.js/.test(html);
 const hasGlossaryLink=/sli-glossary-methodology\.html/.test(html);
 const hasGuideLink=/sli-user-guide\.html/.test(html);
 const hasLang=/<html\b[^>]*\blang=/i.test(html);
 const row={page,refs:refs.length,broken:broken.length,viewport:hasViewport,title:hasTitle,sharedNavigation:hasSharedNav,glossaryLink:hasGlossaryLink,guideLink:hasGuideLink,htmlLang:hasLang};
 pages.push(row);
 if(!hasViewport)errors.push({page,reason:'missing_viewport'});
 if(!hasTitle)errors.push({page,reason:'missing_title'});
 if(!hasLang)warnings.push({page,reason:'missing_html_lang'});
 if(!hasSharedNav)warnings.push({page,reason:'missing_shared_navigation'});
}
const report={schema:'sli-site-links-v1',generated_at:new Date().toISOString(),scope:'source-controlled root HTML; static literals only; no browser runtime',page_count:pages.length,error_count:errors.length,warning_count:warnings.length,errors,warnings,pages};
const output=resolve(root,'sli-site-links-audit.json');writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log('SLI sitewide source audit:',pages.length,'pages;',errors.length,'structural errors;',warnings.length,'warnings. Report:',relative(root,output));
for(const e of errors.slice(0,30))console.error('ERROR',e.page,e.reason);
for(const e of warnings.slice(0,20))console.warn('WARN',e.page,e.reason,e.ref||'');
if(errors.length)process.exitCode=1;
