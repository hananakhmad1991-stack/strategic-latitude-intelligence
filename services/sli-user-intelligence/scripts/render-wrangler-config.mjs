#!/usr/bin/env node
// Render per-run Wrangler config from non-secret CI variables. Never commit output.
import {readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {validateConfig} from "./cloudflare-activation-preflight.mjs";
export async function render(dir,e){
 validateConfig(e);
 const base=await readFile(path.join(dir,"wrangler.toml"),"utf8");
 const placeholder='database_id = "REPLACE_WITH_REAL_D1_DATABASE_ID"';
 const origin='CF_ALLOWED_ORIGIN = "https://hananakhmad1991-stack.github.io"';
 if(!base.includes(placeholder)||!base.includes(origin)||!base.includes('workers_dev = false'))
  throw Error("Unexpected base Wrangler config; refuse deployment");
 const cfg=base.replace(placeholder,'database_id = '+JSON.stringify(e.SLI_D1_DATABASE_ID))
 .replace('workers_dev = false','workers_dev = false\npreview_urls = false')
  .replace(origin,origin+"\nCF_ACCESS_ISSUER = "+JSON.stringify(e.SLI_ACCESS_ISSUER)+
   "\nCF_ACCESS_AUD = "+JSON.stringify(e.SLI_ACCESS_AUD))
  +'\n# Exact Access-protected Custom Domain (no workers.dev bypass)\n[[routes]]\npattern = '+
  JSON.stringify(e.SLI_API_HOSTNAME)+'\ncustom_domain = true\n';
 const dest=path.join(dir,".wrangler.activation.toml");
 await writeFile(dest,cfg,{mode:0o600});
 return dest;
}
if(process.argv[1]?.endsWith("render-wrangler-config.mjs")){
 render(path.resolve(process.argv[2]||"."),process.env)
  .then(()=>console.log("Temporary Cloudflare Worker config ready (access details and credentials not printed)"))
  .catch(e=>{console.error("Activation config blocked: "+e.message);process.exitCode=1});
}
