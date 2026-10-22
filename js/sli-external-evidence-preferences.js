/* Non-sensitive, browser-local permission ONLY.
 * Do not store questions, access tokens, provider credentials or uploaded data.
 * A new browser has NO default permission; the user must opt in first.
 */
(()=>{
 "use strict";
 const KEY="sli-external-web-permission-v1";
 window.SLIExternalEvidencePrefs=Object.freeze({
  read(){
   try{return localStorage.getItem(KEY)==="approved"}catch{return false}
  },
  write(allowed){
   try{
    if(allowed===true)localStorage.setItem(KEY,"approved");
    else localStorage.removeItem(KEY);
   }catch{/* unavailable storage means one-question consent only */}
  }
 });
})();
