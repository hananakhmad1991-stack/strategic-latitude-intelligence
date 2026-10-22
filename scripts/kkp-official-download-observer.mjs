/* Observe only the browser's official KKP-originated export interaction.
 * Never inspect POST bodies, cookies, names/emails, downloaded rows or query strings.
 * A click is NOT proof that the remote service accepted or generated an export.
 */
export function observeKKPDownload(context,{timeoutMs=90000}={}){
 if(!Number.isInteger(timeoutMs)||timeoutMs<1)throw Error("invalid_download_timeout");
 let finish,done=false,timer;
 const promise=new Promise(resolve=>{finish=resolve});
 const subscribed=new Set();
 const counters={first_party_post_responses:[],possible_file_responses:[],
  first_party_http_errors:[],download_events:0,popup_tabs:0};
 const onDownload=download=>{
  counters.download_events++;
  settle(download);
 };
 function watchPage(page){
  if(subscribed.has(page))return;
  subscribed.add(page);
  page.on("download",onDownload);
 }
 const onPage=page=>{counters.popup_tabs++;watchPage(page)};
 const onResponse=response=>{
  try{
   const host=new URL(response.url()).hostname.toLowerCase();
   if(host!=="portaldata.kkp.go.id"&&!host.endsWith(".kkp.go.id"))return;
   const code=Number(response.status());
   const method=String(response.request().method()).toUpperCase();
   const h=response.headers();
   const type=String(h["content-type"]||"").toLowerCase();
   const attachment=!!h["content-disposition"];
   if(method==="POST"&&counters.first_party_post_responses.length<12)
    counters.first_party_post_responses.push(code);
   if((attachment||/csv|excel|spreadsheet|zip|octet-stream/.test(type))&&counters.possible_file_responses.length<12)
    counters.possible_file_responses.push({status:code,attachment,mime_category:
     /csv/.test(type)?"csv":/excel|spreadsheet/.test(type)?"excel":/zip/.test(type)?"zip":"binary_or_unknown"});
   if(code>=400&&counters.first_party_http_errors.length<12)counters.first_party_http_errors.push(code);
  }catch{}
 };
 function stop(){
  clearTimeout(timer);
  context.off("page",onPage);
  context.off("response",onResponse);
  for(const p of subscribed)p.off("download",onDownload);
 }
 function settle(download){
  if(done)return;
  done=true;stop();finish(download);
 }
 context.on("page",onPage);
 context.on("response",onResponse);
 for(const page of context.pages())watchPage(page);
 timer=setTimeout(()=>settle(null),timeoutMs);
 return {promise,diagnostics:()=>({
  ...counters,first_party_post_responses:[...counters.first_party_post_responses],
  possible_file_responses:counters.possible_file_responses.map(x=>({...x})),
  first_party_http_errors:[...counters.first_party_http_errors]
 }),cancel:()=>settle(null)};
}
