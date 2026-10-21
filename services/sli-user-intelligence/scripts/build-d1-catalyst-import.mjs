#!/usr/bin/env node
// Generate SQL for GitHub Actions -> remote D1 import of the *public* SLI ledger.
// No Cloudflare credentials or user account data are ever included in this file.
import {readFile,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {validateEvent} from "../src/matcher.mjs";

export function sqlQuote(value){
 return "'"+String(value).replace(/'/g,"''")+"'";
}
export function buildImportSQL(history,now=new Date().toISOString()){
 if(!history||history.schema_version!=="sli-catalyst-history-v2"||
  !Array.isArray(history.events)||history.events.length>1800)
  throw Error("Catalyst ledger schema/count mismatch");
 if(typeof history.published_at_utc!=="string"||
  !Number.isFinite(Date.parse(history.published_at_utc))||
  !Number.isFinite(Date.parse(now)))throw Error("Catalyst timestamps invalid");
 const seen=new Set();
 const parts=["-- Verified, public Catalyst source data. No private account data."];
 for(const event of history.events){
  if(!validateEvent(event)||seen.has(event.id))
   throw Error("Invalid or duplicate Catalyst event ID");
  seen.add(event.id);
  const body=JSON.stringify(event);
  if(body.length>8000)throw Error("Catalyst event exceeds database row size limit");
  parts.push("INSERT INTO source_events(event_id,detected_at_utc,event_json) VALUES("+
   [event.id,event.detected_at_utc,body].map(sqlQuote).join(",")+
   ") ON CONFLICT(event_id) DO UPDATE SET detected_at_utc=excluded.detected_at_utc,event_json=excluded.event_json;");
 }
 // Data only: the source is the checked-out version on the trusted main branch.
 // Write checkpoint LAST: if an SQL write fails, never advance freshness status.
 const checkpoint={
  schema_version:history.schema_version,
  synced_at_utc:now,
  published_at_utc:history.published_at_utc,
  event_count:history.events.length
 };
 parts.push("INSERT INTO service_state(key,value) VALUES('catalyst_source_sync',"+
  sqlQuote(JSON.stringify(checkpoint))+
  ") ON CONFLICT(key) DO UPDATE SET value=excluded.value;");
 return parts.join("\n")+"\n";
}
if(process.argv[1]?.endsWith("build-d1-catalyst-import.mjs")){
 const input=resolve(process.argv[2]||"../../data/sli-catalyst-history.json");
 const output=resolve(process.argv[3]||".catalyst-source-import.sql");
 try{
  const history=JSON.parse(await readFile(input,"utf8"));
  const sql=buildImportSQL(history);
  await writeFile(output,sql,{mode:0o600});
  console.log("Validated public Catalyst D1 import SQL ready: "+
   history.events.length+" events; no user information");
 }catch(error){
  console.error("SLI Catalyst source import blocked:",String(error));
  process.exitCode=1;
 }
}
