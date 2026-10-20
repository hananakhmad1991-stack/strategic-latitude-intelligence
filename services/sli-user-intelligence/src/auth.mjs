// Cloudflare Access ID verification. No unsigned email headers, no localStorage bearer tokens.
export class HttpError extends Error{
 constructor(status,message){super(message);this.status=status}
}
const decode=(s)=>{try{return JSON.parse(atob(s.replace(/-/g,"+").replace(/_/g,"/")))}catch{throw new HttpError(401,"Invalid Access assertion")}};
const bytes=(s)=>Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
let cached={url:"",keys:null,until:0};
export async function requireIdentity(request,env,fetcher=fetch){
 const issuer=String(env.CF_ACCESS_ISSUER||"").replace(/\/$/,""),aud=String(env.CF_ACCESS_AUD||"");
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer)||!aud)
  throw new HttpError(503,"Cloudflare Access authentication not configured");
 const jwt=request.headers.get("Cf-Access-Jwt-Assertion")||"";
 const parts=jwt.split(".");if(parts.length!==3)throw new HttpError(401,"Cloudflare Access login required");
 const head=decode(parts[0]),payload=decode(parts[1]);
 if(head.alg!=="RS256"||!head.kid||typeof head.kid!=="string")throw new HttpError(401,"Unsupported Access JWT");
 const now=Math.floor(Date.now()/1000);
 if(payload.iss!==issuer||!(typeof payload.aud==="string"?payload.aud===aud:Array.isArray(payload.aud)&&payload.aud.includes(aud))||
 !payload.sub||typeof payload.sub!=="string"||payload.sub.length>512||
 !Number.isFinite(payload.exp)||payload.exp<=now||payload.exp>now+86400||
 (payload.nbf!==undefined&&(!Number.isFinite(payload.nbf)||payload.nbf>now+60))||
 (payload.iat!==undefined&&(!Number.isFinite(payload.iat)||payload.iat>now+60)))
  throw new HttpError(401,"Invalid Access JWT claims");
 const jwksURL=issuer+"/cdn-cgi/access/certs";
 if(cached.url!==jwksURL||cached.until<Date.now()){
  let response;try{response=await fetcher(jwksURL,{redirect:"error",signal:AbortSignal.timeout(3500)})}catch{
   throw new HttpError(503,"Access key validation unavailable");
  }
  if(!response.ok)throw new HttpError(503,"Access certificates unavailable");
  const jwks=await response.json();
  if(!Array.isArray(jwks.keys)||jwks.keys.length===0)throw new HttpError(503,"Invalid Access key set");
  cached={url:jwksURL,keys:jwks.keys,until:Date.now()+5*60*1000};
 }
 const jwk=cached.keys.find(k=>k.kid===head.kid&&k.kty==="RSA");
 if(!jwk)throw new HttpError(401,"Unknown Access signing key");
 let verified=false;
 try{
  const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
  verified=await crypto.subtle.verify({name:"RSASSA-PKCS1-v1_5"},key,bytes(parts[2]),new TextEncoder().encode(parts[0]+"."+parts[1]));
 }catch{throw new HttpError(401,"Invalid Access signature")}
 if(!verified)throw new HttpError(401,"Invalid Access signature");
 const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(issuer+"|"+aud+"|"+payload.sub));
 const id=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,"0")).join("");
 return {id,provider:"cloudflare_access"};
}
