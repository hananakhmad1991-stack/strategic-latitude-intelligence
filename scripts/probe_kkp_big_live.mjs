/* Live external evidence gate. No static layer polygons or private tokens are embedded here. */
import fs from "node:fs";
import path from "node:path";
import {fetchOfficialWPP} from "../js/sli-kkp-wpp-live.mjs";
const out="artifacts/sli-kkp-big-live-probe.json";
const report={schema:"sli-kkp-big-geoservice-live-probe-v1",checked_at_utc:new Date().toISOString(),
 publisher:"Badan Informasi Geospasial",geometry_source:"https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/21",
 imported_to_sli_public_repo:false,license_review_complete:false,legal_boundary_vintage_verified:false};
try{
 const r=await fetchOfficialWPP();
 Object.assign(report,{status:"verified_live_geometry_11_wpp",features:r.audit.features,vertices:r.audit.vertices,matched_wpp_codes:r.audit.codes,query_url:r.query_url});
 console.log("KKP BIG OFFICIAL WPP PASS",r.audit.features,"features",r.audit.vertices,"vertices",r.audit.codes.join(","));
}catch(e){
 Object.assign(report,{status:"unverified_no_geometry_fetched",failure_reason:String(e?.message||e).slice(0,240)});
 console.log("KKP BIG OFFICIAL WPP BLOCKED",report.failure_reason);
}
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+"\n");
if(process.env.REQUIRE_WPP_LIVE==="true"&&report.status!=="verified_live_geometry_11_wpp")process.exitCode=1;
