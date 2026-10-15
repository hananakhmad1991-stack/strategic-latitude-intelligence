/* SLI EN / ID language layer. Source materials, citations and headlines are never machine rewritten. */
(function(){
"use strict";
const stored=(()=>{try{return localStorage.getItem("sli-ui-language")}catch(e){return null}})();
let lang=stored==="id"?"id":"en";
const history=new WeakMap(),attributes=new WeakMap();
const labels=window.SLI_TRANSLATIONS_ID instanceof Map?window.SLI_TRANSLATIONS_ID:new Map();
const exclusions="script,style,pre,code,textarea,option[data-original],[data-sli-no-translate],.bio-news .bio-source,.bio-news a,.oa-daily-headline a,.events-card h3,.gov-lead a,#geoEvents article a,svg";
const glossary={
 en:[
  [/\bDitjen\s+EBTKE\b/gi,"Directorate General of NREEC"],
  [/\bDirjen\s+EBTKE\b/gi,"Director General of NREEC"],
  [/\bESDM\s+EBTKE\b/g,"MEMR NREEC"],
  [/\bEBTKE\b/g,"NRE/EC"],
  [/\bEBT\b/g,"NRE"],
  [/\bDitjen\s+Migas\b/g,"Directorate General of Oil and Gas"],
  [/\bMigas\b/g,"Oil & Gas"],
  [/\bJargas\b/g,"household gas networks"],
  [/\bESDM\b/g,"MEMR"],
  [/\bBBM\b/g,"petroleum fuels"]
 ],
 id:[
  [/\bMEMR\b/g,"ESDM"],
  [/\bNREEC\b/g,"Ditjen EBTKE"],
  [/\bNRE\/EC\b/g,"EBTKE"],
  [/\bNRE\b/g,"EBT"],
  [/\bhousehold gas networks\b/gi,"jaringan gas rumah tangga"],
  [/\bOil\s*&\s*Gas\b/g,"Migas"]
 ]
};
function lexical(text,code){
 let value=text;
 for(const [re,replacement] of glossary[code])value=value.replace(re,replacement);
 return value;
}
function translate(text,code=lang){
 const input=String(text);
 if(!input.trim())return input;
 const prefix=input.match(/^\s*/)[0],suffix=input.match(/\s*$/)[0],body=input.slice(prefix.length,input.length-suffix.length);
 if(!body)return input;
 // Preserve symbolic nav icons but translate their labels.
 const decor=body.match(/^([◈▦ϟ◇⌘▤☷]\s*)(.+)$/);
 const leading=decor?decor[1]:"",plain=decor?decor[2]:body;
 if(code==="en")return prefix+leading+lexical(plain,"en")+suffix;
 // Translate complete human-edited sentences before attempting a glossary fallback.
 const direct=labels.get(plain) || labels.get(lexical(plain,"en"));
 if(direct)return prefix+leading+direct+suffix;
 // Short, data-driven headings are normalized. Long expert commentary is not mistranslated.
 if(plain.length<=56)return prefix+leading+lexical(plain,"id")+suffix;
 return input;
}
function skipped(element){
 return Boolean(element&&element.closest&&element.closest(exclusions));
}
function updateText(node){
 if(!node||node.nodeType!==3||skipped(node.parentElement))return;
 const current=node.nodeValue;
 if(!current||!current.trim())return;
 let record=history.get(node);
 if(!record||record.last!==current)record={raw:current,last:current};
 const newText=translate(record.raw);
 record.last=newText;history.set(node,record);
 if(current!==newText)node.nodeValue=newText;
}
const translatableAttributes=["placeholder","aria-label","title"];
function updateAttributes(element){
 if(!element||element.nodeType!==1||skipped(element))return;
 let records=attributes.get(element);
 if(!records)records={};
 for(const attribute of translatableAttributes){
  if(!element.hasAttribute(attribute))continue;
  const current=element.getAttribute(attribute);
  if(!current)continue;
  let record=records[attribute];
  if(!record||record.last!==current)record={raw:current,last:current};
  const next=translate(record.raw);
  record.last=next;records[attribute]=record;
  if(current!==next)element.setAttribute(attribute,next);
 }
 if(element.tagName==="OPTGROUP"&&element.hasAttribute("label")){
  const current=element.label;let rec=records.label;
  if(!rec||rec.last!==current)rec={raw:current,last:current};
  const next=translate(rec.raw);rec.last=next;records.label=rec;if(current!==next)element.label=next;
 }
 attributes.set(element,records);
}
function scan(root){
 if(!root)return;
 if(root.nodeType===3){updateText(root);return}
 if(root.nodeType!==1&&root.nodeType!==9&&root.nodeType!==11)return;
 if(root.nodeType===1){if(skipped(root))return;updateAttributes(root)}
 const iter=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
 let next;while((next=iter.nextNode())){
  if(next.nodeType===3)updateText(next);
  else updateAttributes(next);
 }
}
let observer=null;
let pending=new Set(),scheduled=false;
function schedule(root){
 if(!root)return;
 pending.add(root);if(scheduled)return;scheduled=true;
 queueMicrotask(()=>{scheduled=false;const roots=[...pending];pending.clear();for(const node of roots)scan(node)});
}
function refreshSwitch(){
 document.documentElement.lang=lang==="id"?"id":"en";
 document.querySelectorAll("[data-sli-locale]").forEach(button=>{
  const active=button.dataset.sliLocale===lang;
  button.classList.toggle("active",active);
  button.setAttribute("aria-pressed",String(active));
 });
 const glossaryNote=document.getElementById("sli-language-guide");
 if(glossaryNote)glossaryNote.textContent=lang==="en"?
 "NRE = New & Renewable Energy · NREEC = Directorate General · MEMR = Ministry of Energy & Mineral Resources":
 "EBT = Energi Baru Terbarukan · EBTKE = EBT & Konservasi Energi · ESDM = Kementerian ESDM";
}
function setLanguage(code){
 if(code!=="en"&&code!=="id")return;
 const changed=lang!==code;lang=code;
 try{localStorage.setItem("sli-ui-language",code)}catch(e){}
 refreshSwitch();
 scan(document.body);
 if(changed)document.dispatchEvent(new CustomEvent("sli:languagechange",{detail:{language:lang}}));
}
function init(){
 refreshSwitch();
 document.querySelectorAll("[data-sli-locale]").forEach(button=>button.addEventListener("click",()=>setLanguage(button.dataset.sliLocale)));
 scan(document.body);
 if(observer)return;
 observer=new MutationObserver(mutations=>{
  for(const m of mutations){
   if(m.type==="characterData")schedule(m.target);
   else if(m.type==="childList")for(const added of m.addedNodes)schedule(added);
   else if(m.type==="attributes")schedule(m.target);
  }
 });
 observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label","label"]});
}
window.SLIi18n={get language(){return lang},setLanguage,translate,refresh:()=>scan(document.body),dictionarySize:labels.size};
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
