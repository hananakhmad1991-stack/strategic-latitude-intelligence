/* Private Owner Desk UI. Served only after verified Cloudflare Access identity and Owner allowlist. */
export function ownerConsoleResponse(){
  // Per-response nonce; no CDN assets, inline event attributes or external scripts.
  const nonce=crypto.randomUUID().replaceAll("-","");
  const html=String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SLI · Private Research Desk</title>
<style nonce="__SLI_NONCE__">
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0c1929;color:#eef5fc;font:15px/1.5 system-ui,sans-serif}main{max-width:1100px;margin:auto;padding:24px}h1{font-size:26px}h2{font-size:19px}p,small{color:#afc2d5}section{padding:20px;margin:20px 0;background:#14273c;border:1px solid #33516b;border-radius:12px}label{display:block;margin:10px 0 4px;font-size:13px}input,textarea,select,button{font:inherit}input,textarea,select{width:100%;padding:11px;color:#eef5fc;background:#091c30;border:1px solid #537089;border-radius:7px}textarea{min-height:95px;resize:vertical}button{padding:10px 14px;background:#234762;color:white;border:1px solid #7397b2;border-radius:8px;cursor:pointer}button:focus-visible,a:focus-visible{outline:3px solid #dbbd75;outline-offset:2px}button:disabled{opacity:.5;cursor:default}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:14px}.results{display:grid;gap:8px}.case{width:100%;text-align:left}.case span{display:block;color:#cad9e7;font-size:12px}.status{color:#e8c981}pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#081a2b;padding:14px;border-radius:8px;font:13px/1.6 system-ui;max-height:450px;overflow:auto}.notice{border-left:3px solid #d7b678;padding-left:12px}.sr{position:absolute;clip-path:inset(50%);width:1px;height:1px;overflow:hidden}@media(max-width:680px){main{padding:12px}.grid{grid-template-columns:1fr}section{padding:14px}}
</style>
</head>
<body>
<main>
<header><h1>SLI · Private Research Desk</h1><p class="notice">Owner-only. Manually record an inquiry <strong>only after receiving it</strong>. This is not a public form, client booking system or automated expert registry.</p></header>
<section aria-labelledby="requestsTitle">
<h2 id="requestsTitle">Research requests</h2>
<div class="actions"><button type="button" id="refresh">Refresh private queue</button><label for="filter" class="sr">Status filter</label><select id="filter" style="max-width:250px"><option value="">All statuses</option><option value="new">New</option><option value="scoping">Scoping</option><option value="sourcing">Sourcing</option><option value="shortlisted">Shortlisted</option><option value="proposal_sent">Proposal sent</option><option value="approved">Approved</option><option value="in_progress">In progress</option><option value="delivered">Delivered</option><option value="declined">Declined</option><option value="cancelled">Cancelled</option></select></div>
<div id="requests" class="results" aria-live="polite">Loading…</div>
</section>
<section aria-labelledby="recordTitle">
<h2 id="recordTitle">Manually record a received inquiry</h2>
<p>Do not copy private client messages or names without permission and a reviewed retention purpose.</p>
<form id="newRequest">
<div class="grid">
<div><label for="service">Service</label><select id="service" required><option value="expert_sourcing">Find experts</option><option value="consultation">Consultation</option><option value="custom_research">Custom research</option><option value="advisory">Advisory</option></select></div>
<div><label for="sector">Sector</label><select id="sector" required><option value="energy">Energy</option><option value="digital">AI / digital</option><option value="investment">Investment</option><option value="food">Food</option><option value="policy">Policy</option><option value="geopolitics">Geopolitics</option><option value="other">Other</option></select></div>
</div>
<label for="objective">Client's research question (15–2000 characters)</label><textarea id="objective" minlength="15" maxlength="2000" required></textarea>
<label for="criteria">Required specialist experience (8–1000 characters)</label><textarea id="criteria" minlength="8" maxlength="1000" required></textarea>
<div class="grid">
<div><label for="organization">Organization (optional)</label><input id="organization" maxlength="160"></div>
<div><label for="email">Contact email (optional)</label><input id="email" type="email" maxlength="254" autocomplete="off"></div>
<div><label for="deliverable">Deliverable</label><select id="deliverable"><option value="discuss">Discuss</option><option value="call">Call</option><option value="shortlist">Shortlist</option><option value="brief">Brief</option><option value="report">Report</option></select></div>
<div><label for="timeline">Timeline</label><select id="timeline"><option value="flexible">Flexible</option><option value="3-5-days">3–5 days</option><option value="1-2-weeks">1–2 weeks</option><option value="longer">Longer</option></select></div>
<div><label for="budget">Budget guidance</label><select id="budget"><option value="not_provided">Not provided</option><option value="under500">Under $500</option><option value="500-2000">$500–$2,000</option><option value="2000-5000">$2,000–$5,000</option><option value="above5000">Above $5,000</option><option value="discuss">Discuss</option></select></div>
</div>
<label><input id="received" type="checkbox" required style="width:auto"> I personally confirm this inquiry was received legitimately and may be recorded for the stated purpose.</label>
<div class="actions"><button type="submit" id="record">Record manually</button></div>
</form>
</section>
<section aria-labelledby="detailTitle"><h2 id="detailTitle">Selected request</h2>
<p>Details and status history stay visible only to the authenticated Owner. No outbound message is sent.</p>
<pre id="details">Select a request above.</pre>
<div id="move" class="actions"></div>
<label for="note">Internal status note (optional, 400 characters max)</label><textarea id="note" maxlength="400" rows="2"></textarea>
</section>
<p id="feedback" role="status" aria-live="polite"></p>
</main>
<script nonce="__SLI_NONCE__">
"use strict";
(function(){
const $=id=>document.getElementById(id);
const transitions={new:["scoping","declined","cancelled"],scoping:["sourcing","declined","cancelled"],sourcing:["shortlisted","declined","cancelled"],shortlisted:["proposal_sent","sourcing","cancelled"],proposal_sent:["approved","sourcing","declined","cancelled"],approved:["in_progress","cancelled"],in_progress:["delivered","cancelled"],delivered:[],declined:[],cancelled:[]};
let selected=null;
async function api(path,options){
 const response=await fetch(path,{credentials:"same-origin",cache:"no-store",...options,headers:{"Accept":"application/json",...(options&&options.body?{"Content-Type":"application/json"}:{})}});
 const data=await response.json();
 if(!response.ok)throw Error((data&&data.error)||"Request failed ("+response.status+")");
 return data;
}
function msg(text){$("feedback").textContent=text;}
function clear(node){node.replaceChildren();}
function element(tag,text,css){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(css)n.className=css;return n;}
async function list(){
 const out=$("requests");clear(out);out.append(element("p","Loading owner queue…"));
 try{
 const qs=$("filter").value?"?status="+encodeURIComponent($("filter").value):"";
 const data=await api("/api/requests"+qs);
 clear(out);
 if(!data.items.length){out.append(element("p","No requests recorded for this selection."));return;}
 for(const item of data.items){
  const b=element("button",(item.organization||"Confidential organization")+" · "+item.service+" · "+item.sector+" · "+item.status,"case");
  b.type="button";b.append(element("span",item.created_at+" · v"+item.version));b.addEventListener("click",()=>detail(item.id));out.append(b);
 }
 }catch(e){clear(out);out.append(element("p","Queue unavailable: "+e.message));}
}
async function detail(id){
 clear($("move"));$("details").textContent="Loading details…";
 try{
 const data=await api("/api/requests/"+encodeURIComponent(id));
 selected=data.request;
 $("details").textContent=JSON.stringify({request:data.request,history:data.history},null,2);
 for(const next of (transitions[selected.status]||[])){
 const b=element("button","Move to "+next.replaceAll("_"," "));
 b.type="button";b.addEventListener("click",()=>move(next));$("move").append(b);
 }
 }catch(e){selected=null;$("details").textContent="Unable to view request: "+e.message;}
}
async function move(to){
 if(!selected)return;
 const payload={to,version:selected.version,note:$("note").value.trim()};
 if(to==="shortlisted"){
  if(!confirm("Confirm a consenting candidate is linked, screened for conflicts, and currently available?"))return;
  payload.screening_confirmed=true;
 }
 if(to==="approved"){
  if(!confirm("Confirm the client explicitly approved the proposal and terms?"))return;
  payload.client_approval_confirmed=true;
 }
 try{const id=selected.id;await api("/api/requests/"+encodeURIComponent(id)+"/status",{method:"POST",body:JSON.stringify(payload)});msg("Status recorded. No client or expert contacted automatically.");await detail(id);await list();}
 catch(e){msg("Status not updated: "+e.message);await detail(selected.id);}
}
$("refresh").addEventListener("click",list);$("filter").addEventListener("change",list);
$("newRequest").addEventListener("submit",async ev=>{
 ev.preventDefault();if(!$("received").checked)return;
 const btn=$("record");btn.disabled=true;
 try{
  const data={service:$("service").value,sector:$("sector").value,objective:$("objective").value.trim(),expert_criteria:$("criteria").value.trim(),organization:$("organization").value.trim(),contact_email:$("email").value.trim(),deliverable:$("deliverable").value,timeline:$("timeline").value,budget:$("budget").value};
  const result=await api("/api/requests",{method:"POST",body:JSON.stringify(data)});
  msg("Request recorded by Owner: "+result.id+". No automatic acknowledgment was sent.");
  $("newRequest").reset();await list();await detail(result.id);
 }catch(e){msg("Recording failed: "+e.message)}finally{btn.disabled=false;}
});
list();
})();
</script>
</body></html>`;
  const rendered=html.replaceAll("__SLI_NONCE__",nonce);
  return new Response(rendered,{status:200,headers:{
    "Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store, private",
    "X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer",
    "X-Frame-Options":"DENY","Permissions-Policy":"camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":"default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; img-src 'none'; style-src 'nonce-"+nonce+"'; script-src 'nonce-"+nonce+"'; connect-src 'self'"
  }});
}
