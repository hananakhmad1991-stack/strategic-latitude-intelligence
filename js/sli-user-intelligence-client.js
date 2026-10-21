/* SLI User Intelligence opt-in sync. No tokens in static files or localStorage.
 * Disabled unless owner explicitly configures an authenticated Cloudflare Worker.
 */
(()=>{"use strict";
const ROOT="sliUserIntelligence",CONFIG="./config/sli-user-intelligence.json";
const API_ORIGIN="https://sli-user-intelligence.hananakhmad1991.workers.dev";
const PREF_KEY="sli-catalyst-v2-preferences",WATCH_KEY="sli-terminal-watchlist-v1",SECTOR_KEY="sli-user-sector-alert-selection-v1";
const E=(tag,text,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=String(text);return x};
const isID=()=>document.documentElement.lang?.toLowerCase().startsWith("id");
const T=(en,indo)=>isID()?indo:en;
const getJSON=key=>{try{return JSON.parse(localStorage.getItem(key)||"null")}catch{return null}};
const putJSON=(key,x)=>{try{localStorage.setItem(key,JSON.stringify(x));return true}catch{return false}};
const urls=(cfg)=>{
 if(!cfg||cfg.enabled!==true||typeof cfg.api_base!=="string")return null;
 try{const u=new URL(cfg.api_base);
  return u.origin===API_ORIGIN&&!u.username&&!u.password&&!u.search&&!u.hash&&u.pathname==="/"?
   u.origin:null;
 }catch{return null}
};
const safeSource=s=>{try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password?u.href:null}catch{return null}};
const tickers=()=>{const w=getJSON(WATCH_KEY);return Array.isArray(w)?[...new Set(w.filter(x=>typeof x==="string"&&/^[A-Z0-9]{4}$/.test(x)))].slice(0,30):[]};
const localSector=()=>{const x=getJSON(SECTOR_KEY);return x&&typeof x==="object"?x:{enabled:false,sector:""};};
function localPreferences(){
 const p=getJSON(PREF_KEY)||{};
 const list=p.type&&p.type!=="all"?[p.type]:["news","project","regulation"];
 const opt=localSector();const possible=new Set(["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"]);
 const sector=possible.has(opt.sector)?opt.sector:"";
 return {tickers:tickers(),sectors:opt.enabled&&sector?[sector]:[],kinds:list.filter(x=>["news","project","regulation"].includes(x)),
  include_sector:!!(opt.enabled&&sector),in_app:p.inApp!==false};
}
let cfg=null,api=null,notice="",busy=false,inboxItems=[];
const $=()=>document.getElementById(ROOT);
async function call(path,method="GET",payload){
 const r=await fetch(api+path,{method,credentials:"include",mode:"cors",cache:"no-store",redirect:"follow",
  headers:{"Accept":"application/json",...(payload?{"Content-Type":"application/json"}:{})},
  body:payload?JSON.stringify(payload):undefined});
 const contentType=r.headers.get("content-type")||"";
 if(!r.ok)throw Error("API HTTP "+r.status);
 if(!contentType.includes("application/json"))throw Error(T("API did not return JSON. Check Access login.","API tidak mengirim JSON. Periksa login Access."));
 const data=await r.json();
 if(!data||typeof data!=="object")throw Error("Invalid API response");
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
 head.append(E("strong",T("SLI private account sync · pilot","Sinkronisasi akun privat SLI · percontohan")));
 head.append(E("p",T("Cloudflare Access sign-in is required. No automatic watchlist upload or download; changes require your explicit action. Notifications are in-app only.","Login Cloudflare Access diperlukan. Watchlist tidak diunggah atau diunduh otomatis; perubahan hanya dilakukan setelah tindakan dan persetujuan Anda. Notifikasi hanya dalam aplikasi.")));
 root.append(head);
 if(!api){
  root.append(E("p",T("Not activated: Cloudflare Access and private D1 must be configured and validated by the owner. Your browser watchlist remains local.","Belum diaktifkan: Cloudflare Access dan D1 privat harus dikonfigurasi serta diuji pemilik. Watchlist tetap tersimpan lokal."),"sli-uib-note"));
  return;
 }
 const filters=E("div",undefined,"sli-uib-sector");
 const holder=E("label");const cb=E("input");cb.type="checkbox";cb.checked=localSector().enabled===true;
 holder.append(cb,E("span",T("Also include a chosen sector (context only, not proven company impact)","Sertakan sektor pilihan (hanya konteks, bukan bukti dampak emiten)")));
 const select=E("select");
 const sectors=[
  ["",T("Choose a sector","Pilih sektor")],["energy",T("Energy","Energi")],["minerals",T("Minerals","Mineral")],
  ["coal",T("Coal","Batu bara")],["food",T("Food","Pangan")],["technology",T("Technology & AI","Teknologi & AI")],
  ["infrastructure",T("Infrastructure","Infrastruktur")],["transport",T("Transport","Transportasi")],
  ["manufacturing",T("Manufacturing","Manufaktur")]];
 for(const [value,label]of sectors){const opt=E("option",label);opt.value=value;select.append(opt)}
 select.value=localSector().sector||"";select.disabled=!cb.checked;
 const store=()=>putJSON(SECTOR_KEY,{enabled:cb.checked,sector:select.value});
 cb.addEventListener("change",()=>{select.disabled=!cb.checked;store()});
 select.addEventListener("change",store);
 filters.append(holder,select);root.append(filters);
 const actions=E("div",undefined,"sli-uib-actions");
 const login=api+"/api/me";
 const a=E("a",T("Sign in through Cloudflare Access ↗","Login melalui Cloudflare Access ↗"));a.href=login;a.target="_blank";a.rel="noopener noreferrer";actions.append(a);
 actions.append(button(T("Check account","Periksa akun"),async()=>{
  const m=await call("/api/me");
  if(m.identity_provider!=="cloudflare_access"||typeof m.enrolled!=="boolean")throw Error("Invalid account response");
  if(m.enrolled&&!Array.isArray(m.preferences?.tickers))throw Error("Invalid account preferences");
  const names=m.enrolled?m.preferences.tickers.join(", ")||T("(none)","(kosong)"):"—";
  notice=m.enrolled?
   T("Connected. Account tickers: ","Terhubung. Watchlist akun: ")+names+
   T(". No changes were made.",". Tidak ada data yang diubah.") :
   T("Login valid; no cloud watchlist yet. No changes were made.","Login berhasil; belum ada watchlist akun. Tidak ada data yang diubah.");
 }));
 actions.append(button(T("Replace account watchlist from this browser","Ganti watchlist akun dari browser ini"),async()=>{
  const local=localPreferences();
  const remote=await call("/api/preferences");
  if(typeof remote.enrolled!=="boolean"||!remote.preferences||!Array.isArray(remote.preferences.tickers))
    throw Error("Invalid account preferences");
  if(remote.enrolled&&remote.preferences.tickers.length>0&&local.tickers.length===0)
    throw Error(T("Refusing to overwrite saved tickers with an empty browser watchlist. Restore your local watchlist first.","Tidak boleh menimpa watchlist akun yang berisi ticker dengan watchlist browser kosong. Pulihkan watchlist browser dahulu."));
  const oldTickers=remote.enrolled?remote.preferences.tickers.join(", ")||"—":T("(not enrolled)","(belum terdaftar)");
  const newTickers=local.tickers.join(", ")||"—";
  const before=JSON.stringify(remote.preferences),after=JSON.stringify(local);
  if(remote.enrolled&&before===after){
   notice=T("Account preferences already match this browser. No changes needed.","Preferensi akun sudah sesuai dengan browser. Tidak ada perubahan.");return;
  }
  const question=T("Replace ACCOUNT preferences?\nCurrently in account: ","GANTI preferensi AKUN?\nSaat ini di akun: ")+oldTickers+
    T("\nFrom this browser: ","\nDari browser ini: ")+newTickers+
    T("\nThis changes tickers, sectors, alert kinds and in-app settings. The account settings will be overwritten; other accounts are unaffected.",
      "\nTicker, sektor, jenis notifikasi dan pengaturan in-app akan diganti. Preferensi akun saat ini akan tertimpa; akun lain tidak berubah.");
  if(!window.confirm(question)){
   notice=T("Cancelled. Cloud watchlist unchanged.","Dibatalkan. Watchlist akun tidak berubah.");return;
  }
  // Recheck before mutation. Avoid knowingly overwriting another device's changes.
  const latest=await call("/api/preferences");
  if(latest.enrolled!==remote.enrolled||JSON.stringify(latest.preferences)!==before)
   throw Error(T("Account changed on another device. Review again before saving.","Akun berubah di perangkat lain. Periksa kembali sebelum menyimpan."));
  const saved=await call("/api/preferences","PUT",local);
  if(!saved.enrolled||JSON.stringify(saved.preferences)!==after)throw Error("Account save response mismatch");
  notice=T("Account preferences saved after your confirmation. Email and push are off.","Preferensi akun tersimpan setelah konfirmasi. Email dan push tidak aktif.");
 }));
 actions.append(button(T("Replace this browser's watchlist from account","Ganti watchlist browser dari akun"),async()=>{
  const data=await call("/api/preferences");
  if(!data.enrolled){notice=T("No saved account preferences yet.","Belum ada preferensi akun tersimpan.");return}
  if(!Array.isArray(data.preferences?.tickers))throw Error("Invalid server watchlist");
  const current=tickers(),incoming=data.preferences.tickers.filter(x=>/^[A-Z0-9]{4}$/.test(x)).slice(0,30);
  if(JSON.stringify(current)===JSON.stringify(incoming)){
   notice=T("Browser tickers already match the account. No changes needed.","Ticker browser sudah sesuai dengan akun. Tidak ada perubahan.");return;
  }
  const question=T("Replace this BROWSER's watchlist?\nBrowser: ","GANTI watchlist BROWSER ini?\nBrowser: ")+
   (current.join(", ")||"—")+T("\nAccount: ","\nAkun: ")+(incoming.join(", ")||"—")+
   T("\nThe account will NOT be changed.","\nData akun tidak akan diubah.");
  if(!window.confirm(question)){notice=T("Cancelled. Browser unchanged.","Dibatalkan. Browser tidak berubah.");return}
  if(!putJSON(WATCH_KEY,incoming))throw Error("local storage unavailable");
  putJSON(SECTOR_KEY,{enabled:data.preferences.include_sector===true,sector:data.preferences.sectors?.[0]||""});
  notice=T("Browser watchlist updated. Reload to refresh existing workspace.","Watchlist browser diperbarui. Muat ulang halaman untuk memperbarui workspace.");
 }));
 actions.append(button(T("Read private inbox","Baca inbox privat"),async()=>{
  const feed=await call("/api/inbox?limit=15");
  inboxItems=feed.items||[];
  notice=T("Unread notifications: ","Notifikasi belum dibaca: ")+feed.unread;
 }));
 root.append(actions);
 const inbox=E("div",undefined,"sli-uib-inbox");inbox.id="sliUserIntelligenceInbox";root.append(inbox);
 if(inboxItems.length)showInbox(inboxItems);
 if(notice)root.append(E("p",notice,"sli-uib-note"));
 root.append(E("p",T("Access requires a protected Worker session. No token is stored in the browser. Every watchlist replacement requires confirmation. Use separate browser profiles for different accounts.",
  "Akses memerlukan sesi Worker yang dilindungi. Tidak ada token yang disimpan di browser. Setiap penggantian watchlist harus Anda setujui. Gunakan profil browser terpisah untuk akun berbeda."),"sli-uib-foot"));
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
    await call("/api/inbox/read","POST",{ids:[item.id]});item.read_at=new Date().toISOString();
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