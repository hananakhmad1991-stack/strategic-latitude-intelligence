/* A PASS in this safety test means "the launch block works", NOT "launch approved".
 * Production access may never be inferred from owner staging success.
 */
import fs from "node:fs";
const load=p=>JSON.parse(fs.readFileSync(new URL("../"+p,import.meta.url),"utf8"));
export function evaluateDergubaLaunch(registry,config){
 const allowed=new Set(["PENDING","REJECTED","VERIFIED"]);
 const gates=Array.isArray(registry?.gates)?registry.gates:[];
 const ids=new Set(gates.map(x=>x.id));
 const required=["official_data_rights","pse_legal","customer_auth_privacy",
  "service_security_resilience","payment_billing","editorial_accuracy_live_reports","owner_release_authorization"];
 const schemaValid=registry?.schema==="sli-derguba-commercial-launch-gates-v1"&&
   required.every(x=>ids.has(x))&&gates.length===ids.size&&
   gates.every(x=>allowed.has(x.status)&&Array.isArray(x.evidence)&&x.critical===true);
 const missing=gates.filter(x=>x.status!=="VERIFIED"||!x.evidence.some(e=>
   /^https:\/\//.test(e.url||"")&&typeof e.reviewer==="string"&&e.reviewer.trim()&&
   /^\d{4}-\d{2}-\d{2}$/.test(e.reviewed_at||""))).map(x=>x.id);
 const flags={
  schema_valid:schemaValid,
  gates_verified:schemaValid&&missing.length===0,
  owner_authorized:registry?.sign_off==="APPROVED"&&registry.public_release_approved===true,
  customer_api_enabled:config?.api_enabled===true,
  customer_login_enabled:config?.login_enabled===true
 };
 const approved=flags.schema_valid&&flags.gates_verified&&flags.owner_authorized;
 const productionActive=flags.customer_api_enabled||flags.customer_login_enabled;
 return {schema:"sli-derguba-commercial-gate-verdict-v1",reviewed_at:new Date().toISOString(),
   stage:productionActive?"CUSTOMER_ACCESS_ACTIVE":"OWNER_ONLY_PRIVATE_STAGING",
   approved,release_status:approved?"OWNER_SIGNED_OFF":"NOT_APPROVED",
   safety_gate_pass:!productionActive||approved,
   missing_gate_evidence:missing,
   configuration:{
     customer_api_enabled:flags.customer_api_enabled,
     customer_login_enabled:flags.customer_login_enabled
   },
   warning:productionActive&&!approved?
     "CRITICAL: customer production endpoint/login enabled before all official signoffs":
     approved?"All recorded gates have evidence; still confirm manual operator deployment":
     "Paid public launch BLOCKED as intended; green CI only indicates protective controls are functioning"};
}
if(process.argv[1]&&new URL("file://"+process.argv[1]).pathname===new URL(import.meta.url).pathname){
 const res=evaluateDergubaLaunch(load("data/derguba-commercial-launch-gates.json"),
    load("data/sli-research-assistant-config.json"));
 console.log(JSON.stringify(res,null,2));
 if(!res.safety_gate_pass)process.exitCode=1;
}
