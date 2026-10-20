/* SLI User Intelligence opt-in sync. No tokens in static files or localStorage.
 * Disabled unless owner explicitly configures an authenticated Cloudflare Worker.
 */
(()=>{"use strict";
const ROOT="sliUserIntelligence",CONFIG="./config/sli-user-intelligence.json";
const PREF_KEY="sli-catalyst-v2-preferences",WATCH_KEY="sli-terminal-watchlist-v1";
const E=(tag,text,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const isID=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,indo)=>isID()?indo:en;
const getJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}};
const putJSON=(key,x)=>{try{localStorage.setItem(key,JSON.stringify(x));return true}catch{return false}};
const urls=(cfg)=>{
 if(!cfg||cfg.enabled!==true||typeof cfg.api_base!=="string")return null;
 try{const u=new URL(cfg.api_base);
  return u.protocol==="https:"&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?
   u.origin:null;
 }catch{return null}
};
const safeSource=s=>{try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const tickers=()=>{const w=getJSON(WATCH_KEY);return Array.isArray(w)?[...new Set(w.filter(x=>typeof x==="string"&&/^[A-Z0-9]{4}$/.test(x)))].slice(0,30):[]};
function localPreferences(){
 const p=getJSON(PREF_KEY)||{};
 const list=p.type&&p.type!=="all"?[p.type]:["news","project","regulation"];
 return {tickers:tickers(),sectors:[],kinds:list.filter(x=>["news","project","regulation"].includes(x)),
  include_sector:false,in_app:p.inApp!==false};
}
let cfg=null,api=null,notice="",busy=false;
const $=()=>document.getElementById(ROOT);
async function call(path,method="GET",payload){
 const r=await fetch(api+path,{method,credentials:"include",cache:"no-store",
  headers:payload?{"Content-Type":"application/json"}:{},
  body:payload?JSON.stringify(payload):undefined});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw Error(data.error||"HTTP "+r.status);
 return data;
}
async function act(action){
 if(busy)return;busy=true;notice="";
 try{await action();}catch(e){notice=T("Request not completed: ","Permintaan belum berhasil: ")+String(e.message||e)}
 finally{busy=false;render()}
}
function button(text,action){const b=E("button",text);b.type="button";b.disabled=busy;b.addEventListener("click",()=>act(action));return b}
function render(){
 const root=$();if(!root)return;root.replaceChildren();
 const head=E("div",undefined,"sli-uib-head");
 head.append(E("strong",T("SLI account sync & private inbox","Sinkronisasi akun & inbox privat")));
 head.append(E("p",T("Cross-device watchlists and in-app notifications require secure sign-in. No trading recommendations or automatic subscriptions.","Watchlist lintas perangkat dan notifikasi dalam aplikasi membutuhkan login aman. Tanpa rekomendasi transaksi atau langganan otomatis.")));
 root.append(head);
 if(!api){
  root.append(E("p",T("Not activated: Cloudflare Access and private D1 must be configured and validated by the owner. Your browser watchlist remains local.","Belum diaktifkan: Cloudflare Access dan D1 privat harus dikonfigurasi serta diuji pemilik. Watchlist tetap tersimpan lokal."),"sli-uib-note"));
  return;
 }
 const actions=E("div",undefined,"sli-uib-actions");
 const login=cfg.login_url&&safeSource(cfg.login_url)?cfg.login_url:api+"/api/me";
 const a=E("a",T("Sign in through Cloudflare Access ↗","Login melalui Cloudflare Access ↗"));a.href=login;a.target="_blank";a.rel="noopener noreferrer";actions.append(a);
 actions.append(button(T("Check account","Periksa akun"),async()=>{
  const m=await call("/api/me");
  notice=m.enrolled?T("Authenticated account connected. Preferences can now sync.","Akun terautentikasi. Preferensi dapat disinkronkan."):
    T("Authenticated; no synced preferences yet. Save them explicitly.","Login berhasil; belum ada preferensi tersimpan. Simpan dahulu jika ingin sinkronisasi.");
 }));
 actions.append(button(T("Save local watchlist to account","Simpan watchlist lokal ke akun"),async()=>{
  const p=localPreferences();
  await call("/api/preferences","PUT",p);
  notice=T("Account preferences saved for this login. No email or push notifications are enabled.","Preferensi akun tersimpan. Notifikasi email dan push belum aktif.");
 }));
 actions.append(button(T("Replace local watchlist from account","Ganti watchlist lokal dari akun"),async()=>{
  const data=await call("/api/preferences");
  if(!data.enrolled){notice=T("No saved account preferences yet.","Belum ada preferensi akun tersimpan.");return}
  if(!Array.isArray(data.preferences?.tickers))throw Error("invalid server watchlist");
  if(!putJSON(WATCH_KEY,data.preferences.tickers.filter(x=>/^[A-Z0-9]{4}$/.test(x)).slice(0,30)))throw Error("local storage unavailable");
  notice=T("Local watchlist updated. Reload this page to refresh the existing workspace.","Watchlist lokal diperbarui. Muat ulang halaman agar workspace lain ikut berubah.");
 }));
 actions.append(button(T("Read private inbox","Baca inbox privat"),async()=>{
  const feed=await call("/api/inbox?limit=15");
  showInbox(feed.items||[]);
  notice=T("Unread notifications: ","Notifikasi belum dibaca: ")+feed.unread;
 }));
 root.append(actions);
 const inbox=E("div",undefined,"sli-uib-inbox");inbox.id="sliUserIntelligenceInbox";root.append(inbox);
 if(notice)root.append(E("p",notice,"sli-uib-note"));
 root.append(E("p",T("Access relies on a protected Worker session. No token is stored in the browser. Settings on this device are uploaded or replaced only when you select those actions.",
  "Akses memerlukan sesi Worker yang dilindungi. Tidak ada token yang disimpan di browser. Preferensi perangkat ini hanya diunggah atau diganti jika tombol terkait ditekan."),"sli-uib-foot"));
}
function showInbox(items){
 const mount=document.getElementById("sliUserIntelligenceInbox");if(!mount)return;
 mount.replaceChildren();
 if(!items.length){mount.append(E("p",T("No notifications for this account.","Belum ada notifikasi akun ini.")));return}
 for(const item of items.slice(0,15)){
  const row=E("article",undefined,"sli-uib-item");
  row.append(E("strong",item.title||T("Catalyst record","Catatan katalis")));
  row.append(E("small",String(item.event_kind||"")+" · "+String(item.relevance||"")+" · "+String(item.created_at||"")));
  const link=safeSource(item.source_url);
  if(link){const a=E("a",T("Source ↗","Sumber ↗"));a.href=link;a.target="_blank";a.rel="noopener noreferrer";row.append(a)}
  if(!item.read_at&&/^[a-f0-9-]{36}$/i.test(item.id||"")){
   const b=E("button",T("Mark read","Tandai dibaca"));
   b.type="button";b.addEventListener("click",()=>act(async()=>{
    await call("/api/inbox/read","POST",{ids:[item.id]});item.read_at=new Date().toISOString();showInbox(items);
   }));row.append(b);
  }
  mount.append(row)
 }
}
async function init(){
 if(!$())return;
 try{
  const r=await fetch(CONFIG,{cache:"no-store"});
  if(r.ok)cfg=await r.json();
  api=urls(cfg);
 }catch{}
 render();
 document.addEventListener("sli:languagechange",render);
}
window.SLIUserIntelligenceClient={localPreferences,configured:()=>!!api};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();