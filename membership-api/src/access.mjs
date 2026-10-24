// Shared tier rules. The Server MUST make the final authorization decision.
export const PLANS=Object.freeze({
 open:{sessions:1,export:false,rank:0},
 pro:{sessions:1,export:true,rank:1},
 intelligence_pro:{sessions:3,export:true,rank:2},
 enterprise:{sessions:10,export:true,rank:3} // seats & limits must be defined by contract before production
});
export const paidAccess=(p)=>p==='pro'||p==='intelligence_pro'||p==='enterprise';
export function canAccess(plan,feature){
 const p=PLANS[plan]||PLANS.open;
 if(feature==='download'||feature==='export'||feature==='embed')return p.export;
 if(feature==='weekly_personalized'||feature==='alerts')return p.rank>=2;
 if(feature==='team')return p.rank>=3;
 if(feature==='provincial'||feature==='research')return p.rank>=1;
 return true;
}
export function effectivePlan(row,now=Date.now()){
 if(!row||!['active','trialing'].includes(row.status)||!Number.isFinite(Date.parse(row.access_until))||Date.parse(row.access_until)<=now)return 'open';
 return Object.hasOwn(PLANS,row.plan)?row.plan:'open';
}
