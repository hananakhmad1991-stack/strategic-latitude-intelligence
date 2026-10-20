// Strict, deterministic preference model. No price recommendations or inferred issuer ownership.
import {HttpError} from "./auth.mjs";
const SECTORS=new Set(["energy","minerals","coal","food","technology","infrastructure","transport","manufacturing"]);
const KINDS=new Set(["news","project","regulation"]);
const alias={energy:["electricity","oilgas"],minerals:["minerba"],coal:["minerba","energy"],
 technology:["ai","digital"],transport:["trade"],food:["agriculture"],manufacturing:["industry"]};
export const DEFAULT_PREFS=Object.freeze({tickers:[],sectors:[],kinds:["news","project","regulation"],include_sector:false,in_app:true});
export function validatePreferences(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw new HttpError(400,"Invalid preferences");
 if(Object.keys(input).some(k=>!Object.keys(DEFAULT_PREFS).includes(k)))throw new HttpError(400,"Unsupported preference field");
 const tickers=input.tickers??[];
 const sectors=input.sectors??[];
 const kinds=input.kinds??[...KINDS];
 if(!Array.isArray(tickers)||tickers.length>30||tickers.some(x=>typeof x!=="string"||!(/^[A-Z0-9]{4}$/).test(x))||
 !Array.isArray(sectors)||sectors.length>8||sectors.some(x=>!SECTORS.has(x))||
 !Array.isArray(kinds)||kinds.length>3||kinds.some(x=>!KINDS.has(x))||
 typeof(input.include_sector??false)!=="boolean"||typeof(input.in_app??true)!=="boolean")
  throw new HttpError(400,"Invalid preference values");
 return {tickers:[...new Set(tickers)],sectors:[...new Set(sectors)],kinds:[...new Set(kinds)],
  include_sector:input.include_sector??false,in_app:input.in_app??true};
}
export function eventKind(event){
 const kind=String(event.kind||"");
 if(kind==="news_indexed"||kind==="official_metadata_indexed")return "news";
 if(kind.startsWith("project_"))return "project";
 if(kind.startsWith("regulation_"))return "regulation";
 return null;
}
export function eligible(event,prefs){
 const type=eventKind(event);
 if(!type||!prefs.in_app||!prefs.kinds.includes(type))return null;
 const tickers=(Array.isArray(event.ticker_links)?event.ticker_links:[]).map(x=>x.ticker);
 if(prefs.tickers.some(x=>tickers.includes(x)))return "direct";
 if(!prefs.include_sector)return null;
 const sector=String(event.sector||"");
 if(prefs.sectors.some(s=>sector===s||(alias[s]||[]).includes(sector)))return "sector";
 // No issuer-sector inference from ticker alone (would need a verified current issuer map).
 return null;
}
export function validateEvent(e){
 return !!(e&&typeof e.id==="string"&&/^sli-catalyst-[a-f0-9]{18}$/.test(e.id)&&
 typeof e.title==="string"&&e.title.length>=3&&e.title.length<=500&&
 typeof e.kind==="string"&&eventKind(e)&&
 typeof e.detected_at_utc==="string"&&!Number.isNaN(Date.parse(e.detected_at_utc))&&
 typeof e.source_url==="string"&&/^https:\/\/[^@\s/]+\/\S+/.test(e.source_url)&&
 Array.isArray(e.ticker_links)&&e.ticker_links.length<=30);
}
